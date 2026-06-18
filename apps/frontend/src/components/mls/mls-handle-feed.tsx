'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { type RefObject, useEffect, useMemo, useRef } from 'react';
import { MlsSaleCard } from '@/components/mls/mls-sale-card';
import { MlsSellerTierBadge } from '@/components/mls/mls-seller-tier-badge';
import {
  getMlsSellerTier,
  type MlsSellerTier,
} from '@namefi-astra/common/mls-seller-tiers';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import {
  DEFAULT_MLS_FEED_LIMIT,
  type MlsSaleListing,
  type MlsSalesByHandlePage,
} from '@/lib/mls/feed';
import {
  getMlsFeedSourceLabel,
  normalizeMlsFeedSource,
  normalizeMlsHandle,
  normalizeMlsHandleSlug,
} from '@/lib/mls/handles';
import { useTRPCClient } from '@/lib/trpc';

const SKELETON_KEYS = [
  'mls-handle-skeleton-1',
  'mls-handle-skeleton-2',
  'mls-handle-skeleton-3',
  'mls-handle-skeleton-4',
] as const;

interface MlsHandleFeedProps {
  source: string;
  username: string;
}

export function MlsHandleFeed({ source, username }: MlsHandleFeedProps) {
  const t = useTranslations('feed');
  const trpcClient = useTRPCClient();
  const normalizedSource = normalizeMlsFeedSource(source);
  const normalizedHandleSlug = normalizeMlsHandleSlug(username);
  const hasValidHandle = Boolean(normalizedSource && normalizedHandleSlug);
  const fallbackHandle = normalizedHandleSlug
    ? `@${normalizedHandleSlug}`
    : t('handle.fallbackSeller');
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
  } = useInfiniteQuery<MlsSalesByHandlePage, Error>({
    queryKey: ['mls-feed-handle', normalizedSource, normalizedHandleSlug],
    enabled: hasValidHandle,
    initialPageParam: null,
    queryFn: ({ pageParam }) => {
      if (!normalizedSource || !normalizedHandleSlug) {
        throw new Error('Invalid feed user path.');
      }

      return trpcClient.mls.getHandleListings.query({
        source: normalizedSource,
        handle: normalizedHandleSlug,
        limit: DEFAULT_MLS_FEED_LIMIT,
        cursor: typeof pageParam === 'string' ? pageParam : null,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 15_000,
    retry: 1,
  });

  const listings = useMemo(
    () => data?.pages.flatMap((page) => page.rows) ?? [],
    [data?.pages],
  );
  const firstPage = data?.pages[0];
  const sellerHandle = normalizeMlsHandle(
    firstPage?.seller.username ?? firstPage?.handle ?? fallbackHandle,
  );
  const sellerLabel = sellerHandle ?? fallbackHandle;
  const sourceLabel =
    firstPage?.source.label ?? getMlsFeedSourceLabel(normalizedSource);
  const totalDomains = firstPage?.totalDomains ?? 0;
  const namefiDomainsCount = firstPage?.seller.namefiDomainsCount ?? 0;
  const tierDomainCount = firstPage?.seller.tierDomainCount ?? totalDomains;
  const sellerTier = hasValidHandle ? getMlsSellerTier(tierDomainCount) : null;

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
      <MlsHandleHeader
        sellerLabel={sellerLabel}
        sourceLabel={sourceLabel}
        sellerTier={sellerTier}
        subtitle={getSellerSubtitle(t, {
          hasValidHandle,
          totalDomains,
          namefiDomainsCount,
        })}
        hasValidHandle={hasValidHandle}
        isLoading={isLoading}
        isRefetching={isRefetching}
        onRefresh={() => {
          void refetch();
        }}
      />

      <MlsHandleListingsSection
        hasValidHandle={hasValidHandle}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message ?? t('handle.loadErrorFallback')}
        listings={listings}
        hasNextPage={Boolean(hasNextPage)}
        isFetchingNextPage={isFetchingNextPage}
        sentinelRef={sentinelRef}
        onLoadMore={() => {
          void fetchNextPage();
        }}
      />
    </main>
  );
}

interface MlsHandleHeaderProps {
  sellerLabel: string;
  sourceLabel: string | null;
  sellerTier: MlsSellerTier | null;
  subtitle: string;
  hasValidHandle: boolean;
  isLoading: boolean;
  isRefetching: boolean;
  onRefresh: () => void;
}

