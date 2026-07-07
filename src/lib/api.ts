import { supabase, VIDEO_BUCKET, SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase"
import { getActorId, currentName, getSession } from "./auth"
import { captureThumbnail, formatDuration, titleFromFile } from "../utils"
import type { Channel, Comment, Engagement, Mod, ModUpdate, Video } from "../types"

const GRADS = [
  "linear-gradient(135deg,#ff2d8f,#a35bff)",
  "linear-gradient(135deg,#22d3ee,#5a6bff)",
  "linear-gradient(135deg,#a35bff,#22d3ee)",
  "linear-gradient(135deg,#ff5c72,#ff2d8f)",
  "linear-gradient(135deg,#35d67f,#22d3ee)",
]

export const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/
const USERNAME_LOCK_DAYS = 5

export function relTime(iso: string): string {
  const then = new Date(iso).getTime()
  const s = Math.floor(Math.max(0, Date.now() - then) / 1000)
  if (s < 45) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hr ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} day${d > 1 ? "s" : ""} ago`
  const w = Math.floor(d / 7)
  if (w < 5) return `${w} week${w > 1 ? "s" : ""} ago`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo} month${mo > 1 ? "s" : ""} ago`
  const y = Math.floor(d / 365)
  return `${y} year${y > 1 ? "s" : ""} ago`
}

function formatViews(n: number): string {
  if (n < 1000) return `${n}`
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`
  return `${(n / 1_000_000).toFixed(1)}M`
}

function publicUrl(path: string | null): string | undefined {
  if (!path) return undefined
  return supabase.storage.from(VIDEO_BUCKET).getPublicUrl(path).data.publicUrl
}

async function uploadPublic(file: File, prefix: string): Promise<string> {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const path = `${prefix}/${Date.now()}-${safe}`
  const up = await supabase.storage.from(VIDEO_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || "application/octet-stream",
  })
  if (up.error) throw up.error
  return publicUrl(path) as string
}

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------
interface VideoRow {
  id: string
  title: string
  channel: string
  duration: string | null
  storage_path: string | null
  thumb: string | null
  grad: string | null
  views: number
  created_at: string
  channel_id: string | null
  owner_id: string | null
  description: string | null
  tags: string[] | null
  channel_name?: string | null
  channel_avatar?: string | null
  channel_verified?: boolean | null
  like_count?: number
  comment_count?: number
}

function mapVideo(r: VideoRow): Video {
  return {
    id: r.id,
    title: r.title,
    channel: r.channel_name ?? r.channel,
    views: formatViews(r.views ?? 0),
    ago: relTime(r.created_at),
    duration: r.duration ?? "0:00",
    thumb: r.thumb ?? undefined,
    grad: r.grad ?? undefined,
    url: publicUrl(r.storage_path),
    likeCount: r.like_count ?? 0,
    channelId: r.channel_id ?? undefined,
    ownerId: r.owner_id ?? undefined,
    channelAvatar: r.channel_avatar ?? undefined,
    description: r.description ?? undefined,
    tags: r.tags ?? undefined,
    channelVerified: r.channel_verified ?? false,
  }
}

export async function listVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from("video_stats")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return ((data ?? []) as VideoRow[]).map(mapVideo)
}

export interface UploadMeta {
  title: string
  description?: string
  tags?: string[]
  thumbFile?: File | null
}

export async function uploadVideo(file: File, meta: UploadMeta): Promise<Video> {
  const channel = await getMyChannelRaw()
  if (!channel) throw new Error("no_channel")
  const actor = getActorId()

  const { thumb: captured, duration } = await captureThumbnail(file)
  let thumb = captured ?? null
  if (meta.thumbFile) {
    thumb = await uploadPublic(meta.thumbFile, `channels/${channel.id}/thumbs`)
  }

  const path = `${actor}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
  const up = await supabase.storage.from(VIDEO_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "video/mp4",
  })
  if (up.error) throw up.error

  const tags = (meta.tags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 12)

  const { data, error } = await supabase
    .from("videos")
    .insert({
      title: meta.title.trim() || titleFromFile(file.name),
      channel: channel.name,
      channel_id: channel.id,
      owner_id: actor,
      duration: formatDuration(duration),
      storage_path: path,
      thumb,
      grad: GRADS[Math.floor(Math.random() * GRADS.length)],
      description: meta.description?.trim() || null,
      tags,
    })
    .select("*")
    .single()
  if (error) throw error

  return mapVideo({
    ...(data as VideoRow),
    channel_name: channel.name,
    channel_avatar: channel.avatar ?? null,
    like_count: 0,
    comment_count: 0,
  })
}

