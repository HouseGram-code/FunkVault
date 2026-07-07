// Background upload plumbing: hand video/mod uploads to the Service Worker so
// they keep going (and notify on completion) even if the user leaves the site.
import * as api from "./api"
import type { BgJob } from "./api"

const DB_NAME = "fv-bg"
const STORE = "uploads"
const SYNC_TAG = "fv-bg-uploads"

/** True when the browser can run uploads in the background after the tab closes. */
export function bgSupported(): boolean {
  return (
    typeof indexedDB !== "undefined" &&
    "serviceWorker" in navigator &&
    typeof ServiceWorkerRegistration !== "undefined" &&
    "sync" in ServiceWorkerRegistration.prototype
  )
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function putJob(job: BgJob): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).put(job)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

async function requestSync(): Promise<void> {
  const reg = await navigator.serviceWorker.ready
  const sync = (
    reg as unknown as { sync?: { register: (tag: string) => Promise<void> } }
  ).sync
  if (sync) {
    try {
      await sync.register(SYNC_TAG)
    } catch {
      /* ignore */
    }
  }
  // Nudge the worker to start right away when we already have connectivity.
  reg.active?.postMessage({ type: "process-now" })
}

async function enqueue(job: BgJob): Promise<boolean> {
  if (!bgSupported()) return false
  try {
    await navigator.serviceWorker.ready
    await putJob(job)
    await requestSync()
    return true
  } catch {
    return false
  }
}

/** Queue a video upload for the background worker. Returns false if unsupported. */
export async function queueVideoUpload(
  file: File,
  meta: api.UploadMeta,
  text: api.BgJobText,
): Promise<boolean> {
  if (!bgSupported()) return false
  try {
    const job = await api.prepareVideoJob(file, meta, text)
    return await enqueue(job)
  } catch {
    return false
  }
}

/** Queue a mod upload for the background worker. Returns false if unsupported. */
export async function queueModUpload(
  input: api.ModUploadInput,
  text: api.BgJobText,
): Promise<boolean> {
  if (!bgSupported()) return false
  try {
    const job = await api.prepareModJob(input, text)
    return await enqueue(job)
  } catch {
    return false
  }
}

/** Register the Service Worker (call once at startup). */
export function registerBackgroundWorker(): void {
  if (!("serviceWorker" in navigator)) return
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* ignore registration failures */
    })
  })
}

export type BgMessage = {
  type: "bg-upload-done" | "bg-upload-failed"
  kind: "video" | "mod"
  title?: string
  body?: string
}

/** Subscribe to background upload results. Returns an unsubscribe function. */
export function onBackgroundMessage(cb: (m: BgMessage) => void): () => void {
  if (!("serviceWorker" in navigator)) return () => {}
  const handler = (e: MessageEvent) => {
    const d = e.data as BgMessage | undefined
    if (d && (d.type === "bg-upload-done" || d.type === "bg-upload-failed")) {
      cb(d)
    }
  }
  navigator.serviceWorker.addEventListener("message", handler)
  return () => navigator.serviceWorker.removeEventListener("message", handler)
}
