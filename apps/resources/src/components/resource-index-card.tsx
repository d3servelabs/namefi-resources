import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { cn } from '@/lib/cn';

export type ResourceIndexCardProps = {
  title: string;
  href: string;
  metaItems: ReactNode[];
  summary?: string | null;
  tags?: string[];
  className?: string;
};

export function ResourceIndexCard({
  title,
  href,
  metaItems,
  summary,
  tags = [],
  className,
}: ResourceIndexCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70 focus-visible:ring-offset-0',
        className,
      )}
    >
      <Card className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-background/95 via-background/85 to-background/60 shadow-[0_30px_80px_rgba(12,12,12,0.45)] transition-all duration-300 group-hover:border-brand-primary/50 group-hover:shadow-[0_40px_100px_rgba(16,255,191,0.24)] py-0">
        <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/10 via-transparent to-transparent" />
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-brand-primary/10 via-transparent to-transparent" />
        </div>
        <CardHeader className="relative space-y-5 px-8 pb-0 pt-8 text-left md:px-10 md:pt-10">
          {metaItems.length > 0 && (
            <ul className="flex flex-wrap items-center gap-4 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/70">
              {metaItems.map((item, index) => (
                <li key={index} className="whitespace-nowrap">
                  {item}
                </li>
              ))}
            </ul>
          )}
          <div className="space-y-3">
            <CardTitle className="text-3xl font-semibold tracking-tight text-white transition-colors duration-300 md:text-[2.5rem] md:leading-[1.15]">
              {title}
            </CardTitle>
            {summary ? (
              <CardDescription className="text-base text-white/75 md:text-lg">
                {summary}
              </CardDescription>
            ) : null}
          </div>
        </CardHeader>
        {tags.length > 0 && (
          <div className="relative px-8 pb-8 pt-0 md:px-10">
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur transition group-hover:border-brand-primary/40 group-hover:text-brand-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}

export function ResourceIndexEmptyState({ children }: { children: ReactNode }) {
  return (
    <Card className="border-dashed border-border/60 bg-card/70">
      <CardContent className="p-10 text-center text-sm text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}
