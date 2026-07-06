import type { Video } from "../types"
import { VideoCard } from "./VideoCard"

interface VideoGridProps {
  videos: Video[]
  onPlay: (v: Video) => void
  onOpenChannel?: (channelId: string) => void
  onDelete?: (v: Video) => void
}

export function VideoGrid({ videos, onPlay, onOpenChannel, onDelete }: VideoGridProps) {
  return (
    <div className="grid">
      {videos.map((v) => (
        <VideoCard
          key={v.id}
          video={v}
          onPlay={onPlay}
          onOpenChannel={onOpenChannel}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
