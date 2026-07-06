const CH_COLORS = ["#ff2d8f", "#22d3ee", "#35d67f", "#ffcf3d", "#a35bff", "#ff5c72"]

/** Deterministic accent color for a channel/user name. */
export function channelColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return CH_COLORS[h % CH_COLORS.length]
}

/** Format seconds as m:ss or h:mm:ss */
export function formatDuration(sec: number): string {
  if (!sec || !isFinite(sec)) return "0:00"
  const s = Math.floor(sec % 60)
  const m = Math.floor((sec / 60) % 60)
  const h = Math.floor(sec / 3600)
  const ss = String(s).padStart(2, "0")
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${ss}`
  return `${m}:${ss}`
}

/** Pretty file size */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let n = bytes / 1024
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(1)} ${units[i]}`
}

/** Strip extension and prettify a filename into a title */
export function titleFromFile(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Untitled clip"
}

/**
 * Load an uploaded video file, read its duration and grab a frame
 * (~1/3 in) to use as a thumbnail. Resolves even if capture fails.
 */
export function captureThumbnail(
  file: File,
): Promise<{ url: string; thumb?: string; duration: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement("video")
    video.preload = "metadata"
    video.muted = true
    video.playsInline = true
    video.src = url

    let done = false
    const finish = (thumb?: string, duration = 0) => {
      if (done) return
      done = true
      resolve({ url, thumb, duration })
    }

    video.addEventListener("loadeddata", () => {
      const target = Math.min(1.2, (video.duration || 3) / 3)
      try {
        video.currentTime = target
      } catch {
        finish(undefined, video.duration)
      }
    })

    video.addEventListener("seeked", () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = 480
        canvas.height = 270
        const ctx = canvas.getContext("2d")
        if (!ctx) return finish(undefined, video.duration)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        finish(canvas.toDataURL("image/jpeg", 0.82), video.duration)
      } catch {
        finish(undefined, video.duration)
      }
    })

    video.addEventListener("error", () => finish(undefined, 0))
    // Safety timeout
    setTimeout(() => finish(undefined, video.duration || 0), 6000)
  })
}
