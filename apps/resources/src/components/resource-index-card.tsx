import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Grid2X2, Rows3 } from 'lucide-react';
import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { ResourceMetaItem } from '@/lib/resource-meta-items';

export type ResourceIndexViewMode = 'grid' | 'list';

export type ResourceIndexViewLabels = {
  label: string;
  grid: string;
  list: string;
};

export const RESOURCE_INDEX_GRID_CLASS =
  'grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6';
export const RESOURCE_INDEX_LIST_CLASS = 'grid gap-3';

const RESOURCE_INDEX_IMAGE_SIZES =
  '(min-width: 1536px) 12.5rem, (min-width: 1280px) calc((80rem - 3rem) / 4), (min-width: 768px) calc((100vw - 7rem) / 3), calc((100vw - 4rem) / 2)';
const RESOURCE_INDEX_ROW_IMAGE_SIZES = '(min-width: 640px) 10rem, 7rem';

export function resolveResourceIndexViewMode(
  value: string | string[] | undefined,
): ResourceIndexViewMode {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue === 'list' ? 'list' : 'grid';
}

export function getResourceIndexGridClass(view: ResourceIndexViewMode): string {
  return view === 'list'
    ? RESOURCE_INDEX_LIST_CLASS
    : RESOURCE_INDEX_GRID_CLASS;
}

export type ResourceIndexCardProps = {
  title: string;
  href: string;
  metaItems: ResourceMetaItem[];
  summary?: string | null;
  tags?: string[];
  imageSrc?: string | null;
  imageAlt?: string;
  view?: ResourceIndexViewMode;
  className?: string;
};

export function ResourceIndexCard({
  title,
  href,
  metaItems,
  summary,
  tags = [],
  imageSrc,
  imageAlt,
  view = 'grid',
  className,
}: ResourceIndexCardProps) {
  if (view === 'list') {
    return (
      <Link
        href={href}
        className={cn(
          'group block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70 focus-visible:ring-offset-0',
          className,
        )}
      >
        <Card className="grid min-h-24 grid-cols-[7rem_minmax(0,1fr)] items-center overflow-hidden rounded-xl border border-white/8 bg-card/70 py-0 transition-all duration-200 hover:border-brand-primary/45 hover:bg-card sm:grid-cols-[10rem_minmax(0,1fr)]">
          <ResourceIndexPreviewImage
            imageSrc={imageSrc}
            imageAlt={imageAlt ?? title}
            title={title}
            className="self-center rounded-md border border-white/5"
            sizes={RESOURCE_INDEX_ROW_IMAGE_SIZES}
          />
          <CardContent className="flex min-w-0 flex-col justify-center gap-2 p-3 sm:p-4">
            <CardTitle className="line-clamp-1 text-sm font-semibold tracking-tight text-white transition-colors duration-200 group-hover:text-brand-primary sm:text-base">
              {title}
            </CardTitle>
            {metaItems.length > 0 ? (
              <ResourceMetaList
                metaItems={metaItems}
                className="line-clamp-1 gap-2 text-[0.62rem]"
              />
            ) : null}
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'group block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70 focus-visible:ring-offset-0',
        className,
      )}
    >
      <Card className="relative h-full overflow-hidden rounded-xl border border-white/7 bg-gradient-to-br from-background/95 via-background/85 to-background/60 py-0 shadow-[0_18px_50px_rgba(12,12,12,0.32)] transition-all duration-300 group-hover:border-brand-primary/45 group-hover:shadow-[0_28px_70px_rgba(16,255,191,0.16)]">
        <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/10 via-transparent to-transparent" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-primary/10 via-transparent to-transparent" />
        </div>
        <ResourceIndexPreviewImage
          imageSrc={imageSrc}
          imageAlt={imageAlt ?? title}
          title={title}
          sizes={RESOURCE_INDEX_IMAGE_SIZES}
        />
        <CardHeader className="relative space-y-3 px-4 pb-0 pt-4 text-left">
          {metaItems.length > 0 && <ResourceMetaList metaItems={metaItems} />}
          <div className="space-y-2">
            <CardTitle className="line-clamp-3 text-base font-semibold leading-snug tracking-tight text-white transition-colors duration-300 group-hover:text-brand-primary">
              {title}
            </CardTitle>
            {summary ? (
              <CardDescription className="line-clamp-2 text-xs leading-5 text-white/70">
                {summary}
              </CardDescription>
            ) : null}
          </div>
        </CardHeader>
        {tags.length > 0 && (
          <div className="relative px-4 pb-4 pt-0">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[0.68rem] font-medium text-white/70 backdrop-blur transition group-hover:border-brand-primary/40 group-hover:text-brand-primary"
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

function ResourceMetaList({
  metaItems,
  className,
}: {
  metaItems: ResourceMetaItem[];
  className?: string;
}) {
  return (
    <ul
      className={cn(
        'flex flex-wrap items-center gap-2 text-[0.62rem] font-semibold uppercase text-white/70',
        className,
      )}
    >
      {metaItems.map((item) => (
        <li key={item.key} className="flex min-w-0 items-center gap-1.5">
          <item.icon
            className="h-3 w-3 flex-shrink-0 text-white/60"
            aria-hidden="true"
          />
          <span className="truncate text-white/70">{item.content}</span>
        </li>
      ))}
    </ul>
  );
}

function ResourceIndexPreviewImage({
  imageSrc,
  imageAlt,
  title,
  className,
  sizes,
}: {
  imageSrc?: string | null;
  imageAlt: string;
  title: string;
  className?: string;
  sizes: string;
}) {
  return (
    <div
      className={cn(
        'relative aspect-[1200/630] w-full overflow-hidden rounded-t-xl border-white/5 border-b bg-white/[0.04]',
        className,
      )}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          loading="lazy"
          sizes={sizes}
          className="object-contain transition duration-300 group-hover:scale-[1.025]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(16,255,191,0.14),rgba(255,255,255,0.04))] px-3 text-center">
          <span className="line-clamp-3 text-sm font-semibold leading-snug text-white/80">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}

function resourceIndexViewHref(path: string, view: ResourceIndexViewMode) {
  return view === 'grid' ? path : `${path}?view=${view}`;
}

export function ResourceIndexViewSwitcher({
  view,
  href,
  labels,
  className,
}: {
  view: ResourceIndexViewMode;
  href: string;
  labels: ResourceIndexViewLabels;
  className?: string;
}) {
  const options = [
    { value: 'grid' as const, label: labels.grid, icon: Grid2X2 },
    { value: 'list' as const, label: labels.list, icon: Rows3 },
  ];

  return (
    <fieldset
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-1',
        className,
      )}
    >
      <legend className="sr-only">{labels.label}</legend>
      {options.map((option) => {
        const Icon = option.icon;
        const active = view === option.value;
        return (
          <Tooltip key={option.value}>
            <TooltipTrigger
              render={
                <Link
                  href={resourceIndexViewHref(href, option.value)}
                  aria-label={option.label}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex size-9 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70',
                    active &&
                      'bg-brand-primary text-background hover:text-background',
                  )}
                />
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="sr-only">{option.label}</span>
            </TooltipTrigger>
            <TooltipContent>{option.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </fieldset>
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
