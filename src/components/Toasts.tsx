import { useNotifications } from "../lib/notifications"
import type { NotifKind } from "../lib/notifications"
import {
  FiCheckCircle,
  FiAlertCircle,
  FiUploadCloud,
  FiDownloadCloud,
  FiBell,
  FiX,
} from "./icons"

function iconFor(kind: NotifKind) {
  switch (kind) {
    case "success":
      return <FiCheckCircle size={20} />
    case "error":
      return <FiAlertCircle size={20} />
    case "upload":
      return <FiUploadCloud size={20} />
    case "update":
      return <FiDownloadCloud size={20} />
    default:
      return <FiBell size={20} />
  }
}

export function Toasts() {
  const { toasts, dismissToast } = useNotifications()
  if (!toasts.length) return null
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={"toast toast-" + t.kind}>
          <span className="toast-ic">{iconFor(t.kind)}</span>
          <div className="toast-body">
            <p className="toast-title">{t.title}</p>
            {t.body && <p className="toast-sub">{t.body}</p>}
          </div>
          <button
            className="toast-x"
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Close"
          >
            <FiX size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}
