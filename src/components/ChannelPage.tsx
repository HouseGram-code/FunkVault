import type { CSSProperties } from "react"
import type { Channel, Video } from "../types"
import { channelColor } from "../utils"
import { VideoGrid } from "./VideoGrid"
import { FiArrowLeft, FiCheck, FiEdit2, FiUpload, VerifiedBadge } from "./icons"
import { useI18n } from "../i18n"

interface ChannelPageProps {
  channel: Channel
  videos: Video[]
  loading: boolean
  onBack: () => void
  onPlay: (v: Video) => void
  onOpenChannel: (channelId: string) => void
  onSubscribe: () => void
  onEdit: () => void
  onDelete: (v: Video) => void
  onUpload: () => void
}

export function ChannelPage({
  channel,
  videos,
  loading,
  onBack,
  onPlay,
  onOpenChannel,
  onSubscribe,
  onEdit,
  onDelete,
  onUpload,
}: ChannelPageProps) {
  const { t } = useI18n()
  const initial = channel.name.charAt(0).toUpperCase() || "?"

  const bannerStyle: CSSProperties = channel.banner
    ? { backgroundImage: `url(${channel.banner})` }
    : {
        background: `linear-gradient(120deg, ${channelColor(channel.name)}, #a35bff 60%, #22d3ee)`,
      }

  const avatarStyle: CSSProperties = channel.avatar
    ? { backgroundImage: `url(${channel.avatar})` }
    : {
        background: `linear-gradient(135deg, ${channelColor(channel.name)}, #ffffff33)`,
      }

  const subText = `${channel.subscribers} ${
    channel.subscribers === 1 ? t("subscriber") : t("subscribers")
  }`
  const vidText = `${channel.videoCount} ${
    channel.videoCount === 1 ? t("video_one") : t("video_many")
  }`

  return (
    <div className="channel-view">
      <button className="ch-back" type="button" onClick={onBack}>
        <FiArrowLeft size={18} /> {t("back")}
      </button>

      <div className="ch-banner" style={bannerStyle} />

      <div className="ch-top">
        <div className="ch-avatar-lg" style={avatarStyle}>
          {!channel.avatar && initial}
        </div>
        <div className="ch-top-info">
          <h1 className="ch-name-lg">
            {channel.name}
            {channel.verified && (
              <span className="verified-badge" title={t("creator_title")}>
                <VerifiedBadge size={22} />
              </span>
            )}
          </h1>
          <p className="ch-sub-line">
            {channel.handle && <span className="ch-handle">{channel.handle}</span>}
            {channel.handle && " · "}
            {subText} · {vidText}
          </p>
          {channel.bio && <p className="ch-bio">{channel.bio}</p>}

          <div className="ch-top-actions">
            {channel.isOwner ? (
              <>
                <button className="ch-edit-btn" type="button" onClick={onEdit}>
                  <FiEdit2 size={16} /> {t("customize_channel")}
                </button>
                <button className="ch-upload-btn" type="button" onClick={onUpload}>
                  <FiUpload size={16} /> {t("upload_video")}
                </button>
              </>
            ) : (
              <button
                className={"sub-btn" + (channel.subscribed ? " on" : "")}
                type="button"
                onClick={onSubscribe}
              >
                {channel.subscribed ? (
                  <>
                    <FiCheck size={16} /> {t("subscribed")}
                  </>
                ) : (
                  t("subscribe")
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {channel.verified && (
        <div className="creator-card">
          <span className="cc-badge" aria-hidden>
            <VerifiedBadge size={22} />
          </span>
          <div>
            <p className="creator-title">{t("creator_title")}</p>
            <p className="creator-sub">{t("creator_sub")}</p>
          </div>
        </div>
      )}

      <div className="ch-tabs">
        <span className="ch-tab on">{t("videos_tab")}</span>
      </div>

      {loading ? (
        <div className="ch-empty">{t("loading_channel")}</div>
      ) : videos.length === 0 ? (
        <div className="ch-empty">
          {channel.isOwner ? t("empty_owner") : t("empty_other")}
        </div>
      ) : (
        <VideoGrid
          videos={videos}
          onPlay={onPlay}
          onOpenChannel={onOpenChannel}
          onDelete={channel.isOwner ? onDelete : undefined}
        />
      )}
    </div>
  )
}
