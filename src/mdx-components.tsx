import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

const Wrapper = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto w-full max-w-4xl px-6 py-16 md:px-8 md:py-20 lg:max-w-6xl">
    <article className="prose prose-invert prose-lg md:prose-xl prose-headings:font-semibold prose-headings:tracking-tight prose-strong:text-foreground prose-em:text-foreground prose-a:font-semibold prose-a:no-underline prose-hr:border-border/60 prose-table:border-border/60 prose-table:text-foreground prose-img:rounded-3xl prose-pre:rounded-2xl prose-pre:border prose-pre:border-border/60 prose-pre:text-sm prose-code:text-foreground/90">
      {children}
    </article>
  </div>
);

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
    return (
      <a href={href} target="_blank" className={derivedClassName}>
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
    wrapper: Wrapper,
    ...components,
  };
}