/** Delete a video (DB row first so it always removes; then best-effort file). */
export async function deleteVideo(videoId: string): Promise<void> {
  const { data, error } = await supabase
    .from("videos")
    .delete()
    .eq("id", videoId)
    .select("storage_path")
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error("delete_failed")
  }
  const path = (data[0] as { storage_path: string | null }).storage_path
  if (path) {
    try {
      await supabase.storage.from(VIDEO_BUCKET).remove([path])
    } catch {
      /* file cleanup is best-effort */
    }
  }
}

export async function incrementView(videoId: string): Promise<void> {
  await supabase.rpc("increment_views", { vid: videoId })
}

export async function likedVideoIds(): Promise<Set<string>> {
  const actor = getActorId()
  const { data } = await supabase
    .from("reactions")
    .select("video_id")
    .eq("client_id", actor)
    .eq("kind", "like")
  return new Set(((data ?? []) as { video_id: string }[]).map((r) => r.video_id))
}

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------
interface ChannelRow {
  id: string
  owner_id: string
  name: string
  handle: string | null
  username: string | null
  username_changed_at: string | null
  avatar: string | null
  banner: string | null
  bio: string | null
  created_at: string
}

/** The channel owned by the current account, or null if none created yet. */
export async function getMyChannelRaw(): Promise<ChannelRow | null> {
  const actor = getActorId()
  const { data } = await supabase
    .from("channels")
    .select("*")
    .eq("owner_id", actor)
    .maybeSingle()
  return (data as ChannelRow | null) ?? null
}

export async function getMyChannelId(): Promise<string | null> {
  return (await getMyChannelRaw())?.id ?? null
}

/** Is this username free? (case-insensitive) */
export async function checkUsername(username: string): Promise<boolean> {
  const u = username.trim()
  if (!USERNAME_RE.test(u)) return false
  const { data } = await supabase
    .from("channels")
    .select("id")
    .ilike("username", u)
    .maybeSingle()
  return !data
}

export async function createChannel(input: {
  name: string
  username: string
}): Promise<ChannelRow> {
  const actor = getActorId()
  const name = input.name.trim()
  const username = input.username.trim()
  if (!name) throw new Error("name_required")
  if (!USERNAME_RE.test(username)) throw new Error("username_invalid")

  const existing = await getMyChannelRaw()
  if (existing) return existing

  const free = await checkUsername(username)
  if (!free) throw new Error("username_taken")

  const { data, error } = await supabase
    .from("channels")
    .insert({
      owner_id: actor,
      name,
      username,
      handle: `@${username}`,
      username_changed_at: new Date().toISOString(),
    })
    .select("*")
    .single()
  if (error) {
    if ((error as { code?: string }).code === "23505") throw new Error("username_taken")
    throw error
  }

  const row = data as ChannelRow
  // Adopt any earlier uploads from this account that had no channel yet.
  await supabase
    .from("videos")
    .update({ channel_id: row.id, channel: row.name })
    .eq("owner_id", actor)
    .is("channel_id", null)

  return row
}

function mapChannel(row: ChannelRow, actor: string, subs: number, videoCount: number, subscribed: boolean): Channel {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    handle: row.handle ?? (row.username ? `@${row.username}` : ""),
    username: row.username ?? undefined,
    usernameChangedAt: row.username_changed_at ?? undefined,
    avatar: row.avatar ?? undefined,
    banner: row.banner ?? undefined,
    bio: row.bio ?? undefined,
    subscribers: subs,
    videoCount,
    isOwner: row.owner_id === actor,
    subscribed,
  }
}

/** Full channel page: profile info + its videos. */
export async function getChannelPage(
  channelId: string,
): Promise<{ channel: Channel; videos: Video[] }> {
  const actor = getActorId()
  const [chRes, vids, subCount, mySub, verifiedRes] = await Promise.all([
    supabase.from("channels").select("*").eq("id", channelId).maybeSingle(),
    supabase
      .from("video_stats")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("channel_id", channelId),
    supabase
      .from("subscriptions")
      .select("id")
      .eq("channel_id", channelId)
      .eq("client_id", actor)
      .maybeSingle(),
    supabase.rpc("channel_verified", { p_channel_id: channelId }),
  ])
  if (!chRes.data) throw new Error("Channel not found")
  const row = chRes.data as ChannelRow
  const videos = ((vids.data ?? []) as VideoRow[]).map(mapVideo)
  const channel = mapChannel(row, actor, subCount.count ?? 0, videos.length, !!mySub.data)
  channel.verified = verifiedRes.data === true
  return { channel, videos }
}

