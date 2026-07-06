import { useI18n } from "../i18n"
import type { Lang } from "../i18n"
import { FiX, FiGlobe, FiCheck, FiLogOut } from "./icons"

interface SettingsModalProps {
  onClose: () => void
  onLogout: () => void
  accountName: string
  accountEmail: string
}

export function SettingsModal({
  onClose,
  onLogout,
  accountName,
  accountEmail,
}: SettingsModalProps) {
  const { t, lang, setLang } = useI18n()

  const langs: { id: Lang; label: string }[] = [
    { id: "ru", label: t("russian") },
    { id: "en", label: t("english") },
  ]

  return (
    <div className="edit-overlay" onClick={onClose}>
      <div className="edit-modal set-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-head">
          <h3>{t("settings")}</h3>
          <button className="edit-close" type="button" onClick={onClose} aria-label="Close">
            <FiX size={20} />
          </button>
        </div>

        <div className="set-account">
          <div className="set-avatar">{accountName.charAt(0).toUpperCase() || "U"}</div>
          <div>
            <p className="set-name">{accountName}</p>
            <p className="set-email">{accountEmail}</p>
          </div>
        </div>

        <div className="set-section">
          <div className="set-section-title">
            <FiGlobe size={17} /> {t("language")}
          </div>
          <div className="set-lang">
            {langs.map((l) => (
              <button
                key={l.id}
                type="button"
                className={"set-lang-btn" + (lang === l.id ? " on" : "")}
                onClick={() => setLang(l.id)}
              >
                {l.label}
                {lang === l.id && <FiCheck size={16} />}
              </button>
            ))}
          </div>
        </div>

        <button className="set-logout" type="button" onClick={onLogout}>
          <FiLogOut size={17} /> {t("logout")}
        </button>

        <div className="edit-actions">
          <button className="btn-send" type="button" onClick={onClose}>
            {t("done")}
          </button>
        </div>
      </div>
    </div>
  )
}
