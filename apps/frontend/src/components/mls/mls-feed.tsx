'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, RefreshCcw, Rss } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { MlsSaleCard } from '@/components/mls/mls-sale-card';
import { Button, buttonVariants } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import {
  DEFAULT_MLS_FEED_LIMIT,
  MLS_FEED_RSS_PATH,
  type MlsSalesFeedPage,
} from '@/lib/mls/feed';
import { useTRPCClient } from '@/lib/trpc';

const SKELETON_KEYS = [
  'mls-skeleton-1',
  'mls-skeleton-2',
  'mls-skeleton-3',
  'mls-skeleton-4',
] as const;

export function MlsFeed() {
  const trpcClient = useTRPCClient();
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
      trpcClient.mls.getFeed.query({
        limit: DEFAULT_MLS_FEED_LIMIT,
        cursor: typeof pageParam === 'string' ? pageParam : null,
      }),
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
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={MLS_FEED_RSS_PATH}
              target="_blank"
              rel="noreferrer noopener"
              className={buttonVariants({ variant: 'secondary' })}
            >
              <Rss className="size-4" />
              Subscribe via RSS
            </a>

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
          <MlsSaleCard key={listing.id} listing={listing} />
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
          className="rounded-none border-b border-white/10 bg-transparent shadow-none !py-0 !ring-0"
        >
          <CardContent className="px-5 py-6 sm:px-6 sm:py-7">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-1.5 w-1.5 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <Skeleton className="size-14 rounded-[18px] sm:size-16" />
                <div className="min-w-0 flex items-end gap-1.5">
                  <Skeleton className="h-11 w-52 sm:w-64" />
                  <Skeleton className="h-8 w-14 sm:w-16" />
                </div>
              </div>

              <Skeleton className="h-7 w-28" />
            </div>

            <div className="mt-6 flex items-center gap-2 border-t border-white/6 pt-4">
              <Skeleton className="h-4 w-full max-w-[20rem]" />
              <Skeleton className="size-3.5 shrink-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
