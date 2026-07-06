import { useRef, useState } from "react"
import { FiUploadCloud, FiFolder } from "./icons"
import { useI18n } from "../i18n"

interface UploadZoneProps {
  onFiles: (files: FileList | File[]) => void
  busy?: boolean
}

export function UploadZone({ onFiles, busy }: UploadZoneProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("video/"),
    )
    if (files.length) onFiles(files)
  }

  return (
    <div
      className={"dropzone" + (drag ? " drag" : "")}
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
    >
      <div className="dz-badge" aria-hidden>
        <FiUploadCloud size={40} />
      </div>

      <div className="dz-body">
        <h2>{busy ? t("dz_loading") : t("dz_title")}</h2>
        <p>{t("dz_body")}</p>
        <div className="dz-actions">
          <button
            className="dz-pick"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            <FiFolder size={17} /> {t("dz_pick")}
          </button>
          <span className="dz-hint">{t("dz_hint")}</span>
        </div>
        <span className="dz-limit">{t("up_limit_hint")}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files && e.target.files.length) onFiles(e.target.files)
          e.target.value = ""
        }}
      />
    </div>
  )
}
