import type { MDXComponents } from 'mdx/types';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@namefi-astra/ui/lib/cn';
import { ContentImage } from '@/components/content-image';

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
      <a
        href={href}
        target="_blank"
        rel={rel}
        className={derivedClassName}
      >
        {children}
      </a>
    );
  }
  if (href) {
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
