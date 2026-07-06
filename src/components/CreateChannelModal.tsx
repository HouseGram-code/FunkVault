import { useEffect, useRef, useState } from "react"
import { checkUsername, createChannel, USERNAME_RE } from "../lib/api"
import { useI18n } from "../i18n"
import { FiX, FiCheck, FiUsers } from "./icons"

interface CreateChannelModalProps {
  onClose: () => void
  onCreated: (channelId: string) => void
}

type Avail = "idle" | "checking" | "free" | "taken" | "invalid"

export function CreateChannelModal({ onClose, onCreated }: CreateChannelModalProps) {
  const { t } = useI18n()
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [avail, setAvail] = useState<Avail>("idle")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const seq = useRef(0)

  useEffect(() => {
    const u = username.trim()
    if (!u) {
      setAvail("idle")
      return
    }
    if (!USERNAME_RE.test(u)) {
      setAvail("invalid")
      return
    }
    setAvail("checking")
    const id = ++seq.current
    const timer = setTimeout(async () => {
      try {
        const free = await checkUsername(u)
        if (id === seq.current) setAvail(free ? "free" : "taken")
      } catch {
        if (id === seq.current) setAvail("idle")
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [username])

  const create = async () => {
    setError(null)
    if (!name.trim()) {
      setError(t("cc_name_required"))
      return
    }
    if (!USERNAME_RE.test(username.trim())) {
      setError(t("cc_username_invalid"))
      return
    }
    if (avail === "taken") {
      setError(t("cc_taken"))
      return
    }
    setBusy(true)
    try {
      const row = await createChannel({ name, username })
      onCreated(row.id)
    } catch (e) {
      const msg = (e as Error).message
      if (msg === "username_taken") {
        setAvail("taken")
        setError(t("cc_taken"))
      } else if (msg === "username_invalid") {
        setError(t("cc_username_invalid"))
      } else if (msg === "name_required") {
        setError(t("cc_name_required"))
      } else {
        setError(t("err_generic"))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="edit-overlay" onClick={busy ? undefined : onClose}>
      <div className="edit-modal cc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-head">
          <h3><FiUsers size={18} /> {t("cc_title")}</h3>
          <button className="edit-close" type="button" onClick={onClose} aria-label="Close" disabled={busy}>
            <FiX size={20} />
          </button>
        </div>

        <label className="edit-label">{t("cc_name")}</label>
        <input
          className="edit-input"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          placeholder={t("cc_name_ph")}
          maxLength={60}
          autoFocus
        />

        <label className="edit-label">{t("cc_username")}</label>
        <div className="cc-username">
          <span className="cc-at">@</span>
          <input
            className="edit-input"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.replace(/\s+/g, ""))
              setError(null)
            }}
            placeholder={t("cc_username_ph")}
            maxLength={20}
          />
          {avail === "checking" && <span className="cc-status checking">{t("cc_checking")}</span>}
          {avail === "free" && (
            <span className="cc-status free"><FiCheck size={14} /> {t("cc_available")}</span>
          )}
          {avail === "taken" && <span className="cc-status taken">{t("cc_taken")}</span>}
          {avail === "invalid" && <span className="cc-status taken">{t("cc_username_invalid")}</span>}
        </div>
        <p className="cc-rule">{t("cc_rule")}</p>

        {error && <p className="auth-error">{error}</p>}

        <div className="edit-actions">
          <button className="btn-ghost" type="button" onClick={onClose} disabled={busy}>
            {t("cancel")}
          </button>
          <button
            className="btn-send"
            type="button"
            onClick={create}
            disabled={busy || avail === "taken" || avail === "invalid"}
          >
            {busy ? t("cc_creating") : t("cc_create")}
          </button>
        </div>
      </div>
    </div>
  )
}
