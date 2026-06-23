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
  const displayedDomainCount = firstPage?.totalDomains ?? listings.length;
  const subtitle = getSellerSubtitle(t, {
    hasValidHandle,
    totalDomains,
    namefiDomainsCount,
  });
  const refreshListings = () => {
    void refetch();
  };

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
    <main className="mx-auto w-full max-w-[74rem] px-3 pt-4 pb-10 sm:px-5 sm:pt-6 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <MlsHandleControlRail
          sellerLabel={sellerLabel}
          sourceLabel={sourceLabel}
          sellerTier={sellerTier}
          domainCount={displayedDomainCount}
          subtitle={subtitle}
          hasValidHandle={hasValidHandle}
          isLoading={isLoading}
          isRefetching={isRefetching}
          onRefresh={refreshListings}
        />

        <div className="min-w-0">
          <MlsHandleMobileHeader
            sellerLabel={sellerLabel}
            sourceLabel={sourceLabel}
            sellerTier={sellerTier}
            domainCount={displayedDomainCount}
            subtitle={subtitle}
            hasValidHandle={hasValidHandle}
            isLoading={isLoading}
            isRefetching={isRefetching}
            onRefresh={refreshListings}
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
        </div>
      </div>
    </main>
  );
}

interface MlsHandleHeaderProps {
  sellerLabel: string;
  sourceLabel: string | null;
  sellerTier: MlsSellerTier | null;
  domainCount: number;
  subtitle: string;
  hasValidHandle: boolean;
  isLoading: boolean;
  isRefetching: boolean;
  onRefresh: () => void;
}

function MlsHandleControlRail({
  sellerLabel,
  sourceLabel,
  sellerTier,
  domainCount,
  subtitle,
  hasValidHandle,
  isLoading,
  isRefetching,
  onRefresh,
}: MlsHandleHeaderProps) {
  const t = useTranslations('feed');

  return (
    <aside className="hidden lg:sticky lg:top-5 lg:block lg:max-h-[calc(100svh-2.5rem)] lg:self-start">
      <section
        className="flex max-h-[calc(100svh-2.5rem)] flex-col gap-4 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#111214] p-4 shadow-[0_1px_0_rgba(255,255,255,0.03)]"
        data-testid="feed.handle.rail"
      >
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          data-testid="feed.handle.rail.back-link"
        >
          <ArrowLeft className="size-4 rtl:-scale-x-100" />
          {t('handle.backToFeed')}
        </Link>

        <div className="grid min-w-0 gap-2">
          <h1
            className="min-w-0 break-words text-3xl leading-tight font-semibold tracking-tight"
            data-testid="feed.handle.seller-label"
          >
            {sellerLabel}
          </h1>

          <MlsHandleHeaderBadges
            sourceLabel={sourceLabel}
            sellerTier={sellerTier}
            domainCount={domainCount}
            isLoading={isLoading}
            countTestId="feed.handle.rail.domain-count"
          />
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

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start border-white/10 bg-background/80"
          onClick={onRefresh}
          disabled={!hasValidHandle || isLoading || isRefetching}
          data-testid="feed.handle.rail.refresh-button"
        >
          <MlsHandleRefreshButtonContent isRefetching={isRefetching} />
        </Button>
      </section>
    </aside>
  );
}

function MlsHandleMobileHeader({
  sellerLabel,
  sourceLabel,
  sellerTier,
  domainCount,
  subtitle,
  hasValidHandle,
  isLoading,
  isRefetching,
  onRefresh,
}: MlsHandleHeaderProps) {
  const t = useTranslations('feed');
  const tCommon = useTranslations('common');

  return (
    <section className="mb-4 grid min-w-0 gap-3 border-white/[0.08] border-b pb-4 lg:hidden">
      <Link
        href="/feed"
        className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        data-testid="feed.handle.mobile.back-link"
      >
        <ArrowLeft className="size-4 rtl:-scale-x-100" />
        {t('handle.backToFeed')}
      </Link>

      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="grid min-w-0 gap-2">
          <h1
            className="min-w-0 break-words text-2xl leading-tight font-semibold tracking-tight"
            data-testid="feed.handle.mobile.seller-label"
          >
            {sellerLabel}
          </h1>

          <MlsHandleHeaderBadges
            sourceLabel={sourceLabel}
            sellerTier={sellerTier}
            domainCount={domainCount}
            isLoading={isLoading}
            countTestId="feed.handle.mobile.domain-count"
          />

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
          size="icon-sm"
          className="mt-0.5 shrink-0"
          onClick={onRefresh}
          disabled={!hasValidHandle || isLoading || isRefetching}
          aria-label={
            isRefetching ? t('handle.refreshing') : tCommon('actions.refresh')
          }
          data-testid="feed.handle.mobile.refresh-button"
        >
          {isRefetching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCcw className="size-4" />
          )}
        </Button>
      </div>
    </section>
  );
}

interface MlsHandleHeaderBadgesProps {
  sourceLabel: string | null;
  sellerTier: MlsSellerTier | null;
  domainCount: number;
  isLoading: boolean;
  countTestId: string;
}

function MlsHandleHeaderBadges({
  sourceLabel,
  sellerTier,
  domainCount,
  isLoading,
  countTestId,
}: MlsHandleHeaderBadgesProps) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {sourceLabel ? (
        <span className="rounded-sm border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-medium text-white/62">
          {sourceLabel}
        </span>
      ) : null}

      {sellerTier ? <MlsSellerTierBadge tier={sellerTier} /> : null}

      <MlsHandleDomainCount
        domainCount={domainCount}
        isLoading={isLoading}
        testId={countTestId}
      />
    </div>
  );
}

