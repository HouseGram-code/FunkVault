import { FiHome, FiTrendingUp, FiVideo, FiUsers, FiUpload, FiPackage } from "./icons"
import type { Tab } from "../types"
import { useI18n } from "../i18n"

interface MobileNavProps {
  active: Tab
  channelActive: boolean
  onChange: (t: Tab) => void
  onOpenMyChannel: () => void
  onUpload: () => void
}

export function MobileNav({
  active,
  channelActive,
  onChange,
  onOpenMyChannel,
  onUpload,
}: MobileNavProps) {
  const { t } = useI18n()
  const tabOn = (tb: Tab) => active === tb && !channelActive

  return (
    <nav className="mobile-nav">
      <button
        className={"mn-item" + (tabOn("home") ? " on" : "")}
        type="button"
        onClick={() => onChange("home")}
      >
        <FiHome size={21} />
        <span>{t("nav_home")}</span>
      </button>
      <button
        className={"mn-item" + (tabOn("trending") ? " on" : "")}
        type="button"
        onClick={() => onChange("trending")}
      >
        <FiTrendingUp size={21} />
        <span>{t("nav_trending")}</span>
      </button>
      <button
        className={"mn-item" + (tabOn("mods") ? " on" : "")}
        type="button"
        onClick={() => onChange("mods")}
      >
        <FiPackage size={21} />
        <span>{t("nav_mods")}</span>
      </button>
      <button
        className="mn-item mn-upload"
        type="button"
        onClick={onUpload}
        aria-label={t("upload")}
      >
        <span className="mn-plus">
          <FiUpload size={22} />
        </span>
      </button>
      <button
        className={"mn-item" + (tabOn("subs") ? " on" : "")}
        type="button"
        onClick={() => onChange("subs")}
      >
        <FiVideo size={21} />
        <span>{t("nav_subs")}</span>
      </button>
      <button
        className={"mn-item" + (channelActive ? " on" : "")}
        type="button"
        onClick={onOpenMyChannel}
      >
        <FiUsers size={21} />
        <span>{t("nav_you")}</span>
      </button>
    </nav>
  )
}
