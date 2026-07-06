import { useRef, useState } from "react"
import { FiUploadCloud, FiFolder } from "./icons"

interface UploadZoneProps {
  onFiles: (files: FileList | File[]) => void
  busy?: boolean
}

export function UploadZone({ onFiles, busy }: UploadZoneProps) {
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
        <h2>{busy ? "Loading your video..." : "Drop a video to upload"}</h2>
        <p>
          Drag &amp; drop an MP4, WebM or MOV here, or browse your files. We grab
          a thumbnail automatically and drop it straight into your vault.
        </p>
        <div className="dz-actions">
          <button
            className="dz-pick"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            <FiFolder size={17} /> Select video
          </button>
          <span className="dz-hint">or drop it anywhere in this box</span>
        </div>
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
