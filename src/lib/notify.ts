export type Permission = "default" | "granted" | "denied" | "unsupported"

export function notifyPermission(): Permission {
  if (typeof Notification === "undefined") return "unsupported"
  return Notification.permission as Permission
}

/** Ask the browser for notification permission (no-op if already decided). */
export async function ensureNotifyPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false
  if (Notification.permission === "granted") return true
  if (Notification.permission === "denied") return false
  try {
    const p = await Notification.requestPermission()
    return p === "granted"
  } catch {
    return false
  }
}

function fallbackNotification(title: string, opts: NotificationOptions): void {
  try {
    const n = new Notification(title, opts)
    n.onclick = () => {
      try {
        window.focus()
      } catch {
        /* ignore */
      }
      n.close()
    }
  } catch {
    /* ignore */
  }
}

/**
 * Show a real OS/browser notification when permission is granted. Prefers the
 * Service Worker registration so notifications still appear (and survive) when
 * the tab is in the background, and can be clicked to reopen the app.
 */
export function showSystemNotification(title: string, body?: string): void {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      return
    }
    const opts: NotificationOptions = {
      body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
    }
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready
        .then((reg) => reg.showNotification(title, opts))
        .catch(() => fallbackNotification(title, opts))
      return
    }
    fallbackNotification(title, opts)
  } catch {
    /* ignore */
  }
}
