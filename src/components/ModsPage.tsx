import { useCallback, useEffect, useState } from "react"
import type { CSSProperties } from "react"
import * as api from "../lib/api"
import type { Mod } from "../types"
import { useI18n } from "../i18n"
import { ModUploadModal } from "./ModUploadModal"
import { FiUploadCloud, FiDownload, FiImage, FiArrowLeft, FiPackage } from "./icons"

function formatBytes(bytes: number, mb: string): string {
  if (!bytes || bytes < 0) return `0 ${mb}`
  const m = bytes / (1024 * 1024)
  if (m < 0.1) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${m.toFixed(m < 10 ? 1 : 0)} ${mb}`
}

function ModCard({ mod, mb, onOpen }: { mod: Mod; mb: string; onOpen: () => void }) {
  const { t } = useI18n()
  const cover = mod.screenshots[0]
  const coverStyle: CSSProperties = cover
    ? { backgroundImage: `url(${cover})` }
    : { background: "linear-gradient(135deg,#a35bff,#22d3ee)" }
  return (
    <button className="mod-card" type="button" onClick={onOpen}>
      <div className="mod-cover" style={coverStyle}>
        {!cover && <FiPackage size={30} />}
        <span className="mod-shots-badge">
          <FiImage size={12} /> {mod.screenshots.length}
        </span>
      </div>
      <div className="mod-card-body">
        <h4 className="mod-card-title">{mod.title}</h4>
        <p className="mod-card-meta">
          {t("mod_by")} {mod.author}
        </p>
        <div className="mod-card-foot">
          <span>{formatBytes(mod.sizeBytes, mb)}</span>
          <span>
            <FiDownload size={12} /> {mod.downloads}
          </span>
        </div>
      </div>
    </button>
  )
}

function ModDetail({
  mod,
  mb,
  onBack,
  onDownload,
}: {
  mod: Mod
  mb: string
  onBack: () => void
  onDownload: () => void
}) {
  const { t } = useI18n()
  const [active, setActive] = useState(0)
  const shots = mod.screenshots
  const main = shots[active]
  const mainStyle: CSSProperties = main
    ? { backgroundImage: `url(${main})` }
    : { background: "linear-gradient(135deg,#a35bff,#22d3ee)" }

  return (
    <div className="mod-detail">
      <button className="mod-back" type="button" onClick={onBack}>
        <FiArrowLeft size={16} /> {t("mod_back")}
      </button>
      <div className="mod-gallery">
        <div className="mod-main-shot" style={mainStyle} />
        {shots.length > 1 && (
          <div className="mod-thumbs">
            {shots.map((s, i) => {
              const thumbStyle: CSSProperties = { backgroundImage: `url(${s})` }
              return (
                <button
                  key={i}
                  className={"mod-thumb" + (i === active ? " active" : "")}
                  style={thumbStyle}
                  onClick={() => setActive(i)}
                  type="button"
                  aria-label={`Screenshot ${i + 1}`}
                />
              )
            })}
          </div>
        )}
      </div>
      <div className="mod-info">
        <h2 className="mod-h2">{mod.title}</h2>
        <p className="mod-author">
          {t("mod_by")} <b>{mod.author}</b> · {mod.ago}
        </p>
        <div className="mod-stats">
          <span className="mod-stat">
            <b>{formatBytes(mod.sizeBytes, mb)}</b>
            {t("mod_size")}
          </span>
          <span className="mod-stat">
            <b>{mod.downloads}</b>
            {t("mod_downloads")}
          </span>
          <span className="mod-stat">
            <b>{shots.length}</b>
            {t("mod_screens")}
          </span>
        </div>
        <button className="mod-dl-btn" type="button" onClick={onDownload}>
          <FiDownload size={18} /> {t("mod_download")} · {formatBytes(mod.sizeBytes, mb)}
        </button>
        {mod.description && (
          <div className="mod-desc">
            <h4>{t("mod_description")}</h4>
            <p>{mod.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function ModsPage() {
  const { t } = useI18n()
  const [mods, setMods] = useState<Mod[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Mod | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setMods(await api.listMods())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const download = (m: Mod) => {
    if (!m.zipUrl) return
    void api.incrementModDownload(m.id).catch(() => undefined)
    const a = document.createElement("a")
    a.href = m.zipUrl
    a.download = m.zipName ?? `${m.title}.zip`
    a.target = "_blank"
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    a.remove()
    setMods((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, downloads: x.downloads + 1 } : x)),
    )
    setSelected((s) => (s && s.id === m.id ? { ...s, downloads: s.downloads + 1 } : s))
  }

  if (selected) {
    return (
      <section className="section mods-page">
        <ModDetail
          mod={selected}
          mb={t("mb")}
          onBack={() => setSelected(null)}
          onDownload={() => download(selected)}
        />
      </section>
    )
  }

  return (
    <section className="section mods-page">
      <div className="section-head mods-head">
        <div>
          <h3>
            {t("mods_title")}
            <span className="accent">{t("mods_accent")}</span>
          </h3>
          <span className="sub">{t("mods_sub")}</span>
        </div>
        <button className="mods-upload-btn" type="button" onClick={() => setUploadOpen(true)}>
          <FiUploadCloud size={16} /> {t("mods_upload_btn")}
        </button>
      </div>

      {loading ? (
        <div className="mods-loading">{t("mods_loading")}</div>
      ) : mods.length === 0 ? (
        <div className="empty">
          <div className="big">
            <FiPackage size={34} />
          </div>
          <h4>{t("mods_empty_title")}</h4>
          <p>{t("mods_empty_body")}</p>
        </div>
      ) : (
        <div className="mod-grid">
          {mods.map((m) => (
            <ModCard key={m.id} mod={m} mb={t("mb")} onOpen={() => setSelected(m)} />
          ))}
        </div>
      )}

      {uploadOpen && (
        <ModUploadModal onClose={() => setUploadOpen(false)} onUploaded={load} />
      )}
    </section>
  )
}
