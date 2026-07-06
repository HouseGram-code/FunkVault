export interface Video {
  id: string
  title: string
  channel: string
  views: string
  ago: string
  duration: string
  /** data URL thumbnail captured from an uploaded file */
  thumb?: string
  /** CSS gradient used as a fallback thumbnail */
  grad?: string
  /** public URL for the uploaded, playable file (Supabase Storage) */
  url?: string
  /** like count (used for the Trending sort) */
  likeCount?: number
  /** id of the channel that owns this video */
  channelId?: string
  /** client id of the uploader */
  ownerId?: string
  /** avatar URL of the owning channel */
  channelAvatar?: string
  /** optional description shown on the watch page */
  description?: string
  /** optional tags */
  tags?: string[]
  /** true when the owning channel belongs to the FunkVault creator */
  channelVerified?: boolean
}

/** A creator channel (one per browser in this no-auth demo). */
export interface Channel {
  id: string
  ownerId: string
  name: string
  handle: string
  username?: string
  usernameChangedAt?: string
  avatar?: string
  banner?: string
  bio?: string
  subscribers: number
  videoCount: number
  isOwner: boolean
  subscribed: boolean
  /** verified "creator of FunkVault" badge */
  verified?: boolean
}

export interface Comment {
  id: string
  author: string
  text: string
  ago: string
  likes: number
  liked: boolean
  /** optional attached Tenor GIF */
  gif?: { id: string; aspect: number }
}

/** Real, per-video engagement state (likes, subscription, comments). */
export interface Engagement {
  liked: boolean
  disliked: boolean
  likes: number
  subscribed: boolean
  comments: Comment[]
}

export type Tab =
  | "home"
  | "trending"
  | "uploads"
  | "subs"
  | "library"
  | "liked"
  | "rules"
