import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import {
  FiArrowLeft,
  FiThumbsUp,
  FiThumbsDown,
  FiShare,
  FiCheck,
  FiUpload,
  FiSmile,
  FiX,
  VerifiedBadge,
} from "./icons"
import type { Comment, Engagement, Video } from "../types"
import { channelColor } from "../utils"
import { useI18n } from "../i18n"
import { currentName } from "../lib/auth"
import { VideoPlayer } from "./VideoPlayer"
import { GifEmojiPicker } from "./GifEmojiPicker"
import type { Gif } from "../data/gifs"

const EMBED_BASE = "https://tenor.com/embed/"

interface PlayerModalProps {
  video: Video | null
  videos: Video[]
  engagement: Engagement
  onClose: () => void
  onSelect: (id: string) => void
  onUpload: (files: FileList | File[]) => void
  onToggleLike: () => void
  onToggleDislike: () => void
  onToggleSubscribe: () => void
  onAddComment: (text: string, gif?: { id: string; aspect: number }) => void
  onLikeComment: (commentId: string) => void
  onOpenChannel: (channelId: string) => void
}

function dot(name: string): CSSProperties {
  return { background: `linear-gradient(135deg, ${channelColor(name)}, #ffffff55)` }
}

function avatarDot(video: Video): CSSProperties {
  if (video.channelAvatar) return { backgroundImage: `url(${video.channelAvatar})` }
  return dot(video.channel)
}

function thumbStyle(v: Video): CSSProperties {
  if (v.thumb) return { backgroundImage: `url(${v.thumb})` }
  return { background: v.grad ?? "linear-gradient(135deg,#ff2d8f,#a35bff)" }
}

function aspectStyle(aspect: number): CSSProperties {
  return { aspectRatio: String(aspect) }
}

