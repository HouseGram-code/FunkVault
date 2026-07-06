# FunkVault 🎵

A YouTube-style video hub with a **Friday Night Funkin'** neon look, built with
**React + TypeScript + Vite** and a real **Supabase** backend. Uploads, comments,
likes/dislikes and subscriptions are stored in Postgres + Storage and persist
across reloads and devices.

## Features

- **Real video upload** to Supabase Storage with an auto-generated thumbnail.
- **Persistent comments** (with emoji + Tenor GIF picker) stored in Postgres.
- **Real likes / dislikes, comment likes and channel subscriptions** (per browser).
- **View counter** that increments when you open a video.
- Built-in custom video player, sidebar, search, responsive layout.
- **FNF color theme**: neon pink, cyan, purple, green on deep purple.

## 1. Set up Supabase (one time)

1. Open your project → **SQL Editor** → **New query**.
2. Paste the whole of [`supabase/schema.sql`](./supabase/schema.sql) and press **Run**.
   This creates the tables, the stats view, the view-counter function, RLS
   policies, and the public `videos` storage bucket.
3. (Large files) In **Storage → Settings**, raise the *Upload file size limit*
   if you plan to upload big videos (the default is small).

## 2. Configure keys

`.env` is already filled in for this project. To use another project, copy
`.env.example` to `.env` and set:

```
VITE_SUPABASE_URL=https://YOUR-REF.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
```

> ⚠️ **Security:** only the **publishable (anon)** key goes in the app — it's
> meant to be public and is protected by Row Level Security. **Never** put the
> **secret** key in the frontend or commit it. If a secret key was ever shared,
> rotate it in *Project Settings → API*.

## 3. Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Structure

```
supabase/
  schema.sql            # run once in the SQL editor
src/
  main.tsx              # entry
  App.tsx               # state + layout (wired to Supabase)
  styles.css            # FNF theme
  types.ts
  utils.ts              # thumbnail capture, formatting
  lib/
    supabase.ts         # browser client (publishable key)
    api.ts              # videos, comments, likes, subscriptions
  data/gifs.ts          # Tenor GIF list for the picker
  components/
    Header.tsx  Sidebar.tsx  UploadZone.tsx
    VideoCard.tsx  VideoGrid.tsx
    PlayerModal.tsx  VideoPlayer.tsx  GifEmojiPicker.tsx
    Arrows.tsx  icons.tsx
```