export interface ChannelEdit {
  name?: string
  username?: string
  bio?: string
  avatarFile?: File | null
  bannerFile?: File | null
}

export async function updateMyChannel(edit: ChannelEdit): Promise<void> {
  const channel = await getMyChannelRaw()
  if (!channel) throw new Error("no_channel")
  const patch: Record<string, string> = {}
  if (typeof edit.name === "string" && edit.name.trim()) patch.name = edit.name.trim()
  if (typeof edit.bio === "string") patch.bio = edit.bio.trim()
  if (edit.avatarFile) patch.avatar = await uploadPublic(edit.avatarFile, `channels/${channel.id}/avatar`)
  if (edit.bannerFile) patch.banner = await uploadPublic(edit.bannerFile, `channels/${channel.id}/banner`)

  const wantUsername = edit.username?.trim()
  if (wantUsername && wantUsername.toLowerCase() !== (channel.username ?? "").toLowerCase()) {
    if (!USERNAME_RE.test(wantUsername)) throw new Error("username_invalid")
    if (channel.username_changed_at) {
      const days = (Date.now() - new Date(channel.username_changed_at).getTime()) / 86_400_000
      if (days < USERNAME_LOCK_DAYS) {
        const left = Math.ceil(USERNAME_LOCK_DAYS - days)
        throw new Error(`username_locked:${left}`)
      }
    }
    const free = await checkUsername(wantUsername)
    if (!free) throw new Error("username_taken")
    patch.username = wantUsername
    patch.handle = `@${wantUsername}`
    patch.username_changed_at = new Date().toISOString()
  }

  if (Object.keys(patch).length === 0) return

  const { error } = await supabase.from("channels").update(patch).eq("id", channel.id)
  if (error) {
    if ((error as { code?: string }).code === "23505") throw new Error("username_taken")
    throw error
  }

  if (patch.name) {
    await supabase.from("videos").update({ channel: patch.name }).eq("channel_id", channel.id)
  }
}

// ---------------------------------------------------------------------------
// Engagement (likes / dislikes / subscription / comments)
// ---------------------------------------------------------------------------
export async function getEngagement(video: {
  id: string
  channelId?: string
}): Promise<Engagement> {
  const actor = getActorId()
  const [reactions, mine, sub, comments] = await Promise.all([
    supabase.from("reactions").select("kind").eq("video_id", video.id),
    supabase
      .from("reactions")
      .select("kind")
      .eq("video_id", video.id)
      .eq("client_id", actor)
      .maybeSingle(),
    video.channelId
      ? supabase
          .from("subscriptions")
          .select("id")
          .eq("channel_id", video.channelId)
          .eq("client_id", actor)
          .maybeSingle()
      : Promise.resolve({ data: null } as { data: unknown }),
    supabase
      .from("comments")
      .select("*")
      .eq("video_id", video.id)
      .order("created_at", { ascending: false }),
  ])

  const reactionRows = (reactions.data ?? []) as { kind: string }[]
  const likes = reactionRows.filter((r) => r.kind === "like").length
  const myKind = (mine.data as { kind: string } | null)?.kind
  const subscribed = !!(sub as { data: unknown }).data

  const commentRows = (comments.data ?? []) as Array<{
    id: string
    author: string
    text: string | null
    created_at: string
    gif_id: string | null
    gif_aspect: number | null
  }>

  const ids = commentRows.map((c) => c.id)
  const likeCounts = new Map<string, number>()
  const likedByMe = new Set<string>()
  if (ids.length) {
    const { data: cl } = await supabase
      .from("comment_likes")
      .select("comment_id, client_id")
      .in("comment_id", ids)
    for (const row of (cl ?? []) as { comment_id: string; client_id: string }[]) {
      likeCounts.set(row.comment_id, (likeCounts.get(row.comment_id) ?? 0) + 1)
      if (row.client_id === actor) likedByMe.add(row.comment_id)
    }
  }

  const mapped: Comment[] = commentRows.map((c) => ({
    id: c.id,
    author: c.author,
    text: c.text ?? "",
    ago: relTime(c.created_at),
    likes: likeCounts.get(c.id) ?? 0,
    liked: likedByMe.has(c.id),
    gif: c.gif_id ? { id: c.gif_id, aspect: c.gif_aspect ?? 1 } : undefined,
  }))

  return {
    liked: myKind === "like",
    disliked: myKind === "dislike",
    likes,
    subscribed,
    comments: mapped,
  }
}

