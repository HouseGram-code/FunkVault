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

/** Show a real OS/browser notification when permission is granted. */
export function showSystemNotification(title: string, body?: string): void {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const n = new Notification(title, {
        body,
        icon: "/favicon.svg",
        badge: "/favicon.svg",
      })
      n.onclick = () => {
        try {
          window.focus()
        } catch {
          /* ignore */
        }
        n.close()
      }
    }
  } catch {
    /* ignore */
  }
}
