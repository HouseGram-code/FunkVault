import type { CSSProperties } from "react"
import { FiSearch, FiUpload, FiSettings, FiShield, FiBell } from "./icons"
import { Arrows } from "./Arrows"
import { useI18n } from "../i18n"

interface HeaderProps {
  query: string
  onQuery: (v: string) => void
  onUpload: () => void
  onOpenMyChannel: () => void
  onOpenSettings: () => void
  onOpenAdmin?: () => void
  onToggleNotifs: () => void
  unread: number
  isAdmin?: boolean
  myName: string
  myAvatar?: string
}

export function Header({
  query,
  onQuery,
  onUpload,
  onOpenMyChannel,
  onOpenSettings,
  onOpenAdmin,
  onToggleNotifs,
  unread,
  isAdmin,
  myName,
  myAvatar,
}: HeaderProps) {
  const { t } = useI18n()
  const avatarStyle: CSSProperties | undefined = myAvatar
    ? { backgroundImage: `url(${myAvatar})`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined

  return (
    <header className="header">
      <div className="brand">
        <div className="arrows">
          <Arrows size={15} />
        </div>
        <h1>
          <span className="vault">Funk</span>
          <span className="funk">Vault</span>
        </h1>
      </div>

      <div className="search">
        <span className="s-ic" aria-hidden>
          <FiSearch size={18} />
        </span>
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={t("search_placeholder")}
          aria-label={t("search")}
        />
        <button className="go" type="button">{t("search")}</button>
      </div>

      <div className="header-actions">
        <button className="upload-btn" type="button" onClick={onUpload}>
          <FiUpload size={17} />
          {t("upload")}
        </button>
        <button
          className="icon-btn notif-ic"
          type="button"
          title={t("notifs")}
          aria-label={t("notifs")}
          onClick={onToggleNotifs}
        >
          <FiBell size={19} />
          {unread > 0 && (
            <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>
          )}
        </button>
        {isAdmin && (
          <button
            className="icon-btn admin-ic"
            type="button"
            title={t("admin_title")}
            aria-label={t("admin_title")}
            onClick={onOpenAdmin}
          >
            <FiShield size={19} />
          </button>
        )}
        <button
          className="icon-btn"
          type="button"
          title={t("settings")}
          aria-label={t("settings")}
          onClick={onOpenSettings}
        >
          <FiSettings size={20} />
        </button>
        <button
          className="avatar"
          type="button"
          title={t("your_channel")}
          onClick={onOpenMyChannel}
          style={avatarStyle}
        >
          {!myAvatar && (myName.charAt(0).toUpperCase() || "Y")}
        </button>
      </div>
    </header>
  )
}
