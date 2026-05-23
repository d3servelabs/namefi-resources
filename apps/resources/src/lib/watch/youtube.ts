import 'server-only';
import type { WatchVideo } from './types';
import { parseChaptersFromDescription } from './chapters';
import { watchConfig } from './config';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

type YouTubeThumbnail = { url: string; width?: number; height?: number };

type PlaylistItemsResponse = {
  items?: Array<{
    contentDetails?: { videoId?: string };
  }>;
  nextPageToken?: string;
};

type PlaylistsListResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
    };
  }>;
};

export type PlaylistMetadata = {
  playlistId: string;
  title: string;
  description: string;
};

type VideosListResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      channelTitle?: string;
      thumbnails?: Record<string, YouTubeThumbnail | undefined>;
    };
    contentDetails?: {
      duration?: string;
    };
  }>;
};

function requireApiKey(): string {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'YOUTUBE_API_KEY is not set. Add it to the environment to enable the /watch collection.',
    );
  }
  return apiKey;
}

// Cap each YouTube API call so a hung upstream doesn't pin a Vercel function
// for the full 300s execution limit. 10s is comfortably above p99 for these
// endpoints and short enough that ISR can fail fast and serve stale.
const YOUTUBE_FETCH_TIMEOUT_MS = 10_000;

async function youtubeFetch<T>(
  path: string,
  params: URLSearchParams,
): Promise<T> {
  params.set('key', requireApiKey());
  const url = `${YOUTUBE_API_BASE}/${path}?${params.toString()}`;
  const response = await fetch(url, {
    next: { revalidate: watchConfig.revalidateSeconds, tags: ['watch'] },
    signal: AbortSignal.timeout(YOUTUBE_FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `YouTube API ${path} returned ${response.status}: ${body.slice(0, 200)}`,
    );
  }
  return (await response.json()) as T;
}

// ISO 8601 PT#H#M#S → seconds. YouTube always uses uppercase tokens; we only
// recognise H/M/S since YouTube videos can't exceed a few hours practically.
const ISO_DURATION_PATTERN = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
function isoDurationToSeconds(duration: string | undefined): number {
  if (!duration) return 0;
  const match = ISO_DURATION_PATTERN.exec(duration);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (
    (h ? Number.parseInt(h, 10) : 0) * 3600 +
    (m ? Number.parseInt(m, 10) : 0) * 60 +
    (s ? Number.parseInt(s, 10) : 0)
  );
}

function pickThumbnail(
  thumbnails: Record<string, YouTubeThumbnail | undefined> | undefined,
  videoId: string,
): string {
  const ordered = ['maxres', 'standard', 'high', 'medium', 'default'];
  if (thumbnails) {
    for (const key of ordered) {
      const candidate = thumbnails[key]?.url;
      if (candidate) return candidate;
    }
  }
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export async function fetchPlaylistMetadata(
  playlistIds: readonly string[],
): Promise<PlaylistMetadata[]> {
  if (playlistIds.length === 0) return [];
  const params = new URLSearchParams({
    part: 'snippet',
    id: playlistIds.join(','),
    maxResults: String(playlistIds.length),
  });
  const data = await youtubeFetch<PlaylistsListResponse>('playlists', params);
  return (data.items ?? []).flatMap((item) => {
    if (!item.id) return [];
    return [
      {
        playlistId: item.id,
        title: item.snippet?.title ?? '',
        description: item.snippet?.description ?? '',
      },
    ];
  });
}

export async function fetchPlaylistVideoIds(
  playlistId: string,
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  // Hard cap defensively in case a misconfigured playlist would otherwise
  // loop. 200 videos is well past anything we plan to surface.
  for (let page = 0; page < 4; page += 1) {
    const params = new URLSearchParams({
      part: 'contentDetails',
      playlistId,
      maxResults: '50',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const data = await youtubeFetch<PlaylistItemsResponse>(
      'playlistItems',
      params,
    );
    for (const item of data.items ?? []) {
      const id = item.contentDetails?.videoId;
      if (id) ids.push(id);
    }
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return ids;
}

export async function fetchVideosByIds(
  videoIds: readonly string[],
): Promise<WatchVideo[]> {
  if (videoIds.length === 0) return [];
  // YouTube's videos.list accepts up to 50 IDs per call.
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }
  const results: WatchVideo[] = [];
  for (const chunk of chunks) {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      id: chunk.join(','),
      maxResults: String(chunk.length),
    });
    const data = await youtubeFetch<VideosListResponse>('videos', params);
    for (const item of data.items ?? []) {
      if (!item.id || !item.snippet) continue;
      const description = item.snippet.description ?? '';
      const duration = item.contentDetails?.duration ?? 'PT0S';
      results.push({
        videoId: item.id,
        title: item.snippet.title ?? '',
        description,
        publishedAt: item.snippet.publishedAt
          ? new Date(item.snippet.publishedAt)
          : new Date(0),
        duration,
        durationSeconds: isoDurationToSeconds(duration),
        thumbnailUrl: pickThumbnail(item.snippet.thumbnails, item.id),
        channelTitle: item.snippet.channelTitle ?? '',
        chapters: parseChaptersFromDescription(description),
      });
    }
  }
  return results;
}
