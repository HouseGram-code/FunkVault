import { createClient } from "@supabase/supabase-js"

// The publishable (anon) key is safe to ship in the browser — access is guarded
// by Row Level Security. These fallbacks let the app run on any host (e.g.
// Vercel) even before environment variables are configured. To point the app at
// a different Supabase project, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// (in .env locally, or in the Vercel project's Environment Variables).
const FALLBACK_URL = "https://ngduugznnvpacpmkpaok.supabase.co"
const FALLBACK_ANON_KEY = "sb_publishable_INmFtuSKsyczJHXG8QWtbQ_sI5uP1_b"

const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || FALLBACK_URL
const anonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  FALLBACK_ANON_KEY

/** Exposed for the background-upload Service Worker (public anon values). */
export const SUPABASE_URL = url
export const SUPABASE_ANON_KEY = anonKey

/** Browser Supabase client. Uses the PUBLISHABLE (anon) key only. */
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
})

/** Public storage bucket that holds uploaded video files. */
export const VIDEO_BUCKET = "videos"
