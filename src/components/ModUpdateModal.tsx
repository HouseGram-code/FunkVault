import { useRef, useState } from "react"
import type { CSSProperties } from "react"
import { useI18n } from "../i18n"
import { useNotifications } from "../lib/notifications"
import * as api from "../lib/api"
import type { Mod } from "../types"
import { FiX, FiUpload, FiPackage } from "./icons"

const MAX_ZIP = 150 * 1024 * 1024

interface Props {
  mod: Mod
  onClose: () => void
  onPublished: () => void | Promise<void>
}

export function ModUpdateModal({ mod, onClose, onPublished }: Props) {
  const { t } = useI18n()
  const { notify } = useNotifications()
  const [version, setVersion] = useState("")
  const [changelog, setChangelog] = useState("")
  const [zip, setZip] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const zipRef = useRef<HTMLInputElement>(null)

  const pickZip = (f?: File) => {
    if (!f) return
    if (f.size > MAX_ZIP) {
      setError(t("mod_zip_toobig"))
      return
    }
    setZip(f)
    setError(null)
  }

  const submit = async () => {
    if (!changelog.trim()) {
      setError(t("modupd_need_notes"))
      return
    }
    if (!zip) {
      setError(t("mod_need_zip"))
      return
    }
    setBusy(true)
    setError(null)
    setProgress(0)
    try {
      await api.addModUpdate({
        modId: mod.id,
        version: version.trim() || undefined,
        changelog: changelog.trim(),
        zip,
        onProgress: setProgress,
      })
      notify({
        kind: "success",
        title: t("modupd_pub_title"),
        body: t("modupd_pub_body", { title: mod.title }),
        system: true,
      })
      await onPublished()
      onClose()
    } catch (e) {
      console.error(e)
      setError(t("err_generic"))
      setBusy(false)
    }
  }

  const zipMB = zip
    ? (zip.size / (1024 * 1024)).toFixed(zip.size / (1024 * 1024) < 10 ? 1 : 0)
    : null
  const fillStyle: CSSProperties = { width: `${progress}%` }

  return (
    <div className="edit-overlay" onClick={busy ? undefined : onClose}>
      <div className="edit-modal mod-upload" onClick={(e) => e.stopPropagation()}>
        <div className="edit-head">
          <h3>{t("modupd_new_title")}</h3>
          <button
            className="edit-close"
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        <label className="edit-label">
          {t("modupd_version")} <span className="edit-opt">({t("um_optional")})</span>
        </label>
        <input
          className="edit-input"
          value={version}
          maxLength={24}
          onChange={(e) => {
            setVersion(e.target.value)
            setError(null)
          }}
          placeholder={t("modupd_version_ph")}
          autoFocus
          disabled={busy}
        />

        <label className="edit-label">{t("modupd_notes")}</label>
        <textarea
          className="edit-input edit-textarea"
          value={changelog}
          rows={4}
          maxLength={2000}
          onChange={(e) => {
            setChangelog(e.target.value)
            setError(null)
          }}
          placeholder={t("modupd_notes_ph")}
          disabled={busy}
        />

        <label className="edit-label">{t("modupd_zip")}</label>
        <div className="mod-file-row">
          <button
            type="button"
            className="mod-file-btn"
            onClick={() => zipRef.current?.click()}
            disabled={busy}
          >
            <FiPackage size={16} /> {zip ? t("mod_zip_change") : t("mod_zip_pick")}
          </button>
          <span className="mod-file-hint">
            {zip ? `${zip.name} · ${zipMB} ${t("mb")}` : t("mod_zip_hint")}
          </span>
        </div>
        <input
          ref={zipRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          hidden
          onChange={(e) => {
            pickZip(e.target.files?.[0])
            e.currentTarget.value = ""
          }}
        />

        {error && <p className="auth-error">{error}</p>}

        {busy ? (
          <div className="mod-progress">
            <div className="upd-dl">
              {t("modupd_uploading")} {progress}%
            </div>
            <div className="upd-track">
              <div className="upd-fill" style={fillStyle} />
            </div>
          </div>
        ) : (
          <div className="edit-actions">
            <button className="btn-ghost" type="button" onClick={onClose}>
              {t("cancel")}
            </button>
            <button className="btn-send" type="button" onClick={submit}>
              <FiUpload size={16} /> {t("modupd_publish")}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
