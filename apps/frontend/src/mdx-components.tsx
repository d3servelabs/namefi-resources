import type { MDXComponents } from 'mdx/types';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '@namefi-astra/ui/lib/cn';
import { getExternalLinkRel } from '@/lib/external-link';

const Wrapper = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto w-full max-w-3xl px-6 py-20 sm:py-24">
    <article
      className={cn(
        'prose prose-invert',
        'prose-headings:font-semibold prose-headings:text-white',
        'prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg',
        'prose-p:text-white/80 prose-li:text-white/75 prose-strong:text-white',
        'prose-a:text-brand-primary prose-a:no-underline hover:prose-a:underline',
        'prose-code:rounded-md prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5',
        'prose-hr:border-white/10',
      )}
    >
      {children}
    </article>
  </div>
);

const Anchor = ({
  children,
  className,
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) => {
  // External links open in a new tab and carry rel="...nofollow" so we don't
  // pass SEO link equity to third parties; the Referer header still flows.
  const isExternal = href?.startsWith('http');
  return (
    <a
      {...props}
      href={href}
      className={cn(
        'font-medium text-brand-primary underline decoration-transparent underline-offset-4 transition hover:decoration-current',
        className,
      )}
      {...(isExternal
        ? { target: '_blank', rel: getExternalLinkRel(href) }
        : {})}
    >
      {children}
    </a>
  );
};

export function useMDXComponents(
  components: MDXComponents = {},
): MDXComponents {
  return {
    a: Anchor,
    wrapper: Wrapper,
    ...components,
  };
}
