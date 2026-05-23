// Source of truth for which YouTube videos appear under /r/[lang]/watch.
//
// Sections (rendered in this order, deduplicated across them — first-wins):
//   1. `featured` — hero/spotlight section at the top
//   2. `playlistIds` — each playlist becomes its own section, in array order
//   3. `videoIds` — catch-all "Other" section for one-offs not in a playlist
//   4. `excluded` — videoIds to suppress regardless of source
//
// Editing playlistIds/videoIds/featured/excluded requires a redeploy. Items
// inside the playlists themselves can be added/reordered/removed on YouTube
// and the site picks up changes after `revalidateSeconds` (ISR).
//
// Override at runtime by setting YOUTUBE_PLAYLIST_IDS (comma-separated).
const envPlaylistIds = process.env.YOUTUBE_PLAYLIST_IDS?.split(',')
  .map((id) => id.trim())
  .filter((id) => id.length > 0);

const defaultPlaylistIds = [
  'PLdO0OV9gD760YKAdgr7rm2LATT4TuuPgB',
  'PLdO0OV9gD761ddxz71tmNIsMnTrDozDEH',
  'PLdO0OV9gD762IC_quqWqVBlsFfrpJfdJt',
];

export const watchConfig = {
  playlistIds:
    envPlaylistIds && envPlaylistIds.length > 0
      ? envPlaylistIds
      : defaultPlaylistIds,
  // Hero spotlight at the top of the page. "Namefi Song" lives here because
  // it's a short branded piece that doesn't belong in any tutorial/interview
  // playlist but should still be findable.
  featured: ['SPEjerV7-sw'] as string[],
  videoIds: [] as string[],
  excluded: [] as string[],
  revalidateSeconds: 600,
} as const;

export type WatchConfig = typeof watchConfig;
