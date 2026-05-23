import Link from 'next/link';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { cn } from '@namefi-astra/ui/lib/cn';
import { formatChapterTime } from '@/lib/watch/chapters';

type WatchVideoCardProps = {
  href: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  publishedAt: Date;
  dateFormatter: Intl.DateTimeFormat;
  className?: string;
};

export function WatchVideoCard({
  href,
  title,
  thumbnailUrl,
  durationSeconds,
  publishedAt,
  dateFormatter,
  className,
}: WatchVideoCardProps) {
  const durationLabel =
    durationSeconds > 0 ? formatChapterTime(durationSeconds) : null;
  return (
    <Link
      href={href}
      className={cn(
        'group block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70 focus-visible:ring-offset-0',
        className,
      )}
    >
      <Card className="relative overflow-hidden rounded-3xl border border-white/5 bg-card/80 p-0 shadow-[0_20px_60px_rgba(12,12,12,0.45)] transition-all duration-300 group-hover:border-brand-primary/50 group-hover:shadow-[0_30px_80px_rgba(16,255,191,0.24)]">
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          {/* biome-ignore lint/performance/noImgElement: thumbnail comes from YouTube's CDN; routing through Next/Image would add a useless proxy hop. */}
          <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {durationLabel && (
            <span className="absolute bottom-3 right-3 rounded-md bg-black/80 px-2 py-0.5 text-xs font-medium tabular-nums text-white">
              {durationLabel}
            </span>
          )}
        </div>
        <div className="space-y-2 px-5 py-5">
          <h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-white transition-colors duration-300 group-hover:text-brand-primary">
            {title}
          </h3>
          <time
            dateTime={publishedAt.toISOString()}
            className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
          >
            {dateFormatter.format(publishedAt)}
          </time>
        </div>
      </Card>
    </Link>
  );
}
