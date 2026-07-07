import { useEffect, useState } from "react"
import type { CSSProperties } from "react"
import { useI18n } from "../i18n"
import type { Lang } from "../i18n"
import {
  FiX,
  FiGlobe,
  FiCheck,
  FiLogOut,
  FiZap,
  FiDownloadCloud,
  FiDownload,
  FiRefreshCw,
  BsTelegram,
} from "./icons"
import { checkForUpdate, applyUpdate } from "../lib/update"
import type { UpdateInfo } from "../lib/update"
import { APP_VERSION } from "../version"

interface SettingsModalProps {
  onClose: () => void
  onLogout: () => void
  accountName: string
  accountEmail: string
}

function ChangeList({
  info,
  t,
}: {
  info: UpdateInfo | null
  t: (k: string) => string
}) {
  const added = info?.changes.added ?? []
  const fixed = info?.changes.fixed ?? []
  if (!added.length && !fixed.length) {
    return <p className="upd-empty">{t("upd_empty")}</p>
  }
  return (
    <div className="upd-changes">
      {added.length > 0 && (
        <div className="upd-grp">
          <span className="upd-grp-t upd-added">{t("upd_added")}</span>
          <ul>
            {added.map((c, i) => (
              <li key={"a" + i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {fixed.length > 0 && (
        <div className="upd-grp">
          <span className="upd-grp-t upd-fixed">{t("upd_fixed")}</span>
          <ul>
            {fixed.map((c, i) => (
              <li key={"f" + i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function SettingsModal({
  onClose,
  onLogout,
  accountName,
  accountEmail,
}: SettingsModalProps) {
  const { t, lang, setLang } = useI18n()

  const [info, setInfo] = useState<UpdateInfo | null>(null)
  const [checked, setChecked] = useState(false)
  const [checking, setChecking] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let alive = true
    void checkForUpdate().then((r) => {
      if (alive) {
        setInfo(r)
        setChecked(true)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  const langs: { id: Lang; label: string }[] = [
    { id: "ru", label: t("russian") },
    { id: "en", label: t("english") },
  ]

  const check = async () => {
    setChecking(true)
    const r = await checkForUpdate()
    setInfo(r)
    setChecked(true)
    setChecking(false)
  }

  const doUpdate = async () => {
    setUpdating(true)
    setProgress(0)
    const started = Date.now()
    const timer = window.setInterval(() => {
      const p = Math.min(96, ((Date.now() - started) / 1500) * 100)
      setProgress(p)
    }, 80)
    await new Promise((res) => setTimeout(res, 1600))
    window.clearInterval(timer)
    setProgress(100)
    await applyUpdate()
  }

  const sizeLabel =
    info && info.sizeMB > 0 ? `${info.sizeMB} ${t("mb")}` : `— ${t("mb")}`
  const fillStyle: CSSProperties = { width: `${Math.round(progress)}%` }

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

        <div className="set-section">
          <div className="set-section-title">
            <FiDownloadCloud size={17} /> {t("upd_section")}
          </div>

          {updating ? (
            <div className="upd-progress">
              <p className="upd-dl">
                {t("upd_downloading")} {Math.round(progress)}%
              </p>
              <div className="upd-track">
                <div className="upd-fill" style={fillStyle} />
              </div>
            </div>
          ) : info && info.hasUpdate ? (
            <div className="upd-card">
              <div className="upd-row">
                <span className="upd-badge">{t("upd_available")}</span>
                <span className="upd-size">{sizeLabel}</span>
              </div>
              <p className="upd-ver">
                {info.current} → {info.remote}
              </p>
              <ChangeList info={info} t={t} />
              <button className="upd-btn" type="button" onClick={doUpdate}>
                <FiDownload size={16} /> {t("upd_update_now")}
              </button>
              <p className="upd-note">{t("upd_reload_note")}</p>
            </div>
          ) : (
            <div className="upd-card">
              <p className="upd-current">
                {t("upd_current")}: <b>{APP_VERSION}</b>
              </p>
              {checked && <p className="upd-latest">{t("upd_latest")}</p>}
              <div className="upd-whatsnew">
                <p className="upd-wn-title">{t("upd_whatsnew")}</p>
                <ChangeList info={info} t={t} />
              </div>
              <button className="upd-check" type="button" onClick={check} disabled={checking}>
                <FiRefreshCw size={15} /> {checking ? t("upd_checking") : t("upd_check")}
              </button>
            </div>
          )}
        </div>

        <div className="set-section">
          <div className="set-section-title">
            <FiZap size={17} /> {t("about")}
          </div>
          <p className="set-version">
            FunkVault <span className="set-ver-badge">{t("version")}</span>
          </p>
        </div>

        <div className="set-section">
          <div className="set-section-title">
            <BsTelegram size={16} /> {t("set_follow")}
          </div>
          <a
            className="set-social"
            href="https://t.me/FunkVaultNews"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="set-social-tg">
              <BsTelegram size={18} />
            </span>
            <span className="set-social-info">
              <b>@FunkVaultNews</b>
              <span>{t("set_follow_sub")}</span>
            </span>
          </a>
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