async function currentReaction(videoId: string, actor: string) {
  const { data } = await supabase
    .from("reactions")
    .select("kind")
    .eq("video_id", videoId)
    .eq("client_id", actor)
    .maybeSingle()
  return (data as { kind: string } | null)?.kind
}

export async function toggleLike(videoId: string): Promise<void> {
  const actor = getActorId()
  const kind = await currentReaction(videoId, actor)
  if (kind === "like") {
    await supabase.from("reactions").delete().eq("video_id", videoId).eq("client_id", actor)
  } else {
    await supabase
      .from("reactions")
      .upsert(
        { video_id: videoId, client_id: actor, kind: "like" },
        { onConflict: "video_id,client_id" },
      )
  }
}

export async function toggleDislike(videoId: string): Promise<void> {
  const actor = getActorId()
  const kind = await currentReaction(videoId, actor)
  if (kind === "dislike") {
    await supabase.from("reactions").delete().eq("video_id", videoId).eq("client_id", actor)
  } else {
    await supabase
      .from("reactions")
      .upsert(
        { video_id: videoId, client_id: actor, kind: "dislike" },
        { onConflict: "video_id,client_id" },
      )
  }
}

export async function toggleSubscribe(channelId: string): Promise<void> {
  const actor = getActorId()
  const { data } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("channel_id", channelId)
    .eq("client_id", actor)
    .maybeSingle()
  if (data) {
    await supabase
      .from("subscriptions")
      .delete()
      .eq("channel_id", channelId)
      .eq("client_id", actor)
  } else {
    await supabase.from("subscriptions").insert({ channel_id: channelId, client_id: actor })
  }
}

export async function addComment(
  videoId: string,
  text: string,
  gif?: { id: string; aspect: number },
): Promise<void> {
  await supabase.from("comments").insert({
    video_id: videoId,
    author: currentName(),
    text,
    gif_id: gif?.id ?? null,
    gif_aspect: gif?.aspect ?? null,
  })
}

export async function likeComment(commentId: string): Promise<void> {
  const actor = getActorId()
  const { data } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("client_id", actor)
    .maybeSingle()
  if (data) {
    await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("client_id", actor)
  } else {
    await supabase.from("comment_likes").insert({ comment_id: commentId, client_id: actor })
  }
}

// ---------------------------------------------------------------------------
// Admin panel
// ---------------------------------------------------------------------------

export interface AdminUser {
  id: string
  name: string
  email: string
  banned: boolean
  isAdmin: boolean
  createdAt: string
}

export interface AdminStats {
  users: number
  admins: number
  banned: number
  videos: number
  channels: number
}

/** List every account. Throws "not_admin" if the caller is not an admin. */
export async function adminListUsers(): Promise<AdminUser[]> {
  const me = getSession()
  if (!me?.isAdmin) throw new Error("not_admin")
  const { data, error } = await supabase.rpc("admin_list_users", {
    p_admin_id: me.id,
  })
  if (error) throw error
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    name: String(r.name ?? ""),
    email: String(r.email ?? ""),
    banned: r.banned === true,
    isAdmin: r.is_admin === true,
    createdAt: String(r.created_at ?? ""),
  }))
}

/** Ban or unban a normal account. Admins can never be banned. */
export async function adminSetBan(userId: string, banned: boolean): Promise<void> {
  const me = getSession()
  if (!me?.isAdmin) throw new Error("not_admin")
  const { error } = await supabase.rpc("admin_set_ban", {
    p_admin_id: me.id,
    p_user_id: userId,
    p_banned: banned,
  })
  if (error) throw error
}

