import { useNotifications } from "../lib/notifications"
import type { NotifKind } from "../lib/notifications"
import { useI18n } from "../i18n"
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
      return <FiCheckCircle size={18} />
    case "error":
      return <FiAlertCircle size={18} />
    case "upload":
      return <FiUploadCloud size={18} />
    case "update":
      return <FiDownloadCloud size={18} />
    default:
      return <FiBell size={18} />
  }
}

function ago(ts: number, t: (k: string) => string): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return t("just_now")
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { items, markAllRead, clearAll, permission, requestPermission } =
    useNotifications()
  const { t } = useI18n()

  return (
    <>
      <div className="notif-backdrop" onClick={onClose} />
      <div className="notif-panel" role="dialog" aria-label={t("notifs")}>
        <div className="notif-head">
          <h3>{t("notifs")}</h3>
          <button className="notif-x" type="button" onClick={onClose} aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        {permission !== "granted" && permission !== "unsupported" && (
          <button
            className="notif-enable"
            type="button"
            onClick={() => void requestPermission()}
          >
            <FiBell size={15} /> {t("notif_enable")}
          </button>
        )}

        {items.length > 0 && (
          <div className="notif-actions">
            <button type="button" onClick={markAllRead}>
              {t("notifs_mark")}
            </button>
            <button type="button" onClick={clearAll}>
              {t("notifs_clear")}
            </button>
          </div>
        )}

        <div className="notif-list">
          {items.length === 0 ? (
            <div className="notif-empty">
              <FiBell size={26} />
              <p>{t("notifs_empty")}</p>
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={"notif-item notif-" + n.kind + (n.read ? "" : " unread")}
              >
                <span className="ni-ic">{iconFor(n.kind)}</span>
                <div className="notif-txt">
                  <p className="notif-title">{n.title}</p>
                  {n.body && <p className="notif-sub">{n.body}</p>}
                  <span className="notif-time">{ago(n.ts, t)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
