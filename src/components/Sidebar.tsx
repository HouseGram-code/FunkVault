import type { ComponentType } from "react"
import {
  FiHome,
  FiTrendingUp,
  FiVideo,
  FiUploadCloud,
  FiFilm,
  FiHeart,
  FiZap,
  FiUsers,
  FiShield,
} from "./icons"
import type { Tab } from "../types"
import { useI18n } from "../i18n"

interface SidebarProps {
  active: Tab
  onChange: (t: Tab) => void
  uploadCount: number
  onOpenMyChannel: () => void
  channelActive: boolean
}

type Item = { id: Tab; icon: ComponentType<{ size?: number }>; key: string }

const MAIN: Item[] = [
  { id: "home", icon: FiHome, key: "home" },
  { id: "trending", icon: FiTrendingUp, key: "trending" },
  { id: "subs", icon: FiVideo, key: "subscriptions" },
]

const YOU: Item[] = [
  { id: "uploads", icon: FiUploadCloud, key: "my_uploads" },
  { id: "library", icon: FiFilm, key: "library" },
  { id: "liked", icon: FiHeart, key: "liked_videos" },
]

export function Sidebar({
  active,
  onChange,
  uploadCount,
  onOpenMyChannel,
  channelActive,
}: SidebarProps) {
  const { t } = useI18n()

  const renderItem = (i: Item) => {
    const Icon = i.icon
    return (
      <button
        key={i.id}
        className={"nav-item" + (active === i.id ? " active" : "")}
        onClick={() => onChange(i.id)}
        type="button"
      >
        <span className="ic" aria-hidden>
          <Icon size={19} />
        </span>
        {t(i.key)}
        {i.id === "uploads" && uploadCount > 0 && (
          <span className="count">{uploadCount}</span>
        )}
      </button>
    )
  }

  return (
    <aside className="sidebar">
      <div className="nav-group">{MAIN.map(renderItem)}</div>
      <div className="side-divider" />
      <div className="nav-group">
        <div className="nav-title">{t("you")}</div>
        <button
          className={"nav-item" + (channelActive ? " active" : "")}
          onClick={onOpenMyChannel}
          type="button"
        >
          <span className="ic" aria-hidden>
            <FiUsers size={19} />
          </span>
          {t("your_channel")}
        </button>
        {YOU.map(renderItem)}
      </div>
      <div className="side-divider" />
      <div className="nav-group">
        <button
          className={"nav-item" + (active === "rules" ? " active" : "")}
          onClick={() => onChange("rules")}
          type="button"
        >
          <span className="ic" aria-hidden>
            <FiShield size={19} />
          </span>
          {t("rules")}
        </button>
      </div>
      <div className="side-divider" />
      <div className="side-tip">
        <span className="tip-ic"><FiZap size={16} /></span>
        <span>{t("tip")}</span>
      </div>
    </aside>
  )
}
