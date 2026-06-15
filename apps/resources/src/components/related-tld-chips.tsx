import Link from 'next/link';

export type TldChip = {
  label: string;
  // In-app path WITHOUT the /r basePath (next/link prepends it).
  href: string;
};

// Cross-link chips to other TLD extension pages. Server component.
export function RelatedTldChips({
  heading,
  items,
}: {
  heading: string;
  items: TldChip[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="surface-card space-y-4">
      <h2 className="text-xl font-semibold">{heading}</h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex rounded-full border border-border/60 px-4 py-1.5 text-sm font-semibold text-muted-foreground transition hover:border-brand-primary/60 hover:text-foreground"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
