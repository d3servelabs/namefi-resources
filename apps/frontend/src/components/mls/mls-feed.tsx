'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import {
  ArrowUp,
  ChevronDown,
  Loader2,
  RefreshCcw,
  Rss,
  Search,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Permission } from '@namefi-astra/utils/permissions';
import { PermissionGate } from '@/components/access/PermissionGate';
import { MlsSaleCard } from '@/components/mls/mls-sale-card';
import {
  Button,
  buttonVariants,
} from '@namefi-astra/ui/components/shadcn/button';
import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@namefi-astra/ui/components/shadcn/command';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { cn } from '@namefi-astra/ui/lib/cn';
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
const FEED_FILTER_DEBOUNCE_MS = 300;
const COMMON_MLS_TLDS = ['com', 'ai', 'io', 'xyz', 'app', 'co', 'org', 'net'];
// Trims leading and trailing dots from user-entered TLD labels.
const EDGE_DOTS_PATTERN = /^\.+|\.+$/g;
// Allows DNS-style labels with optional internal hyphens and multi-label TLDs.
const TLD_FILTER_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;

export function MlsFeed() {
  const t = useTranslations('feed');
  const tCommon = useTranslations('common');
  const trpcClient = useTRPCClient();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const filters = useMlsFeedFilters();
  const scrollUx = useMlsFeedScrollUx();
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
    queryKey: ['mls-feed', filters.searchQuery, filters.tldFilter],
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      trpcClient.mls.getFeed.query({
        limit: DEFAULT_MLS_FEED_LIMIT,
        cursor: typeof pageParam === 'string' ? pageParam : null,
        query: filters.searchQuery,
        tld: filters.tldFilter,
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
      <MlsFeedHeader
        isLoading={isLoading}
        isRefetching={isRefetching}
        onRefresh={() => {
          void refetch();
        }}
      />

      <MlsFeedControls
        searchInput={filters.searchInput}
        tldInput={filters.tldInput}
        hasActiveFilters={filters.hasVisibleFilters}
        isCompact={scrollUx.isCompact}
        isLoading={isLoading}
        isRefetching={isRefetching}
        onSearchInputChange={filters.setSearchInput}
        onTldInputChange={filters.setTldInput}
        onClearFilters={filters.clearFilters}
        onRefresh={() => {
          void refetch();
        }}
      />

      <section className="mt-6 flex flex-col">
        {isLoading ? <MlsFeedSkeleton /> : null}

        {isError && listings.length === 0 ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error.message}
          </div>
        ) : null}

        {listings.map((listing) => (
          <MlsSaleCard key={listing.id} listing={listing} />
        ))}

        {!isLoading && !isError && listings.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {filters.hasAppliedFilters
              ? t('list.emptyFiltered')
              : t('list.empty')}
          </p>
        ) : null}

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
              {tCommon('actions.loadMore')}
            </Button>
          </div>
        ) : null}

        {!hasNextPage && listings.length > 0 ? (
          <p className="py-6 text-center text-xs tracking-wide text-muted-foreground uppercase">
            {t('list.endOfFeed')}
          </p>
        ) : null}
      </section>

      <MlsBackToTopButton isVisible={scrollUx.showBackToTop} />
    </main>
  );
}

function useMlsFeedFilters() {
  const [searchInput, setSearchInput] = useState('');
  const [tldInput, setTldInput] = useState('');
  const debouncedSearchInput = useDebouncedValue(
    searchInput,
    FEED_FILTER_DEBOUNCE_MS,
  );
  const debouncedTldInput = useDebouncedValue(
    tldInput,
    FEED_FILTER_DEBOUNCE_MS,
  );
  const searchQuery = useMemo(
    () => normalizeFeedSearchQuery(debouncedSearchInput),
    [debouncedSearchInput],
  );
  const tldFilter = useMemo(
    () => normalizeTldFilter(debouncedTldInput),
    [debouncedTldInput],
  );
  const clearFilters = useCallback(() => {
    setSearchInput('');
    setTldInput('');
  }, []);
  const hasVisibleFilters = Boolean(searchInput.trim() || tldInput.trim());
  const hasAppliedFilters = Boolean(searchQuery || tldFilter);

  return {
    searchInput,
    tldInput,
    searchQuery,
    tldFilter,
    hasVisibleFilters,
    hasAppliedFilters,
    setSearchInput,
    setTldInput,
    clearFilters,
  };
}

