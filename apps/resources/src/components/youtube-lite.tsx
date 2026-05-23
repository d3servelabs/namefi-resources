'use client';

import { useState } from 'react';
import { cn } from '@namefi-astra/ui/lib/cn';

type YouTubeLiteProps = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  className?: string;
  startSeconds?: number;
};

// Defers loading the YouTube iframe (and its ~500KB of player JS) until the
// user activates the embed. Until then we render a static poster image with
// a play affordance, which keeps the watch list/detail LCP cheap.
export function YouTubeLite({
  videoId,
  title,
  thumbnailUrl,
  className,
  startSeconds,
}: YouTubeLiteProps) {
  const [activated, setActivated] = useState(false);

  if (activated) {
    const params = new URLSearchParams({
      autoplay: '1',
      rel: '0',
      modestbranding: '1',
    });
    if (startSeconds && startSeconds > 0) {
      params.set('start', String(Math.floor(startSeconds)));
    }
    const src = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
    return (
      <div
        className={cn(
          'relative aspect-video w-full overflow-hidden rounded-3xl border border-border/60 bg-black',
          className,
        )}
      >
        <iframe
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActivated(true)}
      aria-label={`Play video: ${title}`}
      className={cn(
        'group relative block aspect-video w-full overflow-hidden rounded-3xl border border-border/60 bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70 focus-visible:ring-offset-0',
        className,
      )}
    >
      {/* biome-ignore lint/performance/noImgElement: thumbnail comes from YouTube's CDN; Next/Image would proxy through our origin unnecessarily. */}
      <img
        src={thumbnailUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/60 backdrop-blur transition group-hover:scale-110 group-hover:bg-red-600/90 md:h-24 md:w-24">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-9 w-9 translate-x-0.5 text-white md:h-11 md:w-11"
            aria-hidden="true"
          >
            <title>Play</title>
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  );
}
