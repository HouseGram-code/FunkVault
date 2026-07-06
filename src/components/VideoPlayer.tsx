import { useCallback, useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import {
  BsPlayFill,
  BsPauseFill,
  FiVolume2,
  FiVolumeX,
  FiSettings,
  FiMaximize,
  FiMinimize,
  FiCheck,
  FiArrowLeft,
} from "./icons"

interface VideoPlayerProps {
  src: string
  poster?: string
}

const QUALITY_STEPS = [2160, 1440, 1080, 720, 480, 360, 240, 144]
const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

function fmt(t: number): string {
  if (!isFinite(t) || t < 0) return "0:00"
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = Math.floor(t % 60)
  const ss = s.toString().padStart(2, "0")
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${ss}`
  return `${m}:${ss}`
}

type Menu = null | "main" | "speed" | "quality"

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const hideTimer = useRef<number>(0)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [fs, setFs] = useState(false)
  const [nativeH, setNativeH] = useState(0)
  const [quality, setQuality] = useState<"auto" | number>("auto")
  const [menu, setMenu] = useState<Menu>(null)
  const [active, setActive] = useState(true)

  const downscale = quality !== "auto"
  const qualities = nativeH ? QUALITY_STEPS.filter((q) => q <= nativeH) : []

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play()
    else v.pause()
  }, [])

  const showControls = useCallback(() => {
    setActive(true)
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => {
      if (!videoRef.current?.paused) setActive(false)
    }, 2600)
  }, [])

  // Sync playback rate + volume to the element
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.playbackRate = speed
  }, [speed])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.volume = volume
    v.muted = muted
  }, [volume, muted])

  // Fullscreen change listener
  useEffect(() => {
    const onFs = () => setFs(document.fullscreenElement === wrapRef.current)
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])

  // Canvas downscale render loop for real quality reduction
  useEffect(() => {
    if (!downscale) return
    const v = videoRef.current
    const c = canvasRef.current
    if (!v || !c) return
    const ctx = c.getContext("2d")
    if (!ctx) return
    let stop = false
    const draw = () => {
      if (stop) return
      const targetH = quality as number
      const ratio = v.videoWidth && v.videoHeight ? v.videoWidth / v.videoHeight : 16 / 9
      const h = targetH
      const w = Math.max(1, Math.round(h * ratio))
      if (c.width !== w || c.height !== h) {
        c.width = w
        c.height = h
      }
      try {
        ctx.drawImage(v, 0, 0, w, h)
      } catch {
        /* frame not ready */
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      stop = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [downscale, quality])

  const toggleFs = () => {
    const el = wrapRef.current
    if (!el) return
    if (document.fullscreenElement === el) document.exitFullscreen?.()
    else el.requestFullscreen?.()
  }

  const seek = (t: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = t
    setCurrent(t)
  }

  // Keyboard shortcuts scoped to the player
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      const v = videoRef.current
      if (!v) return
      if (e.key === " " || e.key === "k") {
        e.preventDefault()
        togglePlay()
      } else if (e.key === "ArrowRight") {
        seek(Math.min(duration, v.currentTime + 5))
      } else if (e.key === "ArrowLeft") {
        seek(Math.max(0, v.currentTime - 5))
      } else if (e.key === "f") {
        toggleFs()
      } else if (e.key === "m") {
        setMuted((m) => !m)
      }
    }
    el.addEventListener("keydown", onKey)
    return () => el.removeEventListener("keydown", onKey)
  }, [duration, togglePlay])

  const progressPct = duration ? (current / duration) * 100 : 0
  const bufferedPct = duration ? (buffered / duration) * 100 : 0
  const volPct = muted ? 0 : volume * 100

  const seekStyle: CSSProperties = {
    background: `linear-gradient(to right, var(--pink) ${progressPct}%, rgba(255,255,255,0.35) ${progressPct}%, rgba(255,255,255,0.35) ${bufferedPct}%, rgba(255,255,255,0.18) ${bufferedPct}%)`,
  }
  const volStyle: CSSProperties = {
    background: `linear-gradient(to right, #fff ${volPct}%, rgba(255,255,255,0.28) ${volPct}%)`,
  }

  const qualityLabel =
    quality === "auto" ? (nativeH ? `Auto (${nativeH}p)` : "Auto") : `${quality}p`

  return (
    <div
      ref={wrapRef}
      className={"vp" + (active || !playing ? " show" : "") + (fs ? " fs" : "")}
      tabIndex={0}
      onMouseMove={showControls}
      onMouseLeave={() => playing && setActive(false)}
    >
      <video
        ref={videoRef}
        className="vp-video"
        src={src}
        poster={poster}
        playsInline
        style={downscale ? { opacity: 0 } : undefined}
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration)
          setNativeH(e.currentTarget.videoHeight || 0)
        }}
        onProgress={(e) => {
          const v = e.currentTarget
          if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1))
        }}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume)
          setMuted(e.currentTarget.muted)
        }}
      />

      {downscale && <canvas ref={canvasRef} className="vp-canvas" onClick={togglePlay} />}

      {!playing && (
        <button className="vp-bigplay" type="button" onClick={togglePlay} aria-label="Play">
          <BsPlayFill size={40} />
        </button>
      )}

      <div className="vp-controls" onClick={(e) => e.stopPropagation()}>
        <input
          className="vp-seek"
          type="range"
          min={0}
          max={duration || 0}
          step="any"
          value={current}
          style={seekStyle}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Seek"
        />

        <div className="vp-bar">
          <button className="vp-btn" type="button" onClick={togglePlay} aria-label="Play/Pause">
            {playing ? <BsPauseFill size={22} /> : <BsPlayFill size={22} />}
          </button>

          <div className="vp-vol">
            <button
              className="vp-btn"
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label="Mute"
            >
              {muted || volume === 0 ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
            </button>
            <input
              className="vp-volrange"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              style={volStyle}
              onChange={(e) => {
                const val = Number(e.target.value)
                setVolume(val)
                setMuted(val === 0)
              }}
              aria-label="Volume"
            />
          </div>

          <span className="vp-time">
            {fmt(current)} / {fmt(duration)}
          </span>

          <span className="vp-spacer" />

          <div className="vp-settings">
            <button
              className="vp-btn"
              type="button"
              onClick={() => setMenu((m) => (m ? null : "main"))}
              aria-label="Settings"
            >
              <FiSettings size={20} className={menu ? "vp-gear-on" : ""} />
            </button>

            {menu === "main" && (
              <div className="vp-menu">
                <button className="vp-mrow" type="button" onClick={() => setMenu("speed")}>
                  <span>Playback speed</span>
                  <span className="vp-mval">{speed === 1 ? "Normal" : speed + "x"}</span>
                </button>
                <button className="vp-mrow" type="button" onClick={() => setMenu("quality")}>
                  <span>Quality</span>
                  <span className="vp-mval">{qualityLabel}</span>
                </button>
              </div>
            )}

            {menu === "speed" && (
              <div className="vp-menu">
                <button className="vp-mhead" type="button" onClick={() => setMenu("main")}>
                  <FiArrowLeft size={16} /> Playback speed
                </button>
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    className="vp-opt"
                    type="button"
                    onClick={() => {
                      setSpeed(s)
                      setMenu(null)
                    }}
                  >
                    <span className="vp-check">{speed === s && <FiCheck size={15} />}</span>
                    {s === 1 ? "Normal" : s + "x"}
                  </button>
                ))}
              </div>
            )}

            {menu === "quality" && (
              <div className="vp-menu">
                <button className="vp-mhead" type="button" onClick={() => setMenu("main")}>
                  <FiArrowLeft size={16} /> Quality
                </button>
                <button
                  className="vp-opt"
                  type="button"
                  onClick={() => {
                    setQuality("auto")
                    setMenu(null)
                  }}
                >
                  <span className="vp-check">{quality === "auto" && <FiCheck size={15} />}</span>
                  {nativeH ? `Auto (${nativeH}p)` : "Auto"}
                </button>
                {qualities.map((q) => (
                  <button
                    key={q}
                    className="vp-opt"
                    type="button"
                    onClick={() => {
                      setQuality(q)
                      setMenu(null)
                    }}
                  >
                    <span className="vp-check">{quality === q && <FiCheck size={15} />}</span>
                    {q}p{q >= 720 ? " HD" : ""}
                  </button>
                ))}
                {qualities.length === 0 && (
                  <div className="vp-optnote">Detecting…</div>
                )}
              </div>
            )}
          </div>

          <button className="vp-btn" type="button" onClick={toggleFs} aria-label="Fullscreen">
            {fs ? <FiMinimize size={20} /> : <FiMaximize size={20} />}
          </button>
        </div>
      </div>
    </div>
  )
}
