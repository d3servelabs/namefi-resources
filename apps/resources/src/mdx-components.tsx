import type { MDXComponents } from 'mdx/types';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@namefi-astra/ui/lib/cn';
import { ContentImage } from '@/components/content-image';
import { GlossaryHoverLink } from '@/components/glossary-hover-link';
import { i18n, type Locale } from '@/i18n-config';
import { getGlossaryDescriptionMap } from '@/lib/glossary-descriptions';
import { parseGlossaryHref } from '@/lib/glossary-href';

// Resolve the one-line description for a glossary href at render time (server).
// getGlossaryDescriptionMap is React-cached, so repeated lookups in one render
// are cheap. Returns null when the href isn't a known glossary link.
function glossaryHrefInfo(href: string): { description?: string } | null {
  const parsed = parseGlossaryHref(href);
  if (!parsed) return null;
  if (!i18n.locales.includes(parsed.locale as Locale)) return null;
  const description = getGlossaryDescriptionMap(parsed.locale as Locale)[
    parsed.slug
  ];
  return { description };
}

const Wrapper = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto w-full max-w-4xl px-6 py-16 md:px-8 md:py-20 lg:max-w-6xl">
    <article className="prose prose-invert prose-lg md:prose-xl prose-headings:font-semibold prose-headings:tracking-tight prose-strong:text-foreground prose-em:text-foreground prose-a:font-semibold prose-a:no-underline prose-hr:border-border/60 prose-table:border-border/60 prose-table:text-foreground prose-img:rounded-3xl prose-pre:rounded-2xl prose-pre:border prose-pre:border-border/60 prose-pre:text-sm prose-code:text-foreground/90">
      {children}
    </article>
  </div>
);

// Hosts where we trust the destination enough to send a Referer header.
// External links to any host NOT in this list get rel="noreferrer" so we
// don't leak our visitors' browsing context to competitors or third
// parties. `noopener` stays on every external link for tab-hijack safety.
const TRUSTED_REFERRER_HOSTS = [
  // First-party
  'namefi.io',
  'd3serve.xyz',
  // Standards bodies / authoritative references
  'icann.org',
  'iana.org',
  'ietf.org',
  'w3.org',
  'wikipedia.org',
  'github.com',
  'developer.mozilla.org',
];

const isTrustedReferrerHost = (href: string): boolean => {
  let host: string;
  try {
    host = new URL(href).hostname.toLowerCase();
  } catch {
    return false;
  }
  return TRUSTED_REFERRER_HOSTS.some(
    (trusted) => host === trusted || host.endsWith(`.${trusted}`),
  );
};

const Anchor = ({
  children,
  className,
  href,
}: AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const derivedClassName = cn(
    'font-semibold text-brand-primary underline decoration-brand-primary/20 underline-offset-4 transition hover:text-brand-secondary hover:decoration-brand-secondary/40',
    className,
  );
  if (href?.startsWith('http')) {
    const rel = isTrustedReferrerHost(href)
      ? 'noopener'
      : 'noopener noreferrer';
    return (
      <a href={href} target="_blank" rel={rel} className={derivedClassName}>
        {children}
      </a>
    );
  }
  if (href) {
    // Only reach for the client hover card when there is actually a definition
    // to show. A glossary link with no description (or any other internal link)
    // stays a plain server-rendered Link, so article pages don't pull the
    // preview-card JS for links that never open a card.
    const description = glossaryHrefInfo(href)?.description;
    if (description) {
      return (
        <GlossaryHoverLink
          href={href}
          description={description}
          className={derivedClassName}
        >
          {children}
        </GlossaryHoverLink>
      );
    }
    return (
      <Link href={href} className={derivedClassName}>
        {children}
      </Link>
    );
  }
  return null;
};

export function useMDXComponents(
  components: MDXComponents = {},
): MDXComponents {
  return {
    a: Anchor,
    img: ContentImage,
    wrapper: Wrapper,
    ...components,
  };
}
