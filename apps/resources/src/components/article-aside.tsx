import Link from 'next/link';
import type { TocEntry } from '@/lib/content';

export type AsideTaxonomyLink = { name: string; href: string };

// Sticky left rail for an article: a Table of Contents (jump links to the
// rehype-slug heading ids) followed by this post's Topic (cluster) and Series
// context. Renders nothing when there is no ToC and no taxonomy to show.
export function ArticleAside({
  toc,
  labels,
  topic,
  series,
}: {
  toc: TocEntry[];
  labels: { onThisPage: string; topic: string; series: string };
  topic?: AsideTaxonomyLink;
  series?: AsideTaxonomyLink;
}) {
  if (toc.length === 0 && !topic && !series) return null;

  return (
    <div className="sticky top-24 flex flex-col gap-8 text-sm">
      {toc.length > 0 && (
        <nav aria-label={labels.onThisPage} className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {labels.onThisPage}
          </h2>
          <ul className="flex flex-col gap-2">
            {toc.map((item) => (
              <li key={item.id} className={item.depth === 3 ? 'pl-4' : ''}>
                <a
                  href={`#${item.id}`}
                  className="block leading-snug text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {(topic || series) && (
        <div className="flex flex-col gap-4">
          {topic && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {labels.topic}
              </span>
              <Link
                href={topic.href}
                className="font-medium text-foreground transition-colors hover:text-brand-primary"
              >
                {topic.name}
              </Link>
            </div>
          )}
          {series && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {labels.series}
              </span>
              <Link
                href={series.href}
                className="font-medium text-foreground transition-colors hover:text-brand-primary"
              >
                {series.name}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
