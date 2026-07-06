import type { Video } from "../types"

// Cohesive pink / purple / cyan / blue family — keeps thumbnails on-brand.
const GRADS = [
  "linear-gradient(135deg,#ff2d8f 0%,#a35bff 100%)",
  "linear-gradient(135deg,#22d3ee 0%,#5a6bff 100%)",
  "linear-gradient(135deg,#a35bff 0%,#22d3ee 100%)",
  "linear-gradient(135deg,#ff5c72 0%,#ff2d8f 100%)",
  "linear-gradient(135deg,#5a6bff 0%,#ff2d8f 100%)",
  "linear-gradient(135deg,#22d3ee 0%,#a35bff 100%)",
]

const RAW = [
  { title: "VS Sonic.exe — FULL WEEK Showcase", channel: "FunkVault Official", views: "1.2M", ago: "3 days ago", duration: "12:04" },
  { title: "Tails Gets Funky — Mod Preview", channel: "ModBeats", views: "842K", ago: "1 week ago", duration: "4:37" },
  { title: "Neon Night Battle [HARD]", channel: "NeonFunk", views: "318K", ago: "2 days ago", duration: "8:12" },
  { title: "Pixel Funk — Custom Chart", channel: "RhythmRiot", views: "96K", ago: "5 hours ago", duration: "3:29" },
  { title: "Arrow Mania Speedrun — World Record", channel: "FunkVault Official", views: "2.4M", ago: "1 month ago", duration: "6:55" },
  { title: "Boyfriend vs Girlfriend — Remix", channel: "GrooveGauntlet", views: "512K", ago: "4 days ago", duration: "5:18" },
  { title: "Funkin' Hub — Top 10 Mods of 2026", channel: "NeonFunk", views: "733K", ago: "6 days ago", duration: "15:41" },
  { title: "How I Chart a Song in 10 Minutes", channel: "RhythmRiot", views: "128K", ago: "2 weeks ago", duration: "10:02" },
]

export const SEED_VIDEOS: Video[] = RAW.map((v, i) => ({
  ...v,
  id: `seed-${i}`,
  grad: GRADS[i % GRADS.length],
  demo: true,
}))