function useMlsFeedScrollUx() {
  const [isCompact, setIsCompact] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const updateScrollState = useCallback((latest: number) => {
    const shouldCompact = latest > 96;
    const shouldShow = latest > 320;
    setIsCompact((current) =>
      current === shouldCompact ? current : shouldCompact,
    );
    setShowBackToTop((current) =>
      current === shouldShow ? current : shouldShow,
    );
  }, []);

  useEffect(() => {
    const scrollContainer = getMlsScrollContainer();
    const handleScroll = () => {
      updateScrollState(getMlsScrollTop(scrollContainer));
    };

    handleScroll();
    scrollContainer.addEventListener('scroll', handleScroll, {
      passive: true,
    });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [updateScrollState]);

  return {
    isCompact,
    showBackToTop,
  };
}

interface MlsFeedHeaderProps {
  isLoading: boolean;
  isRefetching: boolean;
  onRefresh: () => void;
}

function MlsFeedHeader({
  isLoading,
  isRefetching,
  onRefresh,
}: MlsFeedHeaderProps) {
  const t = useTranslations('feed');
  const tCommon = useTranslations('common');

  return (
    <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/10 via-background to-cyan-500/10 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PermissionGate permissions={[Permission.VIEW_ADMIN_DASHBOARD]}>
            <Link
              href="/feed/users"
              className={buttonVariants({ variant: 'secondary' })}
            >
              <Users data-icon="inline-start" />
              {t('header.usersLink')}
            </Link>
          </PermissionGate>

          <a
            href={MLS_FEED_RSS_PATH}
            target="_blank"
            rel="noreferrer noopener"
            className={buttonVariants({ variant: 'secondary' })}
          >
            <Rss data-icon="inline-start" />
            {t('header.subscribeRss')}
          </a>

          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading || isRefetching}
          >
            {isRefetching ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 data-icon="inline-start" className="animate-spin" />
                {t('header.refreshing')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <RefreshCcw data-icon="inline-start" />
                {tCommon('actions.refresh')}
              </span>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

interface MlsFeedControlsProps {
  searchInput: string;
  tldInput: string;
  hasActiveFilters: boolean;
  isCompact: boolean;
  isLoading: boolean;
  isRefetching: boolean;
  onSearchInputChange: (value: string) => void;
  onTldInputChange: (value: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
}

function MlsFeedControls({
  searchInput,
  tldInput,
  hasActiveFilters,
  isCompact,
  isLoading,
  isRefetching,
  onSearchInputChange,
  onTldInputChange,
  onClearFilters,
  onRefresh,
}: MlsFeedControlsProps) {
  const t = useTranslations('feed');
  const tCommon = useTranslations('common');
  const placeholderTld = normalizeTldFilter(tldInput);
  const searchPlaceholder = placeholderTld
    ? t('controls.searchPlaceholderWithTld', { tld: placeholderTld })
    : t('controls.searchPlaceholder');

  return (
    <motion.section
      className="sticky top-20 z-20 mt-3 overflow-hidden rounded-xl border border-border/70 bg-background/95 shadow-sm backdrop-blur-md lg:top-3"
      animate={{
        boxShadow: isCompact
          ? '0 14px 34px rgba(0, 0, 0, 0.22)'
          : '0 1px 2px rgba(0, 0, 0, 0.04)',
      }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <AnimatePresence initial={false}>
        {isCompact ? (
          <motion.div
            className="flex items-center justify-between gap-3 border-border/70 border-b px-3 py-2"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <p className="min-w-0 truncate text-sm font-semibold">
              {t('title')}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <PermissionGate permissions={[Permission.VIEW_ADMIN_DASHBOARD]}>
                <Link
                  href="/feed/users"
                  className={buttonVariants({
                    variant: 'secondary',
                    size: 'sm',
                  })}
                >
                  <Users data-icon="inline-start" />
                  {t('header.usersLink')}
                </Link>
              </PermissionGate>
              <a
                href={MLS_FEED_RSS_PATH}
                target="_blank"
                rel="noreferrer noopener"
                className={buttonVariants({ variant: 'secondary', size: 'sm' })}
              >
                <Rss data-icon="inline-start" />
                {t('header.rss')}
              </a>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading || isRefetching}
              >
                {isRefetching ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <RefreshCcw data-icon="inline-start" />
                )}
                {tCommon('actions.refresh')}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        className={cn(
          'grid gap-3 sm:items-end',
          hasActiveFilters
            ? 'sm:grid-cols-[minmax(0,1fr)_10rem_auto]'
            : 'sm:grid-cols-[minmax(0,1fr)_10rem]',
        )}
        animate={{ padding: isCompact ? 10 : 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <label className="grid min-w-0 gap-1.5" htmlFor="mls-feed-search">
          <span className="text-xs font-medium text-muted-foreground">
            {t('controls.searchLabel')}
          </span>
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="mls-feed-search"
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              value={searchInput}
              onChange={(event) => onSearchInputChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 bg-background/80 pe-9 ps-9"
            />
            {searchInput ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute top-1/2 end-2 -translate-y-1/2"
                aria-label={t('controls.clearSearchAriaLabel')}
                onClick={() => onSearchInputChange('')}
              >
                <X />
              </Button>
            ) : null}
          </div>
        </label>

        <div className="grid min-w-0 gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {t('controls.tldLabel')}
          </span>
          <MlsTldFilterCombobox
            value={tldInput}
            onValueChange={onTldInputChange}
          />
        </div>

        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            className="h-10 justify-self-start sm:justify-self-auto"
            onClick={onClearFilters}
          >
            <X data-icon="inline-start" />
            {t('controls.clear')}
          </Button>
        ) : null}
      </motion.div>
    </motion.section>
  );
}

interface MlsTldFilterComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
}

function MlsTldFilterCombobox({
  value,
  onValueChange,
}: MlsTldFilterComboboxProps) {
  const t = useTranslations('feed');
  const [open, setOpen] = useState(false);
  const [commandValue, setCommandValue] = useState('');
  const selectedTld = normalizeTldFilter(value);
  const customTld = normalizeTldFilter(commandValue);
  const hasSelectedCustomTld = Boolean(
    selectedTld && !isCommonMlsTld(selectedTld),
  );
  const canUseCustomTld = Boolean(
    customTld && !isCommonMlsTld(customTld) && customTld !== selectedTld,
  );

  const selectTld = useCallback(
    (nextTld: string | null) => {
      onValueChange(nextTld ?? '');
      setOpen(false);
      setCommandValue('');
    },
    [onValueChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'h-10 w-full justify-between bg-background/80 px-3 font-normal',
              !selectedTld && 'text-muted-foreground',
            )}
          />
        }
      >
        <span className="min-w-0 truncate">
          {selectedTld ? `.${selectedTld}` : t('controls.allTlds')}
        </span>
        <ChevronDown data-icon="inline-end" className="opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="min-w-[--anchor-width] p-0" align="start">
        <Command shouldFilter={true} className="max-h-80">
          <CommandInput
            value={commandValue}
            onValueChange={setCommandValue}
            placeholder={t('controls.tldPlaceholder')}
          />
          <CommandList>
            <CommandEmpty>{t('controls.noTldMatch')}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all tlds"
                data-checked={!selectedTld}
                onSelect={() => selectTld(null)}
              >
                {t('controls.allTlds')}
              </CommandItem>
            </CommandGroup>
            {hasSelectedCustomTld ? (
              <CommandGroup heading={t('controls.selectedHeading')}>
                <CommandItem
                  value={`.${selectedTld} ${selectedTld}`}
                  data-checked={true}
                  onSelect={() => selectTld(selectedTld)}
                >
                  .{selectedTld}
                </CommandItem>
              </CommandGroup>
            ) : null}
            {canUseCustomTld ? (
              <CommandGroup heading={t('controls.customHeading')}>
                <CommandItem
                  value={`.${customTld} ${customTld}`}
                  onSelect={() => selectTld(customTld)}
                >
                  {t('controls.useCustomTld', { tld: customTld ?? '' })}
                </CommandItem>
              </CommandGroup>
            ) : null}
            <CommandGroup heading={t('controls.commonHeading')}>
              {COMMON_MLS_TLDS.map((tld) => (
                <CommandItem
                  key={tld}
                  value={`.${tld} ${tld}`}
                  data-checked={selectedTld === tld}
                  onSelect={() => selectTld(tld)}
                >
                  .{tld}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function MlsBackToTopButton({ isVisible }: { isVisible: boolean }) {
  const t = useTranslations('feed');

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          className="fixed right-4 bottom-5 z-30 sm:right-6 lg:right-[max(1.5rem,calc((100vw-45rem)/2+1.5rem))]"
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-full border-border/70 bg-background/85 shadow-lg backdrop-blur-md"
            onClick={scrollMlsFeedToTop}
            aria-label={t('list.backToTopAriaLabel')}
          >
            <ArrowUp />
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

interface MlsFeedSkeletonProps {
  compact?: boolean;
}

function MlsFeedSkeleton({ compact = false }: MlsFeedSkeletonProps) {
  const keys = compact ? [SKELETON_KEYS[0], SKELETON_KEYS[1]] : SKELETON_KEYS;

  return (
    <div className="flex flex-col">
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

function useDebouncedValue(value: string, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}

function normalizeFeedSearchQuery(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized ? normalized : null;
}

type MlsScrollContainer = HTMLElement | Window;

function getMlsScrollContainer(): MlsScrollContainer {
  return (
    document.querySelector<HTMLElement>('[data-slot="sidebar-inset"]') ?? window
  );
}

function getMlsScrollTop(target: MlsScrollContainer) {
  return target instanceof Window ? target.scrollY : target.scrollTop;
}

function scrollMlsFeedToTop() {
  getMlsScrollContainer().scrollTo({ top: 0, behavior: 'smooth' });
}

function normalizeTldFilter(value: string | null) {
  const normalized = value?.trim().toLowerCase().replace(EDGE_DOTS_PATTERN, '');

  if (!normalized || !TLD_FILTER_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

function isCommonMlsTld(value: string | null): value is string {
  return Boolean(value && COMMON_MLS_TLDS.includes(value));
}