/** Aggregate counts for the admin dashboard. */
export async function adminStats(users: AdminUser[]): Promise<AdminStats> {
  const [v, c] = await Promise.all([
    supabase.from("videos").select("id", { count: "exact", head: true }),
    supabase.from("channels").select("id", { count: "exact", head: true }),
  ])
  return {
    users: users.length,
    admins: users.filter((u) => u.isAdmin).length,
    banned: users.filter((u) => u.banned).length,
    videos: v.count ?? 0,
    channels: c.count ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Mods (community-uploaded FNF mods: downloadable zip + screenshots)
// ---------------------------------------------------------------------------
interface ModRow {
  id: string
  title: string
  description: string | null
  owner_id: string
  channel_id: string | null
  author_name: string | null
  zip_url: string
  zip_name: string | null
  zip_size: number
  screenshots: string[] | null
  downloads: number
  created_at: string
}

function mapMod(r: ModRow): Mod {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    author: r.author_name ?? "Anonymous",
    ownerId: r.owner_id,
    channelId: r.channel_id ?? undefined,
    zipUrl: r.zip_url,
    zipName: r.zip_name ?? undefined,
    sizeBytes: Number(r.zip_size ?? 0),
    screenshots: r.screenshots ?? [],
    downloads: r.downloads ?? 0,
    ago: relTime(r.created_at),
  }
}

export async function listMods(): Promise<Mod[]> {
  const { data, error } = await supabase
    .from("mods")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return ((data ?? []) as ModRow[]).map(mapMod)
}

export interface ModUploadInput {
  title: string
  description?: string
  zip: File
  screenshots: File[]
  onProgress?: (pct: number) => void
}

/** Upload a mod: screenshots + zip go to storage, then a row is inserted. */
export async function uploadMod(input: ModUploadInput): Promise<Mod> {
  const actor = getActorId()
  const channel = await getMyChannelRaw()
  const author = channel?.name ?? currentName()

  const total = input.screenshots.length + 1
  let done = 0
  const tick = () => {
    done += 1
    input.onProgress?.(Math.min(99, Math.round((done / total) * 100)))
  }

  const shots: string[] = []
  for (const s of input.screenshots) {
    const url = await uploadPublic(s, `mods/${actor}/shots`)
    shots.push(url)
    tick()
  }
  const zipUrl = await uploadPublic(input.zip, `mods/${actor}/zip`)
  tick()

  const { data, error } = await supabase
    .from("mods")
    .insert({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      owner_id: actor,
      channel_id: channel?.id ?? null,
      author_name: author,
      zip_url: zipUrl,
      zip_name: input.zip.name,
      zip_size: input.zip.size,
      screenshots: shots,
    })
    .select("*")
    .single()
  if (error) throw error
  input.onProgress?.(100)
  return mapMod(data as ModRow)
}

export async function incrementModDownload(id: string): Promise<void> {
  await supabase.rpc("increment_mod_downloads", { mid: id })
}

// ---------------------------------------------------------------------------
// Mod updates (version history: changelog + new zip per release)
// ---------------------------------------------------------------------------
interface ModUpdateRow {
  id: string
  mod_id: string
  version: string | null
  changelog: string | null
  zip_url: string
  zip_name: string | null
  zip_size: number
  downloads: number
  created_at: string
}

function mapModUpdate(r: ModUpdateRow): ModUpdate {
  return {
    id: r.id,
    modId: r.mod_id,
    version: r.version ?? undefined,
    changelog: r.changelog ?? undefined,
    zipUrl: r.zip_url,
    zipName: r.zip_name ?? undefined,
    sizeBytes: Number(r.zip_size ?? 0),
    downloads: r.downloads ?? 0,
    ago: relTime(r.created_at),
  }
}

export async function listModUpdates(modId: string): Promise<ModUpdate[]> {
  const { data, error } = await supabase
    .from("mod_updates")
    .select("*")
    .eq("mod_id", modId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return ((data ?? []) as ModUpdateRow[]).map(mapModUpdate)
}

export interface ModUpdateInput {
  modId: string
  version?: string
  changelog: string
  zip: File
  onProgress?: (pct: number) => void
}

/** Publish a new version of a mod (author only). Uploads the zip, inserts a row. */
export async function addModUpdate(input: ModUpdateInput): Promise<ModUpdate> {
  const actor = getActorId()
  input.onProgress?.(10)
  const zipUrl = await uploadPublic(input.zip, `mods/${actor}/updates`)
  input.onProgress?.(85)
  const { data, error } = await supabase
    .from("mod_updates")
    .insert({
      mod_id: input.modId,
      version: input.version?.trim() || null,
      changelog: input.changelog.trim(),
      zip_url: zipUrl,
      zip_name: input.zip.name,
      zip_size: input.zip.size,
    })
    .select("*")
    .single()
  if (error) throw error
  input.onProgress?.(100)
  return mapModUpdate(data as ModUpdateRow)
}

export async function incrementModUpdateDownload(id: string): Promise<void> {
  await supabase.rpc("increment_mod_update_downloads", { uid: id })
}

/** Delete a mod completely (its version updates cascade automatically). */
export async function deleteMod(modId: string): Promise<void> {
  const { error } = await supabase.from("mods").delete().eq("id", modId)
  if (error) throw error
}

/** Delete a single mod version/update. */
export async function deleteModUpdate(updateId: string): Promise<void> {
  const { error } = await supabase.from("mod_updates").delete().eq("id", updateId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Background upload jobs (handed to the Service Worker via Background Sync so
// uploads finish even if the user closes the site). See src/lib/bgupload.ts.
// ---------------------------------------------------------------------------
export interface BgJobFile {
  field: string
  index?: number
  path: string
  blob: Blob
  contentType: string
}

export interface BgJobText {
  doneTitle: string
  doneBody: string
  failTitle: string
  failBody: string
}

export interface BgJob {
  id: string
  kind: "video" | "mod"
  title: string
  bucket: string
  table: string
  supaUrl: string
  anonKey: string
  files: BgJobFile[]
  row: Record<string, unknown>
  text: BgJobText
}

function bgSafe(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}
function bgPath(prefix: string, name: string): string {
  return `${prefix}/${Date.now()}-${bgSafe(name)}`
}
function bgId(p: string): string {
  return `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Build a background upload job for a video (captures the thumbnail up front). */
export async function prepareVideoJob(
  file: File,
  meta: UploadMeta,
  text: BgJobText,
): Promise<BgJob> {
  const channel = await getMyChannelRaw()
  if (!channel) throw new Error("no_channel")
  const actor = getActorId()
  const { thumb: captured, duration } = await captureThumbnail(file)

  const files: BgJobFile[] = []
  const videoPath = bgPath(actor, file.name)
  files.push({
    field: "video",
    path: videoPath,
    blob: file,
    contentType: file.type || "video/mp4",
  })

  let thumb: string | null = captured ?? null
  if (meta.thumbFile) {
    const tp = bgPath(`channels/${channel.id}/thumbs`, meta.thumbFile.name)
    files.push({
      field: "thumb",
      path: tp,
      blob: meta.thumbFile,
      contentType: meta.thumbFile.type || "image/jpeg",
    })
    thumb = null
  }

  const tags = (meta.tags ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 12)
  const row: Record<string, unknown> = {
    title: meta.title.trim() || titleFromFile(file.name),
    channel: channel.name,
    channel_id: channel.id,
    owner_id: actor,
    duration: formatDuration(duration),
    storage_path: videoPath,
    thumb,
    grad: GRADS[Math.floor(Math.random() * GRADS.length)],
    description: meta.description?.trim() || null,
    tags,
  }

  return {
    id: bgId("v"),
    kind: "video",
    title: (row.title as string) || file.name,
    bucket: VIDEO_BUCKET,
    table: "videos",
    supaUrl: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    files,
    row,
    text,
  }
}

/** Build a background upload job for a mod (screenshots + zip). */
export async function prepareModJob(
  input: ModUploadInput,
  text: BgJobText,
): Promise<BgJob> {
  const actor = getActorId()
  const channel = await getMyChannelRaw()
  const author = channel?.name ?? currentName()

  const files: BgJobFile[] = []
  input.screenshots.forEach((s, i) => {
    files.push({
      field: "shot",
      index: i,
      path: bgPath(`mods/${actor}/shots`, s.name),
      blob: s,
      contentType: s.type || "application/octet-stream",
    })
  })
  files.push({
    field: "zip",
    path: bgPath(`mods/${actor}/zip`, input.zip.name),
    blob: input.zip,
    contentType: input.zip.type || "application/zip",
  })

  const row: Record<string, unknown> = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    owner_id: actor,
    channel_id: channel?.id ?? null,
    author_name: author,
    zip_name: input.zip.name,
    zip_size: input.zip.size,
  }

  return {
    id: bgId("m"),
    kind: "mod",
    title: input.title.trim(),
    bucket: VIDEO_BUCKET,
    table: "mods",
    supaUrl: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    files,
    row,
    text,
  }
}
