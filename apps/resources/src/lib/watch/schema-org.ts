import type { Locale } from '@/i18n-config';
import type { WatchVideo } from './types';

// Shared Schema.org publisher payload referenced by every watch page so the
// Organization is consistently described and de-duplicated by @id on the
// Google side.
function buildPublisher(baseUrl: string) {
  return {
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'Namefi',
    url: 'https://namefi.io',
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/r/logotype.svg`,
    },
    sameAs: [
      'https://x.com/namefi_io',
      'https://www.youtube.com/@namefi',
      'https://github.com/d3servelabs',
    ],
  };
}

type Breadcrumb = { name: string; url: string };

export function buildBreadcrumbJsonLd(
  items: readonly Breadcrumb[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

type VideoClip = {
  '@type': 'Clip';
  name: string;
  startOffset: number;
  endOffset?: number;
  url: string;
};

export function buildVideoObjectJsonLd(
  video: WatchVideo,
  options: {
    baseUrl: string;
    canonicalUrl: string;
    locale: Locale;
  },
): Record<string, unknown> {
  const watchUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${video.videoId}`;

  const hasPart: VideoClip[] = video.chapters.map((chapter, index) => {
    const next = video.chapters[index + 1];
    const endOffset = next ? next.startSeconds : video.durationSeconds;
    return {
      '@type': 'Clip',
      name: chapter.label,
      startOffset: chapter.startSeconds,
      endOffset: endOffset > chapter.startSeconds ? endOffset : undefined,
      url: `${watchUrl}&t=${chapter.startSeconds}s`,
    };
  });

  // SeekToAction makes the video eligible for Google's "Key Moments" rich
  // result, which surfaces clickable chapter thumbnails directly in SERPs.
  // It's only meaningful when we have chapters declared via hasPart.
  const potentialAction =
    hasPart.length > 0
      ? {
          '@type': 'SeekToAction',
          target: `${watchUrl}&t={seek_to_second_number}`,
          'startOffset-input': 'required name=seek_to_second_number',
        }
      : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${options.canonicalUrl}#video`,
    name: video.title,
    description: video.description || video.title,
    thumbnailUrl: [video.thumbnailUrl],
    uploadDate: video.publishedAt.toISOString(),
    duration: video.duration,
    contentUrl: watchUrl,
    embedUrl,
    // We don't know per-video spoken language without extra YouTube API
    // calls; videos on the @namefi channel are produced in English, so we
    // declare en as the audio language regardless of page locale.
    inLanguage: 'en',
    isFamilyFriendly: true,
    publisher: buildPublisher(options.baseUrl),
    ...(hasPart.length > 0 ? { hasPart } : {}),
    ...(potentialAction ? { potentialAction } : {}),
  };
}

export function buildVideoCollectionJsonLd(
  videos: readonly WatchVideo[],
  options: {
    baseUrl: string;
    canonicalUrl: string;
    locale: Locale;
    name: string;
    description: string;
  },
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${options.canonicalUrl}#collection`,
    name: options.name,
    description: options.description,
    url: options.canonicalUrl,
    inLanguage: options.locale,
    publisher: buildPublisher(options.baseUrl),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: videos.length,
      itemListElement: videos.map((video, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${options.baseUrl}/r/${options.locale}/watch/${video.videoId}`,
        name: video.title,
      })),
    },
  };
}
