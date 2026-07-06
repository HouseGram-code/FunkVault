import { supabase } from "./supabase"

export interface Account {
  id: string
  name: string
  email: string
  isAdmin?: boolean
  banned?: boolean
}

const SESSION_KEY = "fv_session"
const CLIENT_KEY = "fv_client_id"

/** SHA-256 hex of the password (with a static app salt). Demo-grade only. */
export async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(`funkvault::${pw}`)
  const buf = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function getSession(): Account | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Account) : null
  } catch {
    return null
  }
}

function setSession(a: Account) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(a))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

function browserId(): string {
  let id = localStorage.getItem(CLIENT_KEY)
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(CLIENT_KEY, id)
  }
  return id
}

/** The id used for ownership, likes, subscriptions: the logged-in account id. */
export function getActorId(): string {
  return getSession()?.id ?? browserId()
}

export function currentName(): string {
  return getSession()?.name ?? "You"
}

/** True when the signed-in account is the FunkVault admin/creator. */
export function isAdmin(): boolean {
  return getSession()?.isAdmin === true
}

type AccountRow = {
  id: string
  name: string
  email: string
  is_admin?: boolean
  banned?: boolean
}

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    isAdmin: row.is_admin === true,
    banned: row.banned === true,
  }
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<Account> {
  const hash = await hashPassword(password)
  const { data, error } = await supabase.rpc("register_account", {
    p_name: name.trim(),
    p_email: email.trim(),
    p_password_hash: hash,
  })
  if (error) {
    if (
      error.message?.includes("email_taken") ||
      (error as { code?: string }).code === "23505"
    ) {
      throw new Error("email_taken")
    }
    throw error
  }
  const row = (Array.isArray(data) ? data[0] : data) as AccountRow | undefined
  if (!row) throw new Error("register_failed")
  const acc = toAccount(row)
  setSession(acc)
  return acc
}

export async function login(email: string, password: string): Promise<Account> {
  const hash = await hashPassword(password)
  const { data, error } = await supabase.rpc("login_account", {
    p_email: email.trim(),
    p_password_hash: hash,
  })
  if (error) throw error
  const row = (Array.isArray(data) ? data[0] : data) as AccountRow | undefined
  if (!row) throw new Error("invalid_login")
  const acc = toAccount(row)
  if (acc.banned) throw new Error("banned")
  setSession(acc)
  return acc
}

/**
 * Re-read the signed-in account from the server and update the stored session.
 * This keeps `isAdmin` / `banned` correct even for sessions that were created
 * before those fields existed. Returns null if the account is now banned.
 */
export async function refreshAccount(): Promise<Account | null> {
  const current = getSession()
  if (!current) return null
  try {
    const { data, error } = await supabase.rpc("get_account", { p_id: current.id })
    if (error) return current
    const row = (Array.isArray(data) ? data[0] : data) as AccountRow | undefined
    if (!row) return current
    const acc = toAccount(row)
    if (acc.banned) {
      clearSession()
      return null
    }
    setSession(acc)
    return acc
  } catch {
    return current
  }
}
