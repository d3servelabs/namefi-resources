'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { ExternalLink, Loader2, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { Playfair_Display } from 'next/font/google';
import { useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { cn } from '@/lib/cn';
import {
  DEFAULT_MLS_FEED_LIMIT,
  type MlsSaleListing,
  type MlsSalesFeedPage,
} from '@/lib/mls/feed';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
});
const LEADING_AT_SYMBOL = /^@/;
const THREE_DAYS_IN_MS = 72 * 60 * 60 * 1000;
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600'],
});

const SKELETON_KEYS = [
  'mls-skeleton-1',
  'mls-skeleton-2',
  'mls-skeleton-3',
  'mls-skeleton-4',
] as const;

export function MlsFeed() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const {
    data,
    error,
    isError,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<MlsSalesFeedPage, Error>({
    queryKey: ['mls-feed'],
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      fetchMlsSalesFeedPage(typeof pageParam === 'string' ? pageParam : null),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 15_000,
    retry: 1,
  });

  const listings = useMemo(
    () => data?.pages.flatMap((page) => page.rows) ?? [],
    [data?.pages],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          void fetchNextPage();
        }
      },
      { rootMargin: '500px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <main className="mx-auto w-full max-w-[45rem] px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/10 via-background to-cyan-500/10 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Domains For Sale On Twitter
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              void refetch();
            }}
            disabled={isLoading || isRefetching}
          >
            {isRefetching ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Refreshing
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <RefreshCcw className="size-4" />
                Refresh
              </span>
            )}
          </Button>
        </div>
      </section>

      <section className="mt-6 space-y-0">
        {isLoading ? <MlsFeedSkeleton /> : null}

        {isError && listings.length === 0 ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error.message}
          </div>
        ) : null}

        {listings.map((listing) => (
          <MlsFeedCard key={listing.id} listing={listing} />
        ))}

        {isFetchingNextPage ? <MlsFeedSkeleton compact={true} /> : null}

        {hasNextPage ? <div ref={sentinelRef} className="h-8" /> : null}

        {hasNextPage && !isFetchingNextPage ? (
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                void fetchNextPage();
              }}
            >
              Load more
            </Button>
          </div>
        ) : null}

        {!hasNextPage && listings.length > 0 ? (
          <p className="py-6 text-center text-xs tracking-wide text-muted-foreground uppercase">
            End of feed
          </p>
        ) : null}
      </section>
    </main>
  );
}

interface MlsFeedCardProps {
  listing: MlsSaleListing;
}

