import type { CSSProperties, MouseEvent } from "react"
import { BsPlayFill, FiTrash2, VerifiedBadge } from "./icons"
import type { Video } from "../types"
import { Arrows } from "./Arrows"
import { channelColor } from "../utils"
import { useI18n } from "../i18n"

interface VideoCardProps {
  video: Video
  onPlay: (v: Video) => void
  onOpenChannel?: (channelId: string) => void
  onDelete?: (v: Video) => void
}

export function VideoCard({ video, onPlay, onOpenChannel, onDelete }: VideoCardProps) {
  const { t } = useI18n()
  const gradStyle: CSSProperties = {
    background: video.grad ?? "linear-gradient(135deg,#ff2d8f,#a35bff)",
  }
  const dotStyle: CSSProperties = video.channelAvatar
    ? { backgroundImage: `url(${video.channelAvatar})` }
    : {
        background: `linear-gradient(135deg, ${channelColor(video.channel)}, #ffffff55)`,
      }

  const openChannel = (e: MouseEvent) => {
    if (!onOpenChannel || !video.channelId) return
    e.stopPropagation()
    onOpenChannel(video.channelId)
  }

  const remove = (e: MouseEvent) => {
    e.stopPropagation()
    if (!onDelete) return
    if (confirm(t("vc_delete_confirm", { title: video.title }))) onDelete(video)
  }

  const clickable = !!onOpenChannel && !!video.channelId

  return (
    <div className="card" onClick={() => onPlay(video)}>
      <div className="thumb-wrap">
        {video.thumb ? (
          <img src={video.thumb} alt={video.title} />
        ) : (
          <div className="thumb-grad" style={gradStyle}>
            <div className="ghost">
              <Arrows size={30} />
            </div>
          </div>
        )}

        <span className="dur">{video.duration}</span>
        {onDelete && (
          <button className="card-del" type="button" onClick={remove} aria-label={t("vc_delete_aria")}>
            <FiTrash2 size={16} />
          </button>
        )}
        <div className="play-overlay">
          <div className="pbtn" aria-hidden>
            <BsPlayFill size={30} />
          </div>
        </div>
      </div>

      <div className="meta">
        <div
          className={"ch-dot" + (clickable ? " clickable" : "")}
          style={dotStyle}
          onClick={openChannel}
        >
          {!video.channelAvatar && video.channel.charAt(0).toUpperCase()}
        </div>
        <div className="info">
          <p className="title">{video.title}</p>
          <p
            className={"byline" + (clickable ? " clickable" : "")}
            onClick={openChannel}
          >
            {video.channel}
            {video.channelVerified && (
              <span className="verified-badge sm" aria-label={t("verified")}>
                <VerifiedBadge size={13} />
              </span>
            )}
          </p>
          <p className="stats">
            {video.views} {t("views")} · {video.ago}
          </p>
        </div>
      </div>
    </div>
  )
}
