import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { captureThumbnail, titleFromFile } from "../utils"
import type { UploadMeta } from "../lib/api"
import { useI18n } from "../i18n"
import { FiX, FiImage, FiUpload } from "./icons"

interface UploadModalProps {
  file: File
  publishing: boolean
  onPublish: (meta: UploadMeta) => void
  onCancel: () => void
}

export function UploadModal({ file, publishing, onPublish, onCancel }: UploadModalProps) {
  const { t } = useI18n()
  const [title, setTitle] = useState(titleFromFile(file.name))
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [autoThumb, setAutoThumb] = useState<string | undefined>(undefined)
  const [customPreview, setCustomPreview] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const thumbRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let alive = true
    void captureThumbnail(file).then((r) => {
      if (alive) setAutoThumb(r.thumb)
    })
    return () => {
      alive = false
    }
  }, [file])

  const preview = customPreview ?? autoThumb
  const previewStyle: CSSProperties = preview
    ? { backgroundImage: `url(${preview})` }
    : { background: "linear-gradient(135deg,#ff2d8f,#a35bff)" }

  const pickThumb = (f: File | undefined) => {
    if (!f) return
    setThumbFile(f)
    setCustomPreview(URL.createObjectURL(f))
  }

  const publish = () => {
    if (!title.trim()) {
      setError(t("um_title_required"))
      return
    }
    onPublish({
      title: title.trim(),
      description: description.trim() || undefined,
      tags: tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      thumbFile,
    })
  }

  return (
    <div className="edit-overlay" onClick={publishing ? undefined : onCancel}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-head">
          <h3>{t("um_title")}</h3>
          <button
            className="edit-close"
            type="button"
            onClick={onCancel}
            aria-label="Close"
            disabled={publishing}
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="um-preview" style={previewStyle}>
          <span className="um-file">{file.name}</span>
        </div>

        <label className="edit-label">{t("um_video_title")}</label>
        <input
          className="edit-input"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setError(null)
          }}
          placeholder={t("um_video_title_ph")}
          maxLength={120}
          autoFocus
        />

        <label className="edit-label">
          {t("um_description")} <span className="edit-opt">({t("um_optional")})</span>
        </label>
        <textarea
          className="edit-input edit-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("um_description_ph")}
          rows={3}
          maxLength={2000}
        />

        <label className="edit-label">
          {t("um_tags")} <span className="edit-opt">({t("um_optional")})</span>
        </label>
        <input
          className="edit-input"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder={t("um_tags_ph")}
          maxLength={200}
        />

        <label className="edit-label">
          {t("um_thumb")} <span className="edit-opt">({t("um_optional")})</span>
        </label>
        <div className="um-thumb-row">
          <button
            type="button"
            className="um-thumb-btn"
            onClick={() => thumbRef.current?.click()}
          >
            <FiImage size={16} /> {customPreview ? t("um_change_thumb") : t("um_add_thumb")}
          </button>
          <span className="um-thumb-hint">{t("um_thumb_hint")}</span>
        </div>
        <input
          ref={thumbRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            pickThumb(e.target.files?.[0])
            e.currentTarget.value = ""
          }}
        />

        {error && <p className="auth-error">{error}</p>}

        <div className="edit-actions">
          <button className="btn-ghost" type="button" onClick={onCancel} disabled={publishing}>
            {t("cancel")}
          </button>
          <button className="btn-send" type="button" onClick={publish} disabled={publishing}>
            <FiUpload size={16} /> {publishing ? t("um_publishing") : t("um_publish")}
          </button>
        </div>
      </div>
    </div>
  )
}
