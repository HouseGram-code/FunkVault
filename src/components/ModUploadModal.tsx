import { useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { useI18n } from "../i18n"
import { useNotifications } from "../lib/notifications"
import * as api from "../lib/api"
import { FiX, FiUpload, FiImage, FiPackage, FiTrash2 } from "./icons"

const MAX_ZIP = 150 * 1024 * 1024
const MIN_SHOTS = 4

interface Props {
  onClose: () => void
  onUploaded: () => void | Promise<void>
}

export function ModUploadModal({ onClose, onUploaded }: Props) {
  const { t } = useI18n()
  const { notify } = useNotifications()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [zip, setZip] = useState<File | null>(null)
  const [shots, setShots] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const zipRef = useRef<HTMLInputElement>(null)
  const shotRef = useRef<HTMLInputElement>(null)

  const previews = useMemo(() => shots.map((f) => URL.createObjectURL(f)), [shots])
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews])

  const pickZip = (f?: File) => {
    if (!f) return
    if (f.size > MAX_ZIP) {
      setError(t("mod_zip_toobig"))
      return
    }
    setZip(f)
    setError(null)
  }

  const addShots = (files: FileList | null) => {
    if (!files) return
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"))
    if (!imgs.length) return
    setShots((prev) => [...prev, ...imgs].slice(0, 10))
    setError(null)
  }

  const removeShot = (i: number) =>
    setShots((prev) => prev.filter((_, idx) => idx !== i))

  const submit = async () => {
    if (!title.trim()) {
      setError(t("mod_need_title"))
      return
    }
    if (!zip) {
      setError(t("mod_need_zip"))
      return
    }
    if (shots.length < MIN_SHOTS) {
      setError(t("mod_need_shots"))
      return
    }
    setBusy(true)
    setError(null)
    setProgress(0)
    try {
      await api.uploadMod({
        title: title.trim(),
        description: description.trim() || undefined,
        zip,
        screenshots: shots,
        onProgress: setProgress,
      })
      notify({
        kind: "success",
        title: t("mod_published"),
        body: t("mod_published_body", { title: title.trim() }),
        system: true,
      })
      await onUploaded()
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
          <h3>{t("mod_new_title")}</h3>
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

        <label className="edit-label">{t("mod_name")}</label>
        <input
          className="edit-input"
          value={title}
          maxLength={80}
          onChange={(e) => {
            setTitle(e.target.value)
            setError(null)
          }}
          placeholder={t("mod_name_ph")}
          autoFocus
          disabled={busy}
        />

        <label className="edit-label">
          {t("mod_desc")} <span className="edit-opt">({t("um_optional")})</span>
        </label>
        <textarea
          className="edit-input edit-textarea"
          value={description}
          rows={3}
          maxLength={2000}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("mod_desc_ph")}
          disabled={busy}
        />

        <label className="edit-label">{t("mod_zip")}</label>
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

        <label className="edit-label">
          {t("mod_shots_label")}
          <span className={"mod-shots-count" + (shots.length >= MIN_SHOTS ? " ok" : "")}>
            {shots.length}/{MIN_SHOTS}
          </span>
        </label>
        <div className="mod-shots-grid">
          {previews.map((src, i) => {
            const shotStyle: CSSProperties = { backgroundImage: `url(${src})` }
            return (
              <div className="mod-shot" key={i} style={shotStyle}>
                <button
                  type="button"
                  className="mod-shot-x"
                  onClick={() => removeShot(i)}
                  disabled={busy}
                  aria-label="Remove"
                >
                  <FiTrash2 size={13} />
                </button>
              </div>
            )
          })}
          {!busy && (
            <button
              type="button"
              className="mod-shot-add"
              onClick={() => shotRef.current?.click()}
            >
              <FiImage size={20} />
              <span>{t("mod_shots_pick")}</span>
            </button>
          )}
        </div>
        <input
          ref={shotRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addShots(e.target.files)
            e.currentTarget.value = ""
          }}
        />

        {error && <p className="auth-error">{error}</p>}

        {busy ? (
          <div className="mod-progress">
            <div className="upd-dl">
              {t("mod_uploading")} {progress}%
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
              <FiUpload size={16} /> {t("mod_publish")}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