function MlsFeedCard({ listing }: MlsFeedCardProps) {
  const sellerHandle = normalizeHandle(listing.seller.username);
  const sellerLabel = sellerHandle ?? '@unknown';
  const sellerProfileUrl = getSellerProfileUrl(sellerHandle);
  const domainUrl = getDomainUrl(listing.domain);
  const askingCurrency = normalizeCurrency(listing.askingCurrency);
  const askingPriceLabel = formatAskingPrice(
    listing.askingPrice,
    askingCurrency,
  );
  const postedLabel = formatPostedLabel(listing.postedAt);
  const excerpt = formatExcerpt(listing.messageText);
  const domainParts = splitDomainForDisplay(listing.domain);

  return (
    <Card className="bg-transparent shadow-none !py-0 !ring-0 border-b border-white/10 rounded-none">
      <CardContent className="px-5 py-6 sm:px-6 sm:py-7">
        <div className="flex items-center gap-2 text-xs text-white/35 sm:text-sm">
          {sellerProfileUrl ? (
            <Link
              href={sellerProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate font-semibold text-white/50 transition-colors hover:text-white/70 hover:underline"
            >
              {sellerLabel}
            </Link>
          ) : (
            <p className="truncate font-semibold text-white/50">
              {sellerLabel}
            </p>
          )}
          <span aria-hidden={true}>•</span>
          <time className="shrink-0" dateTime={listing.postedAt}>
            {postedLabel}
          </time>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <Link
            href={domainUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex flex-wrap items-baseline gap-1.5 no-underline"
            aria-label={`Open source post for ${listing.domain}`}
          >
            <h2
              className={cn(
                playfairDisplay.className,
                'text-4xl leading-none text-white sm:text-[2.9rem]',
              )}
            >
              {domainParts.label}
            </h2>
            {domainParts.tld ? (
              <span className="font-sans text-[1.6rem] leading-none font-medium text-white/35 sm:text-[1.95rem]">
                .{domainParts.tld}
              </span>
            ) : null}
          </Link>

          {askingPriceLabel ? (
            <p className="shrink-0 text-right text-lg font-semibold text-emerald-400 sm:text-xl">
              {askingPriceLabel}
            </p>
          ) : null}
        </div>

        <div className="mt-6">
          <Link
            href={domainUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 max-w-[46%] items-center gap-2 text-sm text-white/40 transition-colors hover:text-white/60"
            aria-label={`Open source post for ${listing.domain}`}
          >
            <span className="truncate">{excerpt}</span>
            <ExternalLink className="size-3.5 shrink-0" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

interface MlsFeedSkeletonProps {
  compact?: boolean;
}

function MlsFeedSkeleton({ compact = false }: MlsFeedSkeletonProps) {
  const keys = compact ? [SKELETON_KEYS[0], SKELETON_KEYS[1]] : SKELETON_KEYS;

  return (
    <div className="space-y-0">
      {keys.map((key) => (
        <Card
          key={key}
          className="bg-transparent shadow-none !py-0 !ring-0 border-b border-white/10 rounded-none"
        >
          <CardContent className="px-5 py-6 sm:px-6 sm:py-7">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-1.5 w-1.5 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>

            <div className="mt-4 flex items-end justify-between gap-4">
              <div className="min-w-0 flex items-end gap-1.5">
                <Skeleton className="h-11 w-52 sm:w-64" />
                <Skeleton className="h-8 w-14 sm:w-16" />
              </div>
              <Skeleton className="h-7 w-[4.5rem]" />
            </div>

            <div className="mt-6">
              <div className="inline-flex min-w-0 max-w-[46%] items-center gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="size-3.5 shrink-0" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function fetchMlsSalesFeedPage(
  cursor: string | null,
): Promise<MlsSalesFeedPage> {
  const params = new URLSearchParams({
    limit: String(DEFAULT_MLS_FEED_LIMIT),
  });
  if (cursor) {
    params.set('cursor', cursor);
  }

  const response = await fetch(`/api/mls/feed?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorMessage = 'Failed to load MLS feed.';
    try {
      const errorPayload = (await response.json()) as { error?: string };
      if (errorPayload.error) {
        errorMessage = errorPayload.error;
      }
    } catch {
      // keep default fallback message
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as MlsSalesFeedPage;
}

function normalizeHandle(handle: string | null) {
  if (!handle) {
    return null;
  }

  const normalized = handle.trim();
  if (normalized.length === 0) {
    return null;
  }

  return normalized.startsWith('@') ? normalized : `@${normalized}`;
}

function getSellerProfileUrl(handle: string | null) {
  if (!handle) {
    return null;
  }

  const normalized = handle.replace(LEADING_AT_SYMBOL, '');
  if (normalized.length === 0) {
    return null;
  }

  return `https://x.com/${normalized}`;
}

function getDomainUrl(domain: string) {
  const normalized = domain.trim();
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  return `https://${normalized}`;
}

function normalizeCurrency(value: string | null) {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) {
    return 'USD';
  }
  return normalized;
}

function formatAskingPrice(
  price: string | null,
  currency: string,
): string | null {
  const normalizedPrice = price?.trim();
  if (!normalizedPrice) {
    return null;
  }

  const numericPrice = Number(
    normalizedPrice.replaceAll(',', '').replace('$', ''),
  );
  if (!Number.isFinite(numericPrice)) {
    return normalizedPrice;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: Number.isInteger(numericPrice) ? 0 : 2,
    minimumFractionDigits: Number.isInteger(numericPrice) ? 0 : 2,
  }).format(numericPrice);
}

function splitDomainForDisplay(domain: string) {
  const normalizedDomain = domain.trim();
  const splitIndex = normalizedDomain.indexOf('.');

  if (splitIndex <= 0 || splitIndex === normalizedDomain.length - 1) {
    return { label: normalizedDomain, tld: null };
  }

  return {
    label: normalizedDomain.slice(0, splitIndex),
    tld: normalizedDomain.slice(splitIndex + 1),
  };
}

function formatPostedLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown';
  }

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  if (diffMs < 0) {
    return dateFormatter.format(parsed);
  }

  if (diffMs < 60 * 1000) {
    return 'just now';
  }

  if (diffMs <= THREE_DAYS_IN_MS) {
    return formatDistanceToNowStrict(parsed, {
      addSuffix: true,
      roundingMethod: 'floor',
    });
  }

  return dateFormatter.format(parsed);
}

function formatExcerpt(value: string | null) {
  const normalized = value?.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'No excerpt available';
  }
  return normalized;
}
