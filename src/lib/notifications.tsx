import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  ensureNotifyPermission,
  notifyPermission,
  showSystemNotification,
} from "./notify"
import type { Permission } from "./notify"

export type NotifKind = "info" | "success" | "error" | "upload" | "update"

export interface NotifItem {
  id: string
  kind: NotifKind
  title: string
  body?: string
  ts: number
  read: boolean
}

export interface Toast {
  id: string
  kind: NotifKind
  title: string
  body?: string
}

interface NotifyInput {
  kind: NotifKind
  title: string
  body?: string
  system?: boolean
  toast?: boolean
}

interface Ctx {
  items: NotifItem[]
  toasts: Toast[]
  unread: number
  permission: Permission
  notify: (n: NotifyInput) => void
  dismissToast: (id: string) => void
  markAllRead: () => void
  clearAll: () => void
  requestPermission: () => Promise<boolean>
}

const KEY = "fv_notifs"
const MAX = 60

const NotificationsContext = createContext<Ctx | null>(null)

function loadItems(): NotifItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as NotifItem[]
    return Array.isArray(arr) ? arr.slice(0, MAX) : []
  } catch {
    return []
  }
}

let counter = 0
function uid(): string {
  counter += 1
  return `${Date.now()}-${counter}`
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotifItem[]>(() => loadItems())
  const [toasts, setToasts] = useState<Toast[]>([])
  const [permission, setPermission] = useState<Permission>(() => notifyPermission())
  const timers = useRef<Record<string, number>>({})

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)))
    } catch {
      /* ignore */
    }
  }, [items])

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
    const h = timers.current[id]
    if (h) {
      window.clearTimeout(h)
      delete timers.current[id]
    }
  }, [])

  const notify = useCallback(
    (n: NotifyInput) => {
      const id = uid()
      const item: NotifItem = {
        id,
        kind: n.kind,
        title: n.title,
        body: n.body,
        ts: Date.now(),
        read: false,
      }
      setItems((prev) => [item, ...prev].slice(0, MAX))
      if (n.toast !== false) {
        setToasts((prev) => [...prev, { id, kind: n.kind, title: n.title, body: n.body }])
        timers.current[id] = window.setTimeout(() => dismissToast(id), 5200)
      }
      if (n.system) showSystemNotification(n.title, n.body)
    },
    [dismissToast],
  )

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((i) => (i.read ? i : { ...i, read: true })))
  }, [])

  const clearAll = useCallback(() => setItems([]), [])

  const requestPermission = useCallback(async () => {
    const ok = await ensureNotifyPermission()
    setPermission(notifyPermission())
    return ok
  }, [])

  const unread = items.reduce((n, i) => (i.read ? n : n + 1), 0)

  const value = useMemo<Ctx>(
    () => ({
      items,
      toasts,
      unread,
      permission,
      notify,
      dismissToast,
      markAllRead,
      clearAll,
      requestPermission,
    }),
    [
      items,
      toasts,
      unread,
      permission,
      notify,
      dismissToast,
      markAllRead,
      clearAll,
      requestPermission,
    ],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications(): Ctx {
  const c = useContext(NotificationsContext)
  if (!c) throw new Error("useNotifications must be used within NotificationsProvider")
  return c
}
