import 'server-only';
import { cache } from 'react';
import { watchConfig } from './config';
import {
  fetchPlaylistMetadata,
  fetchPlaylistVideoIds,
  fetchVideosByIds,
} from './youtube';
import type { WatchData, WatchPlaylist, WatchVideo } from './types';

function dedupePreserveOrder(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

async function loadWatchData(): Promise<WatchData> {
  // Fetch playlist contents and metadata in parallel. fetchPlaylistVideoIds
  // runs per-playlist (paginated); fetchPlaylistMetadata batches all titles
  // into a single playlists.list call.
  //
  // We use allSettled rather than Promise.all so a single failing playlist
  // (404, throttling, transient network blip) degrades to that playlist
  // being empty instead of 500-ing the whole watch page.
  const idListsSettled = await Promise.allSettled(
    watchConfig.playlistIds.map((id) => fetchPlaylistVideoIds(id)),
  );
  const playlistVideoIdLists = idListsSettled.map((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    console.error(
      `[watch] Failed to fetch videos for playlist ${watchConfig.playlistIds[index]}:`,
      result.reason,
    );
    return [] as string[];
  });

  let playlistMetadataList: Awaited<ReturnType<typeof fetchPlaylistMetadata>> =
    [];
  try {
    playlistMetadataList = await fetchPlaylistMetadata(watchConfig.playlistIds);
  } catch (error) {
    console.error('[watch] Failed to fetch playlist metadata:', error);
  }
  const metadataByPlaylistId = new Map(
    playlistMetadataList.map((meta) => [meta.playlistId, meta]),
  );

  const excluded = new Set(watchConfig.excluded);

  // Union of everything we'd consider showing, in resolution order. Used to
  // batch a single videos.list lookup for all enriched metadata.
  const allCandidateIds = dedupePreserveOrder([
    ...watchConfig.featured,
    ...playlistVideoIdLists.flat(),
    ...watchConfig.videoIds,
  ]).filter((id) => !excluded.has(id));

  if (allCandidateIds.length === 0) {
    return { featured: [], playlists: [], extras: [], all: [] };
  }

  const videos = await fetchVideosByIds(allCandidateIds);
  const videoById = new Map(videos.map((video) => [video.videoId, video]));

  // First-wins assignment so a video never appears in two sections.
  const claimed = new Set<string>();
  const claim = (id: string): WatchVideo | undefined => {
    if (claimed.has(id) || excluded.has(id)) return undefined;
    const video = videoById.get(id);
    if (!video) return undefined;
    claimed.add(id);
    return video;
  };

  const featured: WatchVideo[] = watchConfig.featured.flatMap((id) => {
    const v = claim(id);
    return v ? [v] : [];
  });

  const playlists: WatchPlaylist[] = watchConfig.playlistIds.map(
    (playlistId, index) => {
      const meta = metadataByPlaylistId.get(playlistId);
      const ids = playlistVideoIdLists[index] ?? [];
      const playlistVideos: WatchVideo[] = ids.flatMap((id) => {
        const v = claim(id);
        return v ? [v] : [];
      });
      return {
        playlistId,
        title: meta?.title ?? '',
        description: meta?.description ?? '',
        videos: playlistVideos,
      };
    },
  );

  const extras: WatchVideo[] = watchConfig.videoIds.flatMap((id) => {
    const v = claim(id);
    return v ? [v] : [];
  });

  const all: WatchVideo[] = [
    ...featured,
    ...playlists.flatMap((p) => p.videos),
    ...extras,
  ];

  return { featured, playlists, extras, all };
}

// Cached at the React request scope so list + sitemap + detail render in a
// single render share one fetch. The underlying fetch is ISR-cached at the
// Next layer for `revalidateSeconds`, which controls cross-request freshness.
export const getWatchData = cache(loadWatchData);

export async function getWatchVideos(): Promise<WatchVideo[]> {
  const data = await getWatchData();
  return data.all;
}

export async function getWatchVideo(
  videoId: string,
): Promise<WatchVideo | undefined> {
  const data = await getWatchData();
  return data.all.find((video) => video.videoId === videoId);
}

export type {
  WatchVideo,
  WatchChapter,
  WatchPlaylist,
  WatchData,
} from './types';
