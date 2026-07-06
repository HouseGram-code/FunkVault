import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[FunkVault] Missing Supabase env vars. Copy .env.example to .env and fill in " +
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (the publishable key).",
  )
}

/** Browser Supabase client. Uses the PUBLISHABLE (anon) key only. */
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
})

/** Public storage bucket that holds uploaded video files. */
export const VIDEO_BUCKET = "videos"
