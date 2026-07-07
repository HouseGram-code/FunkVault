import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Header } from "./components/Header"
import { Sidebar } from "./components/Sidebar"
import { UploadZone } from "./components/UploadZone"
import { VideoGrid } from "./components/VideoGrid"
import { PlayerModal } from "./components/PlayerModal"
import { ChannelPage } from "./components/ChannelPage"
import { ChannelEditModal } from "./components/ChannelEditModal"
import { AuthScreen } from "./components/AuthScreen"
import { UploadModal } from "./components/UploadModal"
import { CreateChannelModal } from "./components/CreateChannelModal"
import { SettingsModal } from "./components/SettingsModal"
import { AdminPanel } from "./components/AdminPanel"
import { MobileNav } from "./components/MobileNav"
import { Toasts } from "./components/Toasts"
import { NotificationsPanel } from "./components/NotificationsPanel"
import { UploadStatus } from "./components/UploadStatus"
import type { UploadState } from "./components/UploadStatus"
import { RulesPage } from "./components/RulesPage"
import { ModsPage } from "./components/ModsPage"
import { Arrows } from "./components/Arrows"
import { useNotifications } from "./lib/notifications"
import { checkForUpdate } from "./lib/update"
import * as api from "./lib/api"
import type { ChannelEdit, UploadMeta } from "./lib/api"
import { queueVideoUpload, onBackgroundMessage } from "./lib/bgupload"
import { getSession, clearSession, refreshAccount } from "./lib/auth"
import type { Account } from "./lib/auth"
import { useI18n } from "./i18n"
import { FiUsers } from "./components/icons"
import type { Channel, Engagement, Tab, Video } from "./types"

const DEFAULT_ENGAGEMENT: Engagement = {
  liked: false,
  disliked: false,
  likes: 0,
  subscribed: false,
  comments: [],
}

type Route = { type: "feed" } | { type: "channel"; id: string } | { type: "nochannel" }
type MyChannel = { id: string; name: string; avatar?: string } | null

