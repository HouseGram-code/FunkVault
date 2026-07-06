import { useState } from "react"
import { login, register } from "../lib/auth"
import type { Account } from "../lib/auth"
import { useI18n } from "../i18n"
import { Arrows } from "./Arrows"
import { FiUser, FiMail, FiLock } from "./icons"

interface AuthScreenProps {
  onAuthed: (acc: Account) => void
}

export function AuthScreen({ onAuthed }: AuthScreenProps) {
  const { t } = useI18n()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSignup = mode === "signup"

  const submit = async () => {
    setError(null)
    if (!email.trim() || !password.trim() || (isSignup && !name.trim())) {
      setError(t("err_fill_all"))
      return
    }
    setBusy(true)
    try {
      const acc = isSignup
        ? await register(name, email, password)
        : await login(email, password)
      onAuthed(acc)
    } catch (e) {
      const msg = (e as Error).message
      if (msg === "email_taken") setError(t("err_email_taken"))
      else if (msg === "invalid_login") setError(t("err_invalid_login"))
      else if (msg === "banned") setError(t("err_banned"))
      else setError(t("err_generic"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-bg" aria-hidden />
      <div className="auth-card">
        <div className="auth-brand">
          <div className="arrows">
            <Arrows size={18} />
          </div>
          <h1>
            <span className="vault">Funk</span>
            <span className="funk">Vault</span>
          </h1>
        </div>
        <p className="auth-welcome">{t("welcome_to")} FunkVault</p>
        <p className="auth-sub">{t("welcome_sub")}</p>

        <div className="auth-tabs">
          <button
            type="button"
            className={"auth-tab" + (!isSignup ? " on" : "")}
            onClick={() => {
              setMode("signin")
              setError(null)
            }}
          >
            {t("sign_in")}
          </button>
          <button
            type="button"
            className={"auth-tab" + (isSignup ? " on" : "")}
            onClick={() => {
              setMode("signup")
              setError(null)
            }}
          >
            {t("sign_up")}
          </button>
        </div>

        <div className="auth-form">
          {isSignup && (
            <label className="auth-field">
              <span className="af-ic"><FiUser size={18} /></span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("name_ph")}
                autoComplete="name"
              />
            </label>
          )}
          <label className="auth-field">
            <span className="af-ic"><FiMail size={18} /></span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email_ph")}
              autoComplete="email"
            />
          </label>
          <label className="auth-field">
            <span className="af-ic"><FiLock size={18} /></span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("password_ph")}
              autoComplete={isSignup ? "new-password" : "current-password"}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit()
              }}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="button" onClick={submit} disabled={busy}>
            {busy ? "…" : isSignup ? t("create_btn") : t("log_in_btn")}
          </button>
        </div>

        <p className="auth-switch">
          {isSignup ? t("have_account") : t("no_account")}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(isSignup ? "signin" : "signup")
              setError(null)
            }}
          >
            {isSignup ? t("go_signin") : t("go_signup")}
          </button>
        </p>
      </div>
    </div>
  )
}
