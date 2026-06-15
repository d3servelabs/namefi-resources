import Link from 'next/link';

export type BreadcrumbItem = {
  name: string;
  // In-app path WITHOUT the /r basePath (next/link prepends it). Omit on the
  // current/last item to render it as plain text.
  href?: string;
};

// Visible breadcrumb trail (Resources › TLDs › .io). Mirrors the BreadcrumbList
// JSON-LD so the on-page navigation matches the structured data. Server
// component — no client JS.
export function BreadcrumbNav({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.name} className="flex items-center gap-2">
            {index > 0 && (
              <span aria-hidden="true" className="text-muted-foreground/50">
                ›
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="transition hover:text-foreground"
              >
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