export default function App() {
  const { t } = useI18n()
  const { notify, unread, requestPermission } = useNotifications()

  const [account, setAccount] = useState<Account | null>(() => getSession())

  const [videos, setVideos] = useState<Video[]>([])
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [engagement, setEngagement] = useState<Record<string, Engagement>>({})
  const [tab, setTab] = useState<Tab>("home")
  const [query, setQuery] = useState("")
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // channel routing / data
  const [route, setRoute] = useState<Route>({ type: "feed" })
  const [myChannel, setMyChannel] = useState<MyChannel>(null)
  const [channelData, setChannelData] = useState<{
    channel: Channel
    videos: Video[]
  } | null>(null)
  const [channelLoading, setChannelLoading] = useState(false)
  const [editing, setEditing] = useState(false)

  // modals / flows
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [notifsOpen, setNotifsOpen] = useState(false)
  const [createChannelOpen, setCreateChannelOpen] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<File[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState<UploadState | null>(null)
  const [deepModId, setDeepModId] = useState<string | null>(null)
  const [pendingVideoId, setPendingVideoId] = useState<string | null>(null)

  const uploadRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => {
    try {
      const [vids, liked] = await Promise.all([api.listVideos(), api.likedVideoIds()])
      setVideos(vids)
      setLikedIds(liked)
      setError(null)
    } catch (e) {
      setError(t("empty_conn_title"))
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [t])

  const loadMyChannel = useCallback(async () => {
    try {
      const c = await api.getMyChannelRaw()
      setMyChannel(c ? { id: c.id, name: c.name, avatar: c.avatar ?? undefined } : null)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    if (!account) return
    void refresh()
    void loadMyChannel()
  }, [account, refresh, loadMyChannel])

  // Re-check admin / ban status from the server on load, so the admin panel
  // works even for sessions saved before those fields existed (no re-login).
  useEffect(() => {
    let cancelled = false
    void refreshAccount().then((a) => {
      if (cancelled) return
      setAccount((prev) => {
        if (!prev) return prev
        if (!a) return null
        if (a.isAdmin === prev.isAdmin && a.banned === prev.banned && a.name === prev.name) {
          return prev
        }
        return a
      })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Warn before closing the tab while an upload is still in progress.
  useEffect(() => {
    if (!uploading || uploading.done) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [uploading])

  // Poll the published version.json so a new deploy is detected for everyone.
  useEffect(() => {
    let alive = true
    let lastSeen = ""
    const run = async () => {
      const info = await checkForUpdate()
      if (!alive || !info || !info.hasUpdate) return
      if (lastSeen === info.remote) return
      lastSeen = info.remote
      notify({
        kind: "update",
        title: t("upd_available"),
        body: t("upd_available_body", { v: info.remote }),
        system: true,
      })
    }
    void run()
    const id = window.setInterval(run, 60000)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [notify, t])

  // ---- channel navigation ---------------------------------------------------
  const openChannel = useCallback(async (channelId: string) => {
    setPlayingId(null)
    setRoute({ type: "channel", id: channelId })
    setChannelLoading(true)
    setChannelData(null)
    try {
      const data = await api.getChannelPage(channelId)
      setChannelData(data)
    } catch (e) {
      console.error(e)
    } finally {
      setChannelLoading(false)
    }
  }, [])

  const reloadChannel = useCallback(async () => {
    if (route.type !== "channel") return
    try {
      const data = await api.getChannelPage(route.id)
      setChannelData(data)
    } catch (e) {
      console.error(e)
    }
  }, [route])

  const openMyChannel = useCallback(async () => {
    setPlayingId(null)
    const c = myChannel ?? (await api.getMyChannelRaw().then((r) =>
      r ? { id: r.id, name: r.name, avatar: r.avatar ?? undefined } : null,
    ))
    if (c) {
      setMyChannel(c)
      await openChannel(c.id)
    } else {
      setRoute({ type: "nochannel" })
    }
  }, [myChannel, openChannel])

  const goFeed = useCallback(() => setRoute({ type: "feed" }), [])

  // ---- engagement -----------------------------------------------------------
  const loadEng = useCallback(async (video: Video) => {
    try {
      const e = await api.getEngagement(video)
      setEngagement((prev) => ({ ...prev, [video.id]: e }))
    } catch (e) {
      console.error(e)
    }
  }, [])

  const openVideo = useCallback(
    (video: Video) => {
      setPlayingId(video.id)
      void loadEng(video)
      void api.incrementView(video.id)
      try {
        window.history.replaceState(null, "", `#/video/${video.id}`)
      } catch {
        /* ignore */
      }
    },
    [loadEng],
  )

  // ---- deep links (shareable URLs for videos & mods) ------------------------
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash
      const vm = /^#\/video\/(.+)$/.exec(h)
      const mm = /^#\/mod\/(.+)$/.exec(h)
      if (vm) {
        setPendingVideoId(decodeURIComponent(vm[1]))
      } else if (mm) {
        setRoute({ type: "feed" })
        setTab("mods")
        setDeepModId(decodeURIComponent(mm[1]))
      }
    }
    apply()
    window.addEventListener("hashchange", apply)
    return () => window.removeEventListener("hashchange", apply)
  }, [])

  useEffect(() => {
    if (!pendingVideoId) return
    const v = videos.find((x) => x.id === pendingVideoId)
    if (v) {
      openVideo(v)
      setPendingVideoId(null)
    }
  }, [pendingVideoId, videos, openVideo])

  const allVideos = useMemo(() => {
    if (route.type === "channel" && channelData) {
      const map = new Map(videos.map((v) => [v.id, v]))
      for (const v of channelData.videos) map.set(v.id, v)
      return Array.from(map.values())
    }
    return videos
  }, [route, channelData, videos])

  const playing = allVideos.find((v) => v.id === playingId) ?? null
  const engFor = (id: string): Engagement => engagement[id] ?? DEFAULT_ENGAGEMENT

  const afterMutation = useCallback(async () => {
    if (playing) await loadEng(playing)
    await refresh()
    await reloadChannel()
  }, [playing, loadEng, refresh, reloadChannel])

  // ---- uploads --------------------------------------------------------------
  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const vids = Array.from(files).filter((f) => f.type.startsWith("video/"))
      if (!vids.length) return
      const MAX = 250 * 1024 * 1024
      const list = vids.filter((f) => f.size <= MAX)
      if (list.length < vids.length) {
        notify({
          kind: "error",
          title: t("up_toobig"),
          body: t("up_toobig_body"),
        })
      }
      if (!list.length) return
      if (!myChannel) {
        setPendingFiles(list)
        setCreateChannelOpen(true)
        return
      }
      setUploadQueue((q) => [...q, ...list])
    },
    [myChannel, notify, t],
  )

  const triggerUpload = () => uploadRef.current?.click()

  const publishCurrent = useCallback(
    async (meta: UploadMeta) => {
      const file = uploadQueue[0]
      if (!file) return
      const title = meta.title
      // Close the dialog right away — the upload continues in the background,
      // so the user is free to keep browsing (YouTube-style).
      setUploadQueue((q) => q.slice(1))
      void requestPermission()

      // Prefer a Service-Worker background upload: it finishes even if the user
      // leaves or closes the site, and fires a notification when it's done.
      const queued = await queueVideoUpload(file, meta, {
        doneTitle: t("up_done"),
        doneBody: t("up_done_body", { title }),
        failTitle: t("up_failed"),
        failBody: t("up_failed_body", { title }),
      })
      if (queued) {
        notify({
          kind: "upload",
          title: t("up_bg_started"),
          body: t("up_bg_body", { title }),
          system: true,
        })
        return
      }

      // Fallback (browsers without Background Sync): upload in-page.
      setUploading({ title, progress: 0, done: false })
      notify({
        kind: "upload",
        title: t("up_started"),
        body: t("up_started_body", { title }),
      })

      const started = Date.now()
      const durationMs = Math.min(30000, Math.max(2500, file.size / 40000))
      const timer = window.setInterval(() => {
        const pct = Math.min(92, ((Date.now() - started) / durationMs) * 100)
        setUploading((u) => (u && !u.done ? { ...u, progress: pct } : u))
      }, 200)

      try {
        await api.uploadVideo(file, meta)
        window.clearInterval(timer)
        setUploading({ title, progress: 100, done: true })
        notify({
          kind: "success",
          title: t("up_done"),
          body: t("up_done_body", { title }),
          system: true,
        })
        await refresh()
        await reloadChannel()
        window.setTimeout(() => {
          setUploading((u) => (u && u.done ? null : u))
        }, 2600)
      } catch (e) {
        window.clearInterval(timer)
        setUploading(null)
        notify({
          kind: "error",
          title: t("up_failed"),
          body: t("up_failed_body", { title }),
          system: true,
        })
        console.error(e)
      }
    },
    [uploadQueue, refresh, reloadChannel, t, notify],
  )

  // When a Service-Worker background upload finishes, refresh the feed.
  useEffect(() => {
    return onBackgroundMessage((m) => {
      if (m.type === "bg-upload-done" && m.kind === "video") {
        void refresh()
        void reloadChannel()
      }
    })
  }, [refresh, reloadChannel])

  const skipCurrent = useCallback(() => {
    setUploadQueue((q) => q.slice(1))
  }, [])

  const handleDelete = useCallback(
    async (video: Video) => {
      try {
        await api.deleteVideo(video.id)
        if (playingId === video.id) setPlayingId(null)
        await refresh()
        await reloadChannel()
      } catch (e) {
        setError(t("err_generic"))
        console.error(e)
      }
    },
    [playingId, refresh, reloadChannel, t],
  )

  const handleSaveChannel = useCallback(
    async (edit: ChannelEdit) => {
      await api.updateMyChannel(edit)
      await loadMyChannel()
      await refresh()
      await reloadChannel()
    },
    [loadMyChannel, refresh, reloadChannel],
  )

  const handleChannelCreated = useCallback(
    async (channelId: string) => {
      setCreateChannelOpen(false)
      await loadMyChannel()
      await refresh()
      if (pendingFiles.length) {
        setUploadQueue((q) => [...q, ...pendingFiles])
        setPendingFiles([])
      }
      await openChannel(channelId)
    },
    [loadMyChannel, refresh, pendingFiles, openChannel],
  )

  const handleLogout = useCallback(() => {
    clearSession()
    setSettingsOpen(false)
    setRoute({ type: "feed" })
    setPlayingId(null)
    setMyChannel(null)
    setChannelData(null)
    setAccount(null)
  }, [])

  // ---- feed -----------------------------------------------------------------
  const feed = useMemo(() => {
    let base = videos
    if (tab === "liked") base = videos.filter((v) => likedIds.has(v.id))
    else if (tab === "trending")
      base = [...videos].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
    const q = query.trim().toLowerCase()
    if (!q) return base
    return base.filter(
      (v) => v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q),
    )
  }, [tab, videos, query, likedIds])

  const showUploadZone = tab === "home" || tab === "uploads"

  const heading =
    tab === "uploads"
      ? { main: t("sec_your"), accent: t("uploads"), sub: t("sub_uploads", { n: videos.length }) }
      : tab === "trending"
        ? { main: t("sec_top"), accent: t("funkin"), sub: t("sub_trending") }
        : tab === "subs"
          ? { main: t("sec_your"), accent: t("subs_word"), sub: t("sub_subs") }
          : tab === "liked"
            ? { main: t("sec_liked"), accent: t("liked_word"), sub: t("sub_liked") }
            : tab === "library"
              ? { main: t("sec_your"), accent: t("library_word"), sub: t("sub_library") }
              : { main: t("sec_your"), accent: t("vault"), sub: t("sub_vault") }

  const emptyCopy = error
    ? { title: t("empty_conn_title"), body: error }
    : loading
      ? { title: t("empty_loading_title"), body: t("empty_loading_body") }
      : tab === "liked"
        ? { title: t("empty_liked_title"), body: t("empty_liked_body") }
        : query
          ? { title: t("empty_search_title"), body: t("empty_search_body") }
          : { title: t("empty_vault_title"), body: t("empty_vault_body") }

  const onChannelPage = route.type === "channel"
  const onNoChannel = route.type === "nochannel"

  // ---- gate behind auth -----------------------------------------------------
  if (!account) {
    return <AuthScreen onAuthed={setAccount} />
  }

  return (
    <>
      <Header
        query={query}
        onQuery={setQuery}
        onUpload={triggerUpload}
        onOpenMyChannel={openMyChannel}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
        onToggleNotifs={() => setNotifsOpen((o) => !o)}
        unread={unread}
        isAdmin={account.isAdmin}
        myName={myChannel?.name ?? account.name}
        myAvatar={myChannel?.avatar}
      />
      <input
        ref={uploadRef}
        type="file"
        accept="video/*"
        multiple
        hidden
        onChange={(e) => {
          const files = e.target.files
          if (files && files.length) handleFiles(files)
          e.currentTarget.value = ""
        }}
      />
      <div className="shell">
        <Sidebar
          active={tab}
          onChange={(tb) => {
            goFeed()
            setTab(tb)
          }}
          uploadCount={videos.length}
          onOpenMyChannel={openMyChannel}
          channelActive={onChannelPage && channelData?.channel.isOwner === true}
        />
        <main className="main">
          {onNoChannel ? (
            <div className="no-channel">
              <div className="nc-icon">
                <FiUsers size={40} />
              </div>
              <h2>{t("no_channel_title")}</h2>
              <p>{t("no_channel_body")}</p>
              <button
                className="nc-create"
                type="button"
                onClick={() => setCreateChannelOpen(true)}
              >
                {t("create_channel")}
              </button>
            </div>
          ) : onChannelPage ? (
            channelData ? (
              <ChannelPage
                channel={channelData.channel}
                videos={channelData.videos}
                loading={channelLoading}
                onBack={goFeed}
                onPlay={openVideo}
                onOpenChannel={openChannel}
                onSubscribe={async () => {
                  await api.toggleSubscribe(channelData.channel.id)
                  await reloadChannel()
                }}
                onEdit={() => setEditing(true)}
                onDelete={handleDelete}
                onUpload={triggerUpload}
              />
            ) : (
              <div className="ch-empty">{t("loading_channel")}</div>
            )
          ) : tab === "mods" ? (
            <ModsPage deepModId={deepModId} onConsumeDeep={() => setDeepModId(null)} />
          ) : tab === "rules" ? (
            <RulesPage />
          ) : (
            <>
              {showUploadZone && <UploadZone onFiles={handleFiles} busy={false} />}

              <section className="section">
                <div className="section-head">
                  <h3>
                    {heading.main}
                    <span className="accent">{heading.accent}</span>
                  </h3>
                  <span className="sub">{heading.sub}</span>
                </div>

                {feed.length > 0 ? (
                  <VideoGrid videos={feed} onPlay={openVideo} onOpenChannel={openChannel} />
                ) : (
                  <div className="empty">
                    <div className="big">
                      <Arrows size={34} />
                    </div>
                    <h4>{emptyCopy.title}</h4>
                    <p>{emptyCopy.body}</p>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>

      <MobileNav
        active={tab}
        channelActive={onChannelPage}
        onChange={(tb) => {
          goFeed()
          setTab(tb)
        }}
        onOpenMyChannel={openMyChannel}
        onUpload={triggerUpload}
      />

      <PlayerModal
        video={playing}
        videos={allVideos}
        engagement={playing ? engFor(playing.id) : DEFAULT_ENGAGEMENT}
        onClose={() => {
          setPlayingId(null)
          try {
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search,
            )
          } catch {
            /* ignore */
          }
        }}
        onSelect={(id) => {
          const v = allVideos.find((x) => x.id === id)
          if (v) openVideo(v)
        }}
        onUpload={handleFiles}
        onOpenChannel={openChannel}
        onToggleLike={async () => {
          if (!playing) return
          await api.toggleLike(playing.id)
          await afterMutation()
        }}
        onToggleDislike={async () => {
          if (!playing) return
          await api.toggleDislike(playing.id)
          await afterMutation()
        }}
        onToggleSubscribe={async () => {
          if (!playing || !playing.channelId) return
          await api.toggleSubscribe(playing.channelId)
          await afterMutation()
        }}
        onAddComment={async (text, gif) => {
          if (!playing) return
          await api.addComment(playing.id, text, gif)
          await afterMutation()
        }}
        onLikeComment={async (commentId) => {
          if (!playing) return
          await api.likeComment(commentId)
          await afterMutation()
        }}
      />

      {editing && channelData && (
        <ChannelEditModal
          channel={channelData.channel}
          onClose={() => setEditing(false)}
          onSave={handleSaveChannel}
        />
      )}

      {uploadQueue.length > 0 && (
        <UploadModal
          key={uploadQueue[0].name + uploadQueue.length}
          file={uploadQueue[0]}
          publishing={false}
          onPublish={publishCurrent}
          onCancel={skipCurrent}
        />
      )}

      {createChannelOpen && (
        <CreateChannelModal
          onClose={() => {
            setCreateChannelOpen(false)
            setPendingFiles([])
          }}
          onCreated={handleChannelCreated}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onLogout={handleLogout}
          accountName={account.name}
          accountEmail={account.email}
        />
      )}

      {adminOpen && account.isAdmin && (
        <AdminPanel onClose={() => setAdminOpen(false)} />
      )}

      {notifsOpen && <NotificationsPanel onClose={() => setNotifsOpen(false)} />}
      {uploading && <UploadStatus state={uploading} />}
      <Toasts />
    </>
  )
}
