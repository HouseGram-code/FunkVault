import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { FiDownload, FiRefreshCw, FiX } from "./icons"
import { useI18n } from "../i18n"
import { checkForUpdate, applyUpdate } from "../lib/update"
import type { UpdateInfo } from "../lib/update"

/**
 * A real, always-visible update banner. It polls the published version.json
 * and, as soon as a newer build is live, shows a fixed bar with a working
 * "Update now" button. Pressing it clears caches + service workers and hard
 * reloads, so every user really gets the new version.
 */
export function UpdateBanner() {
  const { t } = useI18n()
  const [info, setInfo] = useState<UpdateInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<number | null>(null)

  // Poll version.json on mount and every 60s so the banner appears for everyone.
  useEffect(() => {
    let alive = true
    const run = async () => {
      const r = await checkForUpdate()
      if (!alive) return
      setInfo(r)
      // A freshly published version should always resurface the banner.
      if (r && r.hasUpdate) setDismissed(false)
    }
    void run()
    const id = window.setInterval(run, 60000)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])

  const doUpdate = async () => {
    if (updating) return
    setUpdating(true)
    setProgress(0)
    const started = Date.now()
    timerRef.current = window.setInterval(() => {
      const p = Math.min(96, ((Date.now() - started) / 1500) * 100)
      setProgress(p)
    }, 80)
    await new Promise((res) => setTimeout(res, 1600))
    if (timerRef.current) window.clearInterval(timerRef.current)
    setProgress(100)
    await applyUpdate() // clears caches + service workers, then hard-reloads
  }

  if (!info || !info.hasUpdate || dismissed) return null

  const sizeLabel = info.sizeMB > 0 ? ` · ${info.sizeMB} ${t("mb")}` : ""
  const fillStyle: CSSProperties = { width: `${Math.round(progress)}%` }

  return (
    <div className="update-banner" role="alert">
      <div className="ub-inner">
        <span className="ub-dot" aria-hidden />
        <div className="ub-text">
          <b className="ub-title">{t("upd_available")}</b>
          <span className="ub-sub">
            {t("upd_new_version", { v: info.remote })}
            {sizeLabel}
          </span>
        </div>
        <div className="ub-actions">
          <button
            className="ub-btn"
            type="button"
            onClick={doUpdate}
            disabled={updating}
          >
            {updating ? (
              <>
                <FiRefreshCw size={16} className="ub-spin" />{" "}
                {t("upd_downloading")} {Math.round(progress)}%
              </>
            ) : (
              <>
                <FiDownload size={16} /> {t("upd_update_now")}
              </>
            )}
          </button>
          {!updating && (
            <button
              className="ub-later"
              type="button"
              onClick={() => setDismissed(true)}
              aria-label={t("upd_later")}
              title={t("upd_later")}
            >
              <FiX size={18} />
            </button>
          )}
        </div>
      </div>
      {updating && (
        <div className="ub-track">
          <div className="ub-fill" style={fillStyle} />
        </div>
      )}
    </div>
  )
}
