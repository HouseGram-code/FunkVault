import { useRef, useState } from "react"
import type { CSSProperties } from "react"
import type { Channel } from "../types"
import type { ChannelEdit } from "../lib/api"
import { USERNAME_RE } from "../lib/api"
import { channelColor } from "../utils"
import { FiCamera, FiX } from "./icons"
import { useI18n } from "../i18n"

interface ChannelEditModalProps {
  channel: Channel
  onClose: () => void
  onSave: (edit: ChannelEdit) => Promise<void>
}

const LOCK_DAYS = 5

export function ChannelEditModal({ channel, onClose, onSave }: ChannelEditModalProps) {
  const { t } = useI18n()
  const [name, setName] = useState(channel.name)
  const [username, setUsername] = useState(channel.username ?? "")
  const [bio, setBio] = useState(channel.bio ?? "")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(channel.avatar)
  const [bannerPreview, setBannerPreview] = useState<string | undefined>(channel.banner)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  // How many days until the username can be changed again.
  const daysLeft = (() => {
    if (!channel.usernameChangedAt) return 0
    const diff = (Date.now() - new Date(channel.usernameChangedAt).getTime()) / 86_400_000
    return diff >= LOCK_DAYS ? 0 : Math.ceil(LOCK_DAYS - diff)
  })()
  const usernameLocked = daysLeft > 0

  const bannerStyle: CSSProperties = bannerPreview
    ? { backgroundImage: `url(${bannerPreview})` }
    : {
        background: `linear-gradient(120deg, ${channelColor(name || "You")}, #a35bff 60%, #22d3ee)`,
      }
  const avatarStyle: CSSProperties = avatarPreview
    ? { backgroundImage: `url(${avatarPreview})` }
    : { background: `linear-gradient(135deg, ${channelColor(name || "You")}, #ffffff33)` }

  const pickAvatar = (f: File | undefined) => {
    if (!f) return
    setAvatarFile(f)
    setAvatarPreview(URL.createObjectURL(f))
  }
  const pickBanner = (f: File | undefined) => {
    if (!f) return
    setBannerFile(f)
    setBannerPreview(URL.createObjectURL(f))
  }

  const save = async () => {
    setError(null)
    const u = username.trim()
    const usernameChanged = u.toLowerCase() !== (channel.username ?? "").toLowerCase()
    if (usernameChanged) {
      if (!USERNAME_RE.test(u)) {
        setError(t("cc_username_invalid"))
        return
      }
      if (usernameLocked) {
        setError(t("cc_username_locked", { n: daysLeft }))
        return
      }
    }
    setSaving(true)
    try {
      await onSave({
        name,
        bio,
        avatarFile,
        bannerFile,
        username: usernameChanged ? u : undefined,
      })
      onClose()
    } catch (e) {
      const msg = (e as Error).message
      if (msg === "username_taken") setError(t("cc_taken"))
      else if (msg === "username_invalid") setError(t("cc_username_invalid"))
      else if (msg.startsWith("username_locked")) {
        const left = Number(msg.split(":")[1] || daysLeft)
        setError(t("cc_username_locked", { n: left }))
      } else setError(t("err_generic"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="edit-overlay" onClick={saving ? undefined : onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-head">
          <h3>{t("customize_channel")}</h3>
          <button className="edit-close" type="button" onClick={onClose} aria-label="Close">
            <FiX size={20} />
          </button>
        </div>

        <button
          className="edit-banner"
          type="button"
          style={bannerStyle}
          onClick={() => bannerRef.current?.click()}
        >
          <span className="edit-cam">
            <FiCamera size={18} />
          </span>
        </button>
        <input
          ref={bannerRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            pickBanner(e.target.files?.[0])
            e.currentTarget.value = ""
          }}
        />

        <div className="edit-avatar-row">
          <button
            className="edit-avatar"
            type="button"
            style={avatarStyle}
            onClick={() => avatarRef.current?.click()}
          >
            {!avatarPreview && (name.charAt(0).toUpperCase() || "?")}
            <span className="edit-avatar-cam">
              <FiCamera size={16} />
            </span>
          </button>
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              pickAvatar(e.target.files?.[0])
              e.currentTarget.value = ""
            }}
          />
        </div>

        <label className="edit-label">{t("cc_name")}</label>
        <input
          className="edit-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("cc_name_ph")}
          maxLength={60}
        />

        <label className="edit-label">{t("cc_username")}</label>
        <div className="cc-username">
          <span className="cc-at">@</span>
          <input
            className="edit-input"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
            placeholder={t("cc_username_ph")}
            maxLength={20}
            disabled={usernameLocked}
          />
        </div>
        <p className="cc-rule">
          {usernameLocked ? t("cc_username_locked", { n: daysLeft }) : t("cc_rule")}
        </p>

        <label className="edit-label">{t("um_description")}</label>
        <textarea
          className="edit-input edit-textarea"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t("um_description_ph")}
          rows={3}
          maxLength={500}
        />

        {error && <p className="auth-error">{error}</p>}

        <div className="edit-actions">
          <button className="btn-ghost" type="button" onClick={onClose} disabled={saving}>
            {t("cancel")}
          </button>
          <button className="btn-send" type="button" onClick={save} disabled={saving}>
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  )
}