function MlsHandleHeader({
  sellerLabel,
  sourceLabel,
  sellerTier,
  subtitle,
  hasValidHandle,
  isLoading,
  isRefetching,
  onRefresh,
}: MlsHandleHeaderProps) {
  const t = useTranslations('feed');

  return (
    <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/10 via-background to-cyan-500/10 p-6 shadow-sm">
      <div className="space-y-3">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t('handle.backToFeed')}
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {sellerLabel}
              </h1>
              {sourceLabel ? (
                <span className="rounded-sm bg-background/80 px-2 py-1 text-xs font-medium text-muted-foreground">
                  {sourceLabel}
                </span>
              ) : null}
              {sellerTier ? <MlsSellerTierBadge tier={sellerTier} /> : null}
            </div>
            <p
              className={
                hasValidHandle
                  ? 'text-sm text-muted-foreground'
                  : 'text-sm text-destructive'
              }
            >
              {subtitle}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={!hasValidHandle || isLoading || isRefetching}
          >
            {isRefetching ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {t('handle.refreshing')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <RefreshCcw className="size-4" />
                {t('handle.refresh')}
              </span>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

interface MlsHandleListingsSectionProps {
  hasValidHandle: boolean;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  listings: MlsSaleListing[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  onLoadMore: () => void;
}

function MlsHandleListingsSection({
  hasValidHandle,
  isLoading,
  isError,
  errorMessage,
  listings,
  hasNextPage,
  isFetchingNextPage,
  sentinelRef,
  onLoadMore,
}: MlsHandleListingsSectionProps) {
  if (!hasValidHandle) {
    return (
      <section className="mt-6 space-y-0">
        <MlsHandleInvalidHandleBanner />
      </section>
    );
  }

  const showEmptyState = !isLoading && !isError && listings.length === 0;
  const showErrorState = isError && listings.length === 0;
  const showEndOfFeed = !hasNextPage && listings.length > 0;

  return (
    <section className="mt-6 space-y-0">
      <MlsHandleInitialState
        isLoading={isLoading}
        showErrorState={showErrorState}
        errorMessage={errorMessage}
      />

      {listings.map((listing) => (
        <MlsSaleCard
          key={listing.id}
          listing={listing}
          showOtherDomainsCount={false}
          showSellerTierBadge={false}
        />
      ))}

      <MlsHandlePagination
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        sentinelRef={sentinelRef}
        onLoadMore={onLoadMore}
      />

      <MlsHandleCompletionState
        showEmptyState={showEmptyState}
        showEndOfFeed={showEndOfFeed}
      />
    </section>
  );
}

function MlsHandleInvalidHandleBanner() {
  const t = useTranslations('feed');

  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
      {t('handle.invalidPath')}
    </div>
  );
}

interface MlsHandleInitialStateProps {
  isLoading: boolean;
  showErrorState: boolean;
  errorMessage: string;
}

function MlsHandleInitialState({
  isLoading,
  showErrorState,
  errorMessage,
}: MlsHandleInitialStateProps) {
  if (isLoading) {
    return <MlsHandleFeedSkeleton />;
  }

  if (showErrorState) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {errorMessage}
      </div>
    );
  }

  return null;
}

interface MlsHandlePaginationProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  onLoadMore: () => void;
}

function MlsHandlePagination({
  hasNextPage,
  isFetchingNextPage,
  sentinelRef,
  onLoadMore,
}: MlsHandlePaginationProps) {
  const t = useTranslations('feed');

  return (
    <>
      {isFetchingNextPage ? <MlsHandleFeedSkeleton compact={true} /> : null}

      {hasNextPage ? <div ref={sentinelRef} className="h-8" /> : null}

      {hasNextPage && !isFetchingNextPage ? (
        <div className="flex justify-center pt-2">
          <Button variant="ghost" onClick={onLoadMore}>
            {t('handle.loadMore')}
          </Button>
        </div>
      ) : null}
    </>
  );
}

interface MlsHandleCompletionStateProps {
  showEmptyState: boolean;
  showEndOfFeed: boolean;
}

function MlsHandleCompletionState({
  showEmptyState,
  showEndOfFeed,
}: MlsHandleCompletionStateProps) {
  const t = useTranslations('feed');

  if (showEmptyState) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t('handle.emptyListings')}
      </p>
    );
  }

  if (showEndOfFeed) {
    return (
      <p className="py-6 text-center text-xs tracking-wide text-muted-foreground uppercase">
        {t('handle.endOfListings')}
      </p>
    );
  }

  return null;
}

function getSellerSubtitle(
  t: ReturnType<typeof useTranslations<'feed'>>,
  {
    hasValidHandle,
    totalDomains,
    namefiDomainsCount,
  }: {
    hasValidHandle: boolean;
    totalDomains: number;
    namefiDomainsCount: number;
  },
) {
  if (!hasValidHandle) {
    return t('handle.subtitle.invalidPath');
  }

  if (totalDomains === 0 && namefiDomainsCount === 0) {
    return t('handle.subtitle.noDomains');
  }

  if (namefiDomainsCount > 0) {
    return t('handle.subtitle.feedAndNamefi', {
      feedCount: totalDomains,
      namefiCount: namefiDomainsCount,
    });
  }

  return t('handle.subtitle.feedOnly', { feedCount: totalDomains });
}

interface MlsHandleFeedSkeletonProps {
  compact?: boolean;
}

function MlsHandleFeedSkeleton({
  compact = false,
}: MlsHandleFeedSkeletonProps) {
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
