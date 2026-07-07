/* FunkVault Service Worker.
 * - Finishes video/mod uploads in the background via the Background Sync API,
 *   so an upload keeps going even after the user closes the tab.
 * - Shows OS notifications (upload done / failed, plus Web Push if configured)
 *   and refocuses the app when a notification is clicked.
 */
const DB_NAME = "fv-bg"
const STORE = "uploads"
const SYNC_TAG = "fv-bg-uploads"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

function openDb() {
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

function idbAll() {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly")
        const req = tx.objectStore(STORE).getAll()
        req.onsuccess = () => {
          resolve(req.result || [])
          db.close()
        }
        req.onerror = () => {
          reject(req.error)
          db.close()
        }
      }),
  )
}

function idbDelete(id) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite")
        tx.objectStore(STORE).delete(id)
        tx.oncomplete = () => {
          resolve()
          db.close()
        }
        tx.onerror = () => {
          reject(tx.error)
          db.close()
        }
      }),
  )
}

async function uploadFile(job, file) {
  const url = `${job.supaUrl}/storage/v1/object/${job.bucket}/${file.path}`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: job.anonKey,
      Authorization: `Bearer ${job.anonKey}`,
      "Content-Type": file.contentType || "application/octet-stream",
      "x-upsert": "true",
    },
    body: file.blob,
  })
  if (!res.ok) throw new Error(`storage ${res.status}`)
  return `${job.supaUrl}/storage/v1/object/public/${job.bucket}/${file.path}`
}

async function insertRow(job, row) {
  const res = await fetch(`${job.supaUrl}/rest/v1/${job.table}`, {
    method: "POST",
    headers: {
      apikey: job.anonKey,
      Authorization: `Bearer ${job.anonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  })
  if (!res.ok) throw new Error(`insert ${res.status}`)
}

async function processOne(job) {
  const urls = {}
  for (const f of job.files) {
    const key = f.field === "shot" ? `shot:${f.index}` : f.field
    urls[key] = await uploadFile(job, f)
  }
  const row = Object.assign({}, job.row)
  if (job.kind === "video") {
    if (urls.thumb) row.thumb = urls.thumb
  } else if (job.kind === "mod") {
    row.zip_url = urls.zip
    row.screenshots = job.files
      .filter((f) => f.field === "shot")
      .sort((a, b) => a.index - b.index)
      .map((f) => urls[`shot:${f.index}`])
  }
  await insertRow(job, row)
}

async function postAll(msg) {
  const cs = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  })
  for (const c of cs) c.postMessage(msg)
}

async function anyVisible() {
  const cs = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  })
  return cs.some((c) => c.visibilityState === "visible")
}

async function processQueue() {
  const jobs = await idbAll()
  let failed = false
  for (const job of jobs) {
    try {
      await processOne(job)
      await idbDelete(job.id)
      const visible = await anyVisible()
      if (!visible) {
        try {
          await self.registration.showNotification(job.text.doneTitle, {
            body: job.text.doneBody,
            icon: "/favicon.svg",
            badge: "/favicon.svg",
            tag: job.id,
            data: { url: "/" },
          })
        } catch (e) {
          /* notifications may be blocked */
        }
      }
      await postAll({
        type: "bg-upload-done",
        kind: job.kind,
        title: job.text.doneTitle,
        body: job.text.doneBody,
      })
    } catch (e) {
      failed = true
      await postAll({
        type: "bg-upload-failed",
        kind: job.kind,
        title: job.text.failTitle,
        body: job.text.failBody,
      })
    }
  }
  // Rejecting keeps the Background Sync registration alive so the browser
  // retries the remaining jobs later (with backoff).
  if (failed) throw new Error("some uploads failed")
}

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) event.waitUntil(processQueue())
})

self.addEventListener("message", (event) => {
  const d = event.data || {}
  if (d.type === "process-now") {
    event.waitUntil(processQueue().catch(() => {}))
  }
})

self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = {}
  }
  const title = data.title || "FunkVault"
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      data: { url: data.url || "/" },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const target =
    (event.notification.data && event.notification.data.url) || "/"
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((cs) => {
        for (const c of cs) {
          if ("focus" in c) return c.focus()
        }
        if (self.clients.openWindow) return self.clients.openWindow(target)
      }),
  )
})
