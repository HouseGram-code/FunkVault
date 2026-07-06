import { useEffect, useState } from "react"
import { adminListUsers, adminSetBan, adminStats } from "../lib/api"
import type { AdminStats, AdminUser } from "../lib/api"
import { FiX, FiShield, FiUserX, FiCheck } from "./icons"
import { useI18n } from "../i18n"

interface AdminPanelProps {
  onClose: () => void
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const { t } = useI18n()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [q, setQ] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const list = await adminListUsers()
      setUsers(list)
      setStats(await adminStats(list))
      setError(null)
    } catch (e) {
      setError(t("admin_error"))
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleBan = async (u: AdminUser) => {
    setBusyId(u.id)
    try {
      await adminSetBan(u.id, !u.banned)
      await load()
    } catch (e) {
      console.error(e)
    } finally {
      setBusyId(null)
    }
  }

  const filtered = users.filter((u) => {
    const s = q.trim().toLowerCase()
    if (!s) return true
    return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
  })

  return (
    <div className="edit-overlay" onClick={onClose}>
      <div className="edit-modal admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-head">
          <h3 className="admin-h">
            <FiShield size={18} /> {t("admin_title")}
          </h3>
          <button
            className="edit-close"
            type="button"
            onClick={onClose}
            aria-label={t("cancel")}
          >
            <FiX size={20} />
          </button>
        </div>

        {stats && (
          <div className="admin-stats">
            <div className="admin-stat">
              <span className="as-num">{stats.users}</span>
              <span className="as-lbl">{t("admin_users")}</span>
            </div>
            <div className="admin-stat">
              <span className="as-num">{stats.banned}</span>
              <span className="as-lbl">{t("admin_banned")}</span>
            </div>
            <div className="admin-stat">
              <span className="as-num">{stats.videos}</span>
              <span className="as-lbl">{t("admin_videos")}</span>
            </div>
            <div className="admin-stat">
              <span className="as-num">{stats.channels}</span>
              <span className="as-lbl">{t("admin_channels")}</span>
            </div>
          </div>
        )}

        <input
          className="admin-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("admin_search")}
        />

        {loading ? (
          <p className="admin-empty">{t("admin_loading")}</p>
        ) : error ? (
          <p className="admin-empty">{error}</p>
        ) : (
          <div className="admin-list">
            {filtered.map((u) => (
              <div className={"admin-row" + (u.banned ? " banned" : "")} key={u.id}>
                <div className="ar-avatar">
                  {u.name.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="ar-info">
                  <p className="ar-name">
                    {u.name}
                    {u.isAdmin && <span className="ar-tag admin">{t("admin_tag")}</span>}
                    {u.banned && <span className="ar-tag ban">{t("admin_banned_tag")}</span>}
                  </p>
                  <p className="ar-email">{u.email}</p>
                </div>
                {u.isAdmin ? (
                  <span className="ar-protected">{t("admin_protected")}</span>
                ) : (
                  <button
                    className={"ar-btn" + (u.banned ? " unban" : " ban")}
                    type="button"
                    disabled={busyId === u.id}
                    onClick={() => toggleBan(u)}
                  >
                    {u.banned ? (
                      <>
                        <FiCheck size={15} /> {t("admin_unban")}
                      </>
                    ) : (
                      <>
                        <FiUserX size={15} /> {t("admin_ban")}
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
            {filtered.length === 0 && <p className="admin-empty">{t("admin_none")}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