export function PlayerModal({
  video,
  videos,
  engagement,
  onClose,
  onSelect,
  onUpload,
  onToggleLike,
  onToggleDislike,
  onToggleSubscribe,
  onAddComment,
  onLikeComment,
  onOpenChannel,
}: PlayerModalProps) {
  const { t } = useI18n()
  const [draft, setDraft] = useState("")
  const [shared, setShared] = useState(false)
  const [pendingGif, setPendingGif] = useState<{ id: string; aspect: number } | null>(
    null,
  )
  const [picker, setPicker] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!video) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [video, onClose])

  useEffect(() => {
    setDraft("")
    setPendingGif(null)
    setPicker(false)
  }, [video?.id])

  if (!video) return null

  const submit = () => {
    const text = draft.trim()
    if (!text && !pendingGif) return
    onAddComment(text, pendingGif ?? undefined)
    setDraft("")
    setPendingGif(null)
    setPicker(false)
  }

  const subs = engagement.subscribed ? 1 : 0
  const comments = engagement.comments
  const others = videos.filter((v) => v.id !== video.id)

  const share = () => {
    try {
      navigator.clipboard?.writeText(window.location.href)
    } catch {
      /* clipboard may be unavailable */
    }
    setShared(true)
    window.setTimeout(() => setShared(false), 1600)
  }

  return (
    <div className="watch-page">
      <div className="watch-topbar">
        <button className="wt-back" type="button" onClick={onClose} aria-label="Back">
          <FiArrowLeft size={22} />
        </button>
        <span className="wt-logo">
          Funk<span>Vault</span>
        </span>
        <span className="wt-spacer" />
        <button
          className="wt-upload"
          type="button"
          onClick={() => fileRef.current?.click()}
        >
          <FiUpload size={16} /> Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          multiple
          hidden
          onChange={(e) => {
            const files = e.target.files
            if (files && files.length) onUpload(files)
            e.currentTarget.value = ""
          }}
        />
      </div>

      <div className="watch-body">
        <div className="watch-main">
          <div className="player-stage">
            {video.url ? (
              <VideoPlayer key={video.id} src={video.url} poster={video.thumb} />
            ) : (
              <div className="demo-note">
                <p>{t("no_source")}</p>
              </div>
            )}
          </div>

          <h1 className="watch-title">{video.title}</h1>
          <p className="watch-sub">
            {video.views} {t("views")} · {video.ago}
          </p>

          {(video.description || (video.tags && video.tags.length > 0)) && (
            <div className="watch-desc">
              {video.description && <p className="wd-text">{video.description}</p>}
              {video.tags && video.tags.length > 0 && (
                <div className="wd-tags">
                  {video.tags.map((tag) => (
                    <span className="wd-tag" key={tag}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="watch-actions">
            <div className="channel-row">
              <div
                className={"ch-dot" + (video.channelId ? " clickable" : "")}
                style={avatarDot(video)}
                onClick={() => video.channelId && onOpenChannel(video.channelId)}
              >
                {!video.channelAvatar && video.channel.charAt(0).toUpperCase()}
              </div>
              <div
                className={"ch-info" + (video.channelId ? " clickable" : "")}
                onClick={() => video.channelId && onOpenChannel(video.channelId)}
              >
                <p className="ch-name">
                  {video.channel}
                  {video.channelVerified && (
                    <span className="verified-badge sm" aria-label={t("verified")}>
                      <VerifiedBadge size={15} />
                    </span>
                  )}
                </p>
                <p className="ch-subs">
                  {subs} {subs === 1 ? t("subscriber") : t("subscribers")}
                </p>
              </div>
              <button
                className={"sub-btn" + (engagement.subscribed ? " on" : "")}
                type="button"
                onClick={onToggleSubscribe}
              >
                {engagement.subscribed ? (
                  <>
                    <FiCheck size={16} /> {t("subscribed")}
                  </>
                ) : (
                  t("subscribe")
                )}
              </button>
            </div>

            <div className="action-group">
              <div className="like-pill">
                <button
                  className={"lp-btn" + (engagement.liked ? " on" : "")}
                  type="button"
                  onClick={onToggleLike}
                  aria-label="Like"
                >
                  <FiThumbsUp size={18} />
                  <span className="lk-count">{engagement.likes}</span>
                </button>
                <span className="lp-div" />
                <button
                  className={"lp-btn" + (engagement.disliked ? " on" : "")}
                  type="button"
                  onClick={onToggleDislike}
                  aria-label="Dislike"
                >
                  <FiThumbsDown size={18} />
                </button>
              </div>

              <button className="share-btn" type="button" onClick={share}>
                <FiShare size={17} />
                {shared ? t("copied") : t("share")}
              </button>
            </div>
          </div>

          <div className="comments">
            <h3 className="comments-head">
              {comments.length} {comments.length === 1 ? t("comment_one") : t("comment_many")}
            </h3>

            <div className="composer">
              <div className="me">{currentName().charAt(0).toUpperCase() || "Y"}</div>
              <div className="field">
                <textarea
                  rows={1}
                  value={draft}
                  placeholder={t("add_comment")}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      submit()
                    }
                  }}
                />
                {pendingGif && (
                  <div className="pending-gif">
                    <div className="pg-frame" style={aspectStyle(pendingGif.aspect)}>
                      <iframe
                        src={EMBED_BASE + pendingGif.id}
                        title="Selected GIF"
                        scrolling="no"
                      />
                    </div>
                    <button
                      className="pg-remove"
                      type="button"
                      onClick={() => setPendingGif(null)}
                    >
                      <FiX size={14} /> {t("remove_gif")}
                    </button>
                  </div>
                )}

                <div className="composer-actions">
                  <div className="composer-tools">
                    <button
                      className={"ct-btn" + (picker ? " on" : "")}
                      type="button"
                      onClick={() => setPicker((p) => !p)}
                      aria-label="Emoji and GIF"
                    >
                      <FiSmile size={20} />
                    </button>
                    {picker && (
                      <GifEmojiPicker
                        onEmoji={(em) => setDraft((d) => d + em)}
                        onGif={(g: Gif) => {
                          setPendingGif({ id: g.id, aspect: g.aspect })
                          setPicker(false)
                        }}
                        onClose={() => setPicker(false)}
                      />
                    )}
                  </div>
                  <span className="ca-spacer" />
                  <button
                    className="btn-ghost"
                    type="button"
                    onClick={() => {
                      setDraft("")
                      setPendingGif(null)
                    }}
                    disabled={!draft && !pendingGif}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    className="btn-send"
                    type="button"
                    onClick={submit}
                    disabled={!draft.trim() && !pendingGif}
                  >
                    {t("comment_btn")}
                  </button>
                </div>
              </div>
            </div>

            {comments.length === 0 ? (
              <p className="comments-empty">{t("no_comments")}</p>
            ) : (
              comments.map((c: Comment) => (
                <div className="comment" key={c.id}>
                  <div className="c-dot" style={dot(c.author)}>
                    {c.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="c-body">
                    <div className="c-head">
                      <span className="c-author">{c.author}</span>
                      <span className="c-ago">{c.ago}</span>
                    </div>
                    {c.text && <p className="c-text">{c.text}</p>}
                    {c.gif && (
                      <div className="c-gif" style={aspectStyle(c.gif.aspect)}>
                        <iframe
                          src={EMBED_BASE + c.gif.id}
                          title="GIF"
                          scrolling="no"
                        />
                      </div>
                    )}
                    <button
                      className={"c-like" + (c.liked ? " on" : "")}
                      type="button"
                      onClick={() => onLikeComment(c.id)}
                    >
                      <FiThumbsUp size={14} />
                      {c.likes > 0 && <span>{c.likes}</span>}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="watch-side">
          <h4>{t("up_next")}</h4>
          {others.length === 0 ? (
            <p className="side-empty">{t("no_up_next")}</p>
          ) : (
            others.map((v) => (
              <button
                className="rec"
                type="button"
                key={v.id}
                onClick={() => onSelect(v.id)}
              >
                <div className="rec-thumb" style={thumbStyle(v)}>
                  <span className="rec-dur">{v.duration}</span>
                </div>
                <div className="rec-meta">
                  <p className="rec-title">{v.title}</p>
                  <p className="rec-ch">{v.channel}</p>
                  <p className="rec-views">
                    {v.views} {t("views")} · {v.ago}
                  </p>
                </div>
              </button>
            ))
          )}
        </aside>
      </div>
    </div>
  )
}