function MlsHandleDomainCount({
  domainCount,
  isLoading,
  testId,
}: {
  domainCount: number;
  isLoading: boolean;
  testId: string;
}) {
  const t = useTranslations('feed');
  const value = isLoading ? '--' : domainCount;

  return (
    <div
      className="inline-flex w-fit items-baseline gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-white/62"
      data-testid={testId}
    >
      <span className="text-sm font-semibold tracking-tight text-white/86 tabular-nums">
        {value}
      </span>
      <span className="text-[0.68rem] leading-none font-medium tracking-wide uppercase">
        {t('users.columns.domains')}
      </span>
    </div>
  );
}

function MlsHandleRefreshButtonContent({
  isRefetching,
}: {
  isRefetching: boolean;
}) {
  const t = useTranslations('feed');
  const tCommon = useTranslations('common');

  if (isRefetching) {
    return (
      <>
        <Loader2 data-icon="inline-start" className="animate-spin" />
        {t('handle.refreshing')}
      </>
    );
  }

  return (
    <>
      <RefreshCcw data-icon="inline-start" />
      {tCommon('actions.refresh')}
    </>
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
      <section className="mt-3 grid gap-3 lg:mt-0">
        <MlsHandleInvalidHandleBanner />
      </section>
    );
  }

  const showEmptyState = !isLoading && !isError && listings.length === 0;
  const showErrorState = isError && listings.length === 0;
  const showEndOfFeed = !hasNextPage && listings.length > 0;

  return (
    <section className="mt-3 grid gap-3 lg:mt-0" data-testid="feed.handle.list">
      <MlsHandleInitialState
        isLoading={isLoading}
        showErrorState={showErrorState}
        errorMessage={errorMessage}
      />

      {listings.map((listing, index) => (
        <MlsSaleCard
          key={listing.id}
          listing={listing}
          showOtherDomainsCount={false}
          showSellerTierBadge={false}
          priorityImage={index === 0}
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
    <div
      className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
      data-testid="feed.handle.invalid-state"
    >
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
      <div
        className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
        data-testid="feed.handle.error-state"
      >
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
  const tCommon = useTranslations('common');

  return (
    <>
      {isFetchingNextPage ? <MlsHandleFeedSkeleton compact={true} /> : null}

      {hasNextPage ? <div ref={sentinelRef} className="h-8" /> : null}

      {hasNextPage && !isFetchingNextPage ? (
        <div className="flex justify-center pt-1">
          <Button
            variant="outline"
            onClick={onLoadMore}
            data-testid="feed.handle.load-more-button"
          >
            {tCommon('actions.loadMore')}
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
      <p
        className="rounded-lg border border-white/10 bg-card/55 px-4 py-10 text-center text-sm text-muted-foreground"
        data-testid="feed.handle.empty-state"
      >
        {t('handle.emptyListings')}
      </p>
    );
  }

  if (showEndOfFeed) {
    return (
      <p className="py-5 text-center text-xs tracking-wide text-muted-foreground uppercase">
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
    <div className="grid gap-4">
      {keys.map((key) => (
        <Card
          key={key}
          className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#111214] shadow-[0_1px_0_rgba(255,255,255,0.03)] !py-0"
        >
          <CardContent className="grid gap-0 p-0 md:min-h-[12rem] md:grid-cols-[13rem_minmax(0,1fr)]">
            <div className="relative min-h-40 overflow-hidden border-white/[0.08] border-b bg-[#17191d] md:min-h-full md:border-r md:border-b-0">
              <Skeleton className="absolute inset-0 rounded-none bg-white/[0.035]" />
              <Skeleton className="absolute top-1/2 left-1/2 h-16 w-28 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white/[0.07]" />
              <div
                aria-hidden={true}
                className="pointer-events-none absolute inset-0 ring-1 ring-white/[0.04] ring-inset"
              />
            </div>

            <div className="grid min-w-0 gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(9.5rem,12rem)] md:grid-rows-[auto_minmax(0,1fr)_auto] md:gap-x-6 md:gap-y-4 md:px-6 md:py-5">
              <div className="min-w-0">
                <Skeleton className="h-10 w-full max-w-[18rem] bg-white/[0.08] sm:h-12 md:h-11 xl:h-12" />
              </div>

              <div className="min-w-0 md:justify-self-end md:pt-1 md:text-right">
                <Skeleton className="h-7 w-28 bg-white/[0.08] md:ms-auto" />
                <Skeleton className="mt-2 h-3 w-10 bg-white/[0.06] md:ms-auto" />
              </div>

              <div className="min-w-0 self-end md:col-span-2 md:col-start-1 md:row-start-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Skeleton className="h-7 w-32 rounded-full bg-white/[0.08]" />
                  <Skeleton className="h-7 w-36 rounded-full bg-white/[0.055]" />
                </div>
              </div>

              <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-white/[0.07] border-t pt-3 md:col-span-2 md:row-start-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Skeleton className="size-4 shrink-0 rounded-full bg-white/[0.08]" />
                  <Skeleton className="h-4 w-20 bg-white/[0.06]" />
                  <Skeleton className="h-4 w-24 bg-white/[0.05]" />
                </div>
                <Skeleton className="h-7 w-20 rounded-md bg-white/[0.045]" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
