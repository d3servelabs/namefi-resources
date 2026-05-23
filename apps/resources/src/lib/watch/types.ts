export type WatchChapter = {
  startSeconds: number;
  label: string;
};

// Identifier source: YouTube assigns the 11-character `videoId` (e.g.
// "SPEjerV7-sw"). We use it verbatim as the canonical key — never derived
// from the title, since YouTube titles can change without notice and would
// break our URLs and OG image references. No normalization is applied.
export type WatchVideo = {
  videoId: string;
  title: string;
  description: string;
  publishedAt: Date;
  // ISO 8601 duration string as returned by YouTube (e.g. "PT8M32S"). Kept
  // raw because `VideoObject.duration` expects exactly this format.
  duration: string;
  durationSeconds: number;
  thumbnailUrl: string;
  channelTitle: string;
  chapters: WatchChapter[];
};

// Identifier source: YouTube's `playlistId` (e.g. "PLdO0OV9gD760..."). The
// `title` and `description` come from the playlist's own YouTube metadata,
// so renaming the playlist on YouTube updates the site after ISR.
export type WatchPlaylist = {
  playlistId: string;
  title: string;
  description: string;
  videos: WatchVideo[];
};

// The grouped + flattened shape returned by the watch loader. Pages can
// either render groups (the index) or look up a single videoId (detail).
export type WatchData = {
  // Hero/spotlight videos surfaced at the top of the index. Configured
  // explicitly via `watchConfig.featured` and never duplicated in playlists
  // or extras.
  featured: WatchVideo[];
  playlists: WatchPlaylist[];
  // Videos from `videoIds` that aren't featured and aren't in any of the
  // playlists. Rendered as a final "Other" section when present.
  extras: WatchVideo[];
  // Deduplicated flat list across all sources, in resolution order. Used by
  // the detail page, sitemap, and any future cross-cutting needs.
  all: WatchVideo[];
};
