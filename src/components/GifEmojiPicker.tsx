import { useState } from "react"
import type { CSSProperties } from "react"
import { FiX } from "./icons"
import { GIFS } from "../data/gifs"
import type { Gif } from "../data/gifs"

const EMOJIS = [
  "😀", "😂", "🤣", "😊", "😍", "😎", "🤩", "🥳",
  "😜", "😱", "😭", "😡", "😤", "🤯", "😴", "👀",
  "👍", "👎", "🙌", "🙏", "🤝", "👊", "🔥", "💯",
  "❤️", "💜", "💙", "✨", "⚡", "🎵", "🎤", "🎮",
  "🕺", "💃", "💀", "👻", "😈", "🌟", "🎉", "🥁",
]

const EMBED_BASE = "https://tenor.com/embed/"

interface GifEmojiPickerProps {
  onEmoji: (emoji: string) => void
  onGif: (gif: Gif) => void
  onClose: () => void
}

function tileStyle(aspect: number): CSSProperties {
  return { aspectRatio: String(aspect) }
}

export function GifEmojiPicker({ onEmoji, onGif, onClose }: GifEmojiPickerProps) {
  const [tab, setTab] = useState<"emoji" | "gif">("gif")

  return (
    <div className="picker" onClick={(e) => e.stopPropagation()}>
      <div className="picker-tabs">
        <button
          className={"pk-tab" + (tab === "emoji" ? " on" : "")}
          type="button"
          onClick={() => setTab("emoji")}
        >
          Emoji
        </button>
        <button
          className={"pk-tab" + (tab === "gif" ? " on" : "")}
          type="button"
          onClick={() => setTab("gif")}
        >
          GIF
        </button>
        <span className="pk-spacer" />
        <button className="pk-close" type="button" onClick={onClose} aria-label="Close">
          <FiX size={16} />
        </button>
      </div>

      {tab === "emoji" ? (
        <div className="emoji-grid">
          {EMOJIS.map((em) => (
            <button
              key={em}
              className="emoji"
              type="button"
              onClick={() => onEmoji(em)}
            >
              {em}
            </button>
          ))}
        </div>
      ) : (
        <div className="gif-scroll">
          <div className="gif-grid">
            {GIFS.map((g) => (
              <button
                key={g.id}
                className="gif-tile"
                type="button"
                style={tileStyle(g.aspect)}
                title={g.label}
                onClick={() => onGif(g)}
              >
                <iframe
                  src={EMBED_BASE + g.id}
                  title={g.label}
                  loading="lazy"
                  scrolling="no"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
