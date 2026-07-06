import { APP_VERSION } from "../version"

export interface UpdateChanges {
  added: string[]
  fixed: string[]
}

export interface UpdateInfo {
  current: string
  remote: string
  hasUpdate: boolean
  sizeMB: number
  date?: string
  changes: UpdateChanges
}

/**
 * Fetch /version.json (published with each deploy) and compare it to the
 * version baked into the running bundle. This is the standard way a static SPA
 * detects that a newer build is live without a backend.
 */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const res = await fetch(`/version.json?ts=${Date.now()}`, { cache: "no-store" })
    if (!res.ok) return null
    const data = (await res.json()) as Record<string, unknown>
    const remote = typeof data.version === "string" ? data.version : ""
    const rawChanges = (data.changes ?? {}) as Record<string, unknown>
    const toList = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []
    return {
      current: APP_VERSION,
      remote,
      hasUpdate: remote !== "" && remote !== APP_VERSION,
      sizeMB: typeof data.sizeMB === "number" ? data.sizeMB : 0,
      date: typeof data.date === "string" ? data.date : undefined,
      changes: { added: toList(rawChanges.added), fixed: toList(rawChanges.fixed) },
    }
  } catch {
    return null
  }
}

/** Clear caches / service workers, then hard-reload to pull the new build. */
export async function applyUpdate(): Promise<void> {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
  } catch {
    /* ignore */
  }
  try {
    if ("caches" in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  } catch {
    /* ignore */
  }
  window.location.reload()
}
