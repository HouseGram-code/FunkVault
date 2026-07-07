import { useCallback, useEffect, useState } from "react"
import type { CSSProperties } from "react"
import * as api from "../lib/api"
import type { Mod, ModUpdate } from "../types"
import { useI18n } from "../i18n"
import { getActorId } from "../lib/auth"
import { onBackgroundMessage } from "../lib/bgupload"
import { ModUploadModal } from "./ModUploadModal"
import { ModUpdateModal } from "./ModUpdateModal"
import {
  FiUploadCloud,
  FiDownload,
  FiImage,
  FiArrowLeft,
  FiPackage,
  FiShare,
  FiPlus,
  FiTrash2,
} from "./icons"

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
  updates,
  updatesLoading,
  isOwner,
  shared,
  onBack,
  onDownload,
  onDownloadUpdate,
  onShare,
  onPostUpdate,
  onDeleteMod,
  onDeleteUpdate,
}: {
  mod: Mod
  mb: string
  updates: ModUpdate[]
  updatesLoading: boolean
  isOwner: boolean
  shared: boolean
  onBack: () => void
  onDownload: () => void
  onDownloadUpdate: (u: ModUpdate) => void
  onShare: () => void
  onPostUpdate: () => void
  onDeleteMod: () => void
  onDeleteUpdate: (u: ModUpdate) => void
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
        <div className="mod-actions">
          <button className="mod-dl-btn" type="button" onClick={onDownload}>
            <FiDownload size={18} /> {t("mod_download")} · {formatBytes(mod.sizeBytes, mb)}
          </button>
          <button className="mod-share-btn" type="button" onClick={onShare}>
            <FiShare size={16} /> {shared ? t("copied") : t("share")}
          </button>
        </div>
        {isOwner && (
          <button className="mod-post-btn" type="button" onClick={onPostUpdate}>
            <FiPlus size={16} /> {t("modupd_post")}
          </button>
        )}
        {isOwner && (
          <button className="mod-del-btn" type="button" onClick={onDeleteMod}>
            <FiTrash2 size={16} /> {t("mod_delete")}
          </button>
        )}
        {mod.description && (
          <div className="mod-desc">
            <h4>{t("mod_description")}</h4>
            <p>{mod.description}</p>
          </div>
        )}
      </div>

      <div className="mod-updates">
        <div className="mu-head">
          <h4>{t("modupd_section")}</h4>
          {updates.length > 0 && <span className="mu-count">{updates.length}</span>}
        </div>
        {updatesLoading ? (
          <p className="mu-none">{t("mods_loading")}</p>
        ) : updates.length === 0 ? (
          <p className="mu-none">{t("modupd_none")}</p>
        ) : (
          <ul className="mu-list">
            {updates.map((u, i) => (
              <li className="mu-item" key={u.id}>
                <div className="mu-top">
                  <span className="mu-ver">
                    {u.version || `${t("modupd_section")} ${updates.length - i}`}
                    {i === 0 && <span className="mu-latest">{t("modupd_latest")}</span>}
                  </span>
                  <span className="mu-date">{u.ago}</span>
                </div>
                {u.changelog && <p className="mu-log">{u.changelog}</p>}
                <div className="mu-foot">
                  <span className="mu-size">
                    {formatBytes(u.sizeBytes, mb)} · {u.downloads} {t("mod_downloads")}
                  </span>
                  <div className="mu-btns">
                    {isOwner && (
                      <button
                        className="mu-del"
                        type="button"
                        onClick={() => onDeleteUpdate(u)}
                        aria-label={t("modupd_delete")}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                    <button className="mu-dl" type="button" onClick={() => onDownloadUpdate(u)}>
                      <FiDownload size={15} /> {t("modupd_dl")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function ModsPage({
  deepModId,
  onConsumeDeep,
}: {
  deepModId?: string | null
  onConsumeDeep?: () => void
}) {
  const { t } = useI18n()
  const [mods, setMods] = useState<Mod[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Mod | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [updates, setUpdates] = useState<ModUpdate[]>([])
  const [updatesLoading, setUpdatesLoading] = useState(false)
  const [shared, setShared] = useState(false)

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

  // Refresh the list when a background mod upload completes.
  useEffect(() => {
    return onBackgroundMessage((m) => {
      if (m.type === "bg-upload-done" && m.kind === "mod") void load()
    })
  }, [load])

  // Open a mod directly from a shared link (#/mod/<id>).
  useEffect(() => {
    if (!deepModId || !mods.length) return
    const m = mods.find((x) => x.id === deepModId)
    if (m) {
      setSelected(m)
      onConsumeDeep?.()
    }
  }, [deepModId, mods, onConsumeDeep])

  const loadUpdates = useCallback(async (modId: string) => {
    setUpdatesLoading(true)
    try {
      setUpdates(await api.listModUpdates(modId))
    } catch (e) {
      console.error(e)
      setUpdates([])
    } finally {
      setUpdatesLoading(false)
    }
  }, [])

  // When a mod detail opens, reflect it in the URL and load its version history.
  useEffect(() => {
    if (!selected) return
    setShared(false)
    try {
      window.history.replaceState(null, "", `#/mod/${selected.id}`)
    } catch {
      /* ignore */
    }
    void loadUpdates(selected.id)
  }, [selected, loadUpdates])

  const goBack = () => {
    setSelected(null)
    setUpdates([])
    try {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      )
    } catch {
      /* ignore */
    }
  }

  const triggerDownload = (url: string, name: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = name
    a.target = "_blank"
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const download = (m: Mod) => {
    if (!m.zipUrl) return
    void api.incrementModDownload(m.id).catch(() => undefined)
    triggerDownload(m.zipUrl, m.zipName ?? `${m.title}.zip`)
    setMods((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, downloads: x.downloads + 1 } : x)),
    )
    setSelected((s) => (s && s.id === m.id ? { ...s, downloads: s.downloads + 1 } : s))
  }

  const downloadUpdate = (u: ModUpdate) => {
    void api.incrementModUpdateDownload(u.id).catch(() => undefined)
    triggerDownload(u.zipUrl, u.zipName ?? `${selected?.title ?? "mod"}-${u.version ?? "update"}.zip`)
    setUpdates((prev) =>
      prev.map((x) => (x.id === u.id ? { ...x, downloads: x.downloads + 1 } : x)),
    )
  }

  const shareMod = (m: Mod) => {
    const url = `${window.location.origin}${window.location.pathname}#/mod/${m.id}`
    try {
      void navigator.clipboard?.writeText(url)
    } catch {
      /* clipboard may be unavailable */
    }
    setShared(true)
    window.setTimeout(() => setShared(false), 1600)
  }

  const deleteMod = async (m: Mod) => {
    if (!confirm(t("mod_delete_confirm", { title: m.title }))) return
    try {
      await api.deleteMod(m.id)
      setMods((prev) => prev.filter((x) => x.id !== m.id))
      goBack()
    } catch (e) {
      console.error(e)
    }
  }

  const deleteUpdate = async (u: ModUpdate) => {
    if (!confirm(t("modupd_delete_confirm"))) return
    try {
      await api.deleteModUpdate(u.id)
      setUpdates((prev) => prev.filter((x) => x.id !== u.id))
    } catch (e) {
      console.error(e)
    }
  }

  if (selected) {
    const isOwner = getActorId() === selected.ownerId
    return (
      <section className="section mods-page">
        <ModDetail
          mod={selected}
          mb={t("mb")}
          updates={updates}
          updatesLoading={updatesLoading}
          isOwner={isOwner}
          shared={shared}
          onBack={goBack}
          onDownload={() => download(selected)}
          onDownloadUpdate={downloadUpdate}
          onShare={() => shareMod(selected)}
          onPostUpdate={() => setUpdateOpen(true)}
          onDeleteMod={() => deleteMod(selected)}
          onDeleteUpdate={deleteUpdate}
        />
        {updateOpen && (
          <ModUpdateModal
            mod={selected}
            onClose={() => setUpdateOpen(false)}
            onPublished={() => loadUpdates(selected.id)}
          />
        )}
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
