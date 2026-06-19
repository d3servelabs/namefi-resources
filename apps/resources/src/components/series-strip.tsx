import Link from 'next/link';

export type SeriesStripEpisode = { title: string; href: string };

// On-post episode navigation for a series: shows which series/episode the post
// is, links to the series landing, and offers prev/next so readers can binge
// the arc. A bordered block is warranted here — it's a distinct navigation
// affordance below the article prose, not decoration.
export function SeriesStrip({
  seriesTitle,
  seriesHref,
  position,
  total,
  labels,
  previous,
  next,
}: {
  seriesTitle: string;
  seriesHref: string;
  position: number;
  total: number;
  labels: {
    partOf: string;
    allEpisodes: string;
    previous: string;
    next: string;
  };
  previous?: SeriesStripEpisode;
  next?: SeriesStripEpisode;
}) {
  return (
    <nav
      aria-label={seriesTitle}
      className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/40 p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <span className="text-xs uppercase tracking-[0.2em]">
            {labels.partOf}
          </span>{' '}
          <Link
            href={seriesHref}
            className="font-semibold text-foreground transition-colors hover:text-brand-primary"
          >
            {seriesTitle}
          </Link>{' '}
          <span>
            · {position}/{total}
          </span>
        </p>
        <Link
          href={seriesHref}
          className="text-sm font-medium text-brand-primary hover:underline"
        >
          {labels.allEpisodes}
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {previous ? (
          <Link
            href={previous.href}
            className="group rounded-xl border border-border/50 p-4 transition hover:border-brand-primary/50"
          >
            <span className="block text-xs uppercase tracking-wide text-muted-foreground">
              ← {labels.previous}
            </span>
            <span className="mt-1 block font-medium text-foreground transition-colors group-hover:text-brand-primary">
              {previous.title}
            </span>
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
        {next ? (
          <Link
            href={next.href}
            className="group rounded-xl border border-border/50 p-4 transition hover:border-brand-primary/50 sm:text-right"
          >
            <span className="block text-xs uppercase tracking-wide text-muted-foreground">
              {labels.next} →
            </span>
            <span className="mt-1 block font-medium text-foreground transition-colors group-hover:text-brand-primary">
              {next.title}
            </span>
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
    </nav>
  );
}
