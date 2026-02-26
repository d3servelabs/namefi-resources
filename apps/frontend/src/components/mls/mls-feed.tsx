'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import {
  CalendarClock,
  ExternalLink,
  Loader2,
  RefreshCcw,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button, buttonVariants } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { cn } from '@/lib/cn';
import {
  DEFAULT_MLS_FEED_LIMIT,
  type MlsSaleListing,
  type MlsSalesFeedPage,
} from '@/lib/mls/feed';

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const LEADING_AT_SYMBOL = /^@/;

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
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/10 via-background to-cyan-500/10 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit">
              MLS Feed
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Domains For Sale On Twitter
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Fresh listings with seller profiles, pricing, and direct links.
            </p>
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

      <section className="mt-6 space-y-4">
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
  const sellerProfileUrl = getSellerProfileUrl(sellerHandle);
  const sellerLabel = sellerHandle ?? listing.seller.displayName ?? 'Unknown';
  const askingPriceLabel = listing.askingPrice
    ? [listing.askingPrice, listing.askingCurrency].filter(Boolean).join(' ')
    : null;

  return (
    <Card className="border-border/70 bg-gradient-to-br from-card via-card to-primary/5 shadow-md shadow-primary/5">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary"
            >
              Twitter Listing
            </Badge>
            <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {listing.domain}
            </CardTitle>
          </div>

          <Badge
            variant={askingPriceLabel ? 'secondary' : 'outline'}
            className={cn(
              'text-sm',
              askingPriceLabel
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                : '',
            )}
          >
            {askingPriceLabel ?? 'Price unavailable'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-2.5 py-1">
            <CalendarClock className="size-3.5" />
            Posted {formatDateTime(listing.postedAt)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-2.5 py-1">
            <CalendarClock className="size-3.5" />
            Listed {formatDateTime(listing.listedAt)}
          </span>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/60 p-4">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            Seller
          </p>

          {sellerProfileUrl ? (
            <Link
              href={sellerProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <UserRound className="size-4" />
              {sellerLabel}
              <ExternalLink className="size-3.5" />
            </Link>
          ) : (
            <p className="mt-1 text-sm font-medium">{sellerLabel}</p>
          )}
        </div>

        {listing.messageText ? (
          <p className="rounded-xl border border-border/60 bg-background/50 p-4 text-sm leading-relaxed text-foreground/85">
            {listing.messageText}
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="border-t border-border/60 pt-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href={listing.sourceTweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            View Tweet
            <ExternalLink className="size-3.5" />
          </Link>

          {sellerProfileUrl ? (
            <Link
              href={sellerProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            >
              Seller Profile
              <ExternalLink className="size-3.5" />
            </Link>
          ) : null}

          {listing.purchaseUrl ? (
            <Link
              href={listing.purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
            >
              Purchase Link
              <ExternalLink className="size-3.5" />
            </Link>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}

interface MlsFeedSkeletonProps {
  compact?: boolean;
}

function MlsFeedSkeleton({ compact = false }: MlsFeedSkeletonProps) {
  const keys = compact ? [SKELETON_KEYS[0], SKELETON_KEYS[1]] : SKELETON_KEYS;

  return (
    <div className="space-y-4">
      {keys.map((key) => (
        <Card key={key} className="border-border/60">
          <CardHeader className="space-y-3">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-9 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
          <CardFooter className="gap-2 border-t border-border/50 pt-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-28" />
          </CardFooter>
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

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown';
  }
  return dateTimeFormatter.format(parsed);
}
