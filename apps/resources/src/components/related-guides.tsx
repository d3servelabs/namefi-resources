import Link from 'next/link';

export type RelatedGuide = {
  title: string;
  // In-app path WITHOUT the /r basePath (next/link prepends it).
  href: string;
  summary?: string;
};

// "Related guides" block for the bottom of a post/page. Server component.
export function RelatedGuides({
  heading,
  items,
}: {
  heading: string;
  items: RelatedGuide[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="surface-card space-y-4">
      <h2 className="text-xl font-semibold">{heading}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block h-full rounded-2xl border border-border/60 bg-card p-4 transition hover:border-brand-primary/60"
            >
              <span className="font-semibold text-foreground">
                {item.title}
              </span>
              {item.summary ? (
                <span className="mt-1 block text-sm text-muted-foreground line-clamp-2">
                  {item.summary}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
