'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowUp, ChevronDown, Rss, Search, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
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
const TLD_COMMAND_INPUT_GROUP_CLASS =
  '[&_[data-slot=command-input-wrapper]_[data-slot=input-group]]:focus-within:border-input/50 [&_[data-slot=command-input-wrapper]_[data-slot=input-group]]:focus-within:bg-input/40 [&_[data-slot=command-input-wrapper]_[data-slot=input-group]]:focus-within:ring-0 [&_[data-slot=command-input-wrapper]_[data-slot=input-group]]:focus-within:ring-transparent';
const TLD_COMMAND_INPUT_CLASS =
  'h-full min-w-0 flex-1 appearance-none border-0 p-0 shadow-none ring-0 focus:border-0 focus:ring-0 focus:outline-none focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none';
const NAMEFI_TITLE_SEGMENT_PATTERN = /Namefi/i;
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
    <main className="mx-auto w-full max-w-[74rem] px-3 pt-4 pb-10 sm:px-5 sm:pt-6 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <MlsFeedControlRail
          searchInput={filters.searchInput}
          tldInput={filters.tldInput}
          listingCount={listings.length}
          isLoading={isLoading}
          hasActiveFilters={filters.hasVisibleFilters}
          onSearchInputChange={filters.setSearchInput}
          onTldInputChange={filters.setTldInput}
          onClearFilters={filters.clearFilters}
        />

        <div className="min-w-0">
          <MlsFeedMobileHeader
            listingCount={listings.length}
            isLoading={isLoading}
          />

          <MlsFeedMobileControls
            searchInput={filters.searchInput}
            tldInput={filters.tldInput}
            hasActiveFilters={filters.hasVisibleFilters}
            onSearchInputChange={filters.setSearchInput}
            onTldInputChange={filters.setTldInput}
            onClearFilters={filters.clearFilters}
          />

          <section className="mt-3 grid gap-3 lg:mt-0" data-testid="feed.list">
            {isLoading ? <MlsFeedSkeleton /> : null}

            {isError && listings.length === 0 ? (
              <div
                className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
                data-testid="feed.list.error-state"
              >
                {error.message}
              </div>
            ) : null}

            {listings.map((listing, index) => (
              <MlsSaleCard
                key={listing.id}
                listing={listing}
                priorityImage={index === 0}
              />
            ))}

            {!isLoading && !isError && listings.length === 0 ? (
              <p
                className="rounded-lg border border-white/10 bg-card/55 px-4 py-10 text-center text-sm text-muted-foreground"
                data-testid="feed.list.empty-state"
              >
                {filters.hasAppliedFilters
                  ? t('list.emptyFiltered')
                  : t('list.empty')}
              </p>
            ) : null}

            {isFetchingNextPage ? <MlsFeedSkeleton compact={true} /> : null}

            {hasNextPage ? <div ref={sentinelRef} className="h-8" /> : null}

            {hasNextPage && !isFetchingNextPage ? (
              <div className="flex justify-center pt-1">
                <Button
                  variant="outline"
                  onClick={() => {
                    void fetchNextPage();
                  }}
                  data-testid="feed.list.load-more-button"
                >
                  {tCommon('actions.loadMore')}
                </Button>
              </div>
            ) : null}

            {!hasNextPage && listings.length > 0 ? (
              <p className="py-5 text-center text-xs tracking-wide text-muted-foreground uppercase">
                {t('list.endOfFeed')}
              </p>
            ) : null}
          </section>
        </div>
      </div>

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
  const [showBackToTop, setShowBackToTop] = useState(false);
  const updateScrollState = useCallback((latest: number) => {
    const shouldShow = latest > 320;
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
    showBackToTop,
  };
}

interface MlsFeedFilterProps {
  searchInput: string;
  tldInput: string;
  hasActiveFilters: boolean;
  onSearchInputChange: (value: string) => void;
  onTldInputChange: (value: string) => void;
  onClearFilters: () => void;
}

interface MlsFeedCountProps {
  listingCount: number;
  isLoading: boolean;
}

interface MlsFeedHeaderCountProps extends MlsFeedCountProps {
  testId: string;
  variant?: 'pill' | 'inline';
}

interface MlsFeedControlRailProps
  extends MlsFeedFilterProps,
    MlsFeedCountProps {}

function MlsFeedControlRail({
  searchInput,
  tldInput,
  listingCount,
  isLoading,
  hasActiveFilters,
  onSearchInputChange,
  onTldInputChange,
  onClearFilters,
}: MlsFeedControlRailProps) {
  return (
    <aside className="hidden lg:sticky lg:top-5 lg:block lg:max-h-[calc(100svh-2.5rem)] lg:self-start">
      <section
        className="flex max-h-[calc(100svh-2.5rem)] flex-col gap-4 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#111214] p-4 shadow-[0_1px_0_rgba(255,255,255,0.03)]"
        data-testid="feed.controls.rail"
      >
        <div className="grid gap-1.5">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <h1 className="min-w-0 text-3xl leading-tight font-semibold tracking-tight">
              <MlsFeedTitle />
            </h1>
            <MlsFeedRssLink
              testId="feed.controls.rss-link"
              variant="ghost"
              size="xs"
              className="mt-1 text-white/54 hover:bg-white/[0.06] hover:text-white/86"
            />
          </div>
          <MlsFeedHeaderCount
            listingCount={listingCount}
            isLoading={isLoading}
            testId="feed.controls.domain-count"
            variant="inline"
          />
        </div>

        <MlsFeedAdminActions />

        <div className="h-px bg-white/10" />

        <MlsFeedFilterFields
          mode="desktop"
          searchInput={searchInput}
          tldInput={tldInput}
          hasActiveFilters={hasActiveFilters}
          onSearchInputChange={onSearchInputChange}
          onTldInputChange={onTldInputChange}
          onClearFilters={onClearFilters}
        />

        <MlsAppliedFilterChips
          searchInput={searchInput}
          tldInput={tldInput}
          onSearchInputChange={onSearchInputChange}
          onTldInputChange={onTldInputChange}
        />
      </section>
    </aside>
  );
}

function MlsFeedMobileHeader({ listingCount, isLoading }: MlsFeedCountProps) {
  const t = useTranslations('feed');

  return (
    <section className="mb-4 flex min-w-0 items-start justify-between gap-3 border-white/[0.08] border-b pb-4 lg:hidden">
      <div className="grid min-w-0 gap-1.5">
        <h1 className="min-w-0 text-2xl leading-tight font-semibold tracking-tight">
          <MlsFeedTitle />
        </h1>
        <MlsFeedHeaderCount
          listingCount={listingCount}
          isLoading={isLoading}
          testId="feed.header.domain-count"
        />
      </div>

      <div className="flex shrink-0 flex-wrap justify-end gap-2">
        <PermissionGate permissions={[Permission.VIEW_ADMIN_DASHBOARD]}>
          <Link
            href="/feed/users"
            className={buttonVariants({ variant: 'secondary', size: 'sm' })}
            data-testid="feed.header.users-link"
          >
            <Users data-icon="inline-start" />
            {t('header.usersLink')}
          </Link>
        </PermissionGate>

        <MlsFeedRssLink testId="feed.header.rss-link" />
      </div>
    </section>
  );
}

function MlsFeedMobileControls({
  searchInput,
  tldInput,
  hasActiveFilters,
  onSearchInputChange,
  onTldInputChange,
  onClearFilters,
}: MlsFeedFilterProps) {
  return (
    <section
      className="sticky top-[calc(4rem+var(--announcement-strip-height,0px))] z-30 -mx-3 border-white/10 border-y bg-background/95 px-3 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:-mx-5 sm:px-5 lg:hidden"
      data-testid="feed.controls.mobile"
    >
      <MlsFeedFilterFields
        mode="mobile"
        searchInput={searchInput}
        tldInput={tldInput}
        hasActiveFilters={hasActiveFilters}
        onSearchInputChange={onSearchInputChange}
        onTldInputChange={onTldInputChange}
        onClearFilters={onClearFilters}
      />

      <MlsAppliedFilterChips
        searchInput={searchInput}
        tldInput={tldInput}
        onSearchInputChange={onSearchInputChange}
        onTldInputChange={onTldInputChange}
        className="mt-2 flex-nowrap overflow-x-auto pb-0.5"
      />
    </section>
  );
}

function MlsFeedAdminActions() {
  const t = useTranslations('feed');

  return (
    <PermissionGate permissions={[Permission.VIEW_ADMIN_DASHBOARD]}>
      <Link
        href="/feed/users"
        className={cn(
          buttonVariants({ variant: 'secondary', size: 'sm' }),
          'w-full justify-start',
        )}
        data-testid="feed.controls.users-link"
      >
        <Users data-icon="inline-start" />
        {t('header.usersLink')}
      </Link>
    </PermissionGate>
  );
}

function MlsFeedRssLink({
  testId,
  variant = 'secondary',
  size = 'sm',
  className,
}: {
  testId: string;
  variant?: 'secondary' | 'ghost';
  size?: 'xs' | 'sm';
  className?: string;
}) {
  const t = useTranslations('feed');

  return (
    <a
      href={MLS_FEED_RSS_PATH}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(buttonVariants({ variant, size }), className)}
      aria-label={t('header.subscribeRss')}
      data-testid={testId}
    >
      <Rss data-icon="inline-start" />
      {t('header.rss')}
    </a>
  );
}

function MlsFeedTitle() {
  const t = useTranslations('feed');
  const title = t('title');
  const titleSegments = getNamefiTitleSegments(title);

  if (!titleSegments) {
    return title;
  }

  const { beforeNamefi, afterNamefi } = titleSegments;

  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      {beforeNamefi ? <span className="min-w-0">{beforeNamefi}</span> : null}
      <span className="inline-flex shrink-0 items-center">
        <span className="sr-only">Namefi</span>
        <Image
          src="/logotype.svg"
          alt=""
          aria-hidden="true"
          width={132}
          height={43}
          className="h-[0.84em] w-auto"
          loading="eager"
          unoptimized
        />
      </span>
      {afterNamefi ? <span className="min-w-0">{afterNamefi}</span> : null}
    </span>
  );
}

interface MlsFeedFilterFieldsProps extends MlsFeedFilterProps {
  mode: 'desktop' | 'mobile';
}

function MlsFeedFilterFields({
  mode,
  searchInput,
  tldInput,
  hasActiveFilters,
  onSearchInputChange,
  onTldInputChange,
  onClearFilters,
}: MlsFeedFilterFieldsProps) {
  const t = useTranslations('feed');
  const placeholderTld = normalizeTldFilter(tldInput);
  const searchPlaceholder = placeholderTld
    ? t('controls.searchPlaceholderWithTld', { tld: placeholderTld })
    : t('controls.searchPlaceholder');
  const isMobile = mode === 'mobile';
  const searchInputId = isMobile
    ? 'mls-feed-search-mobile'
    : 'mls-feed-search-desktop';

  return (
    <div
      className={cn(
        'grid gap-3',
        isMobile
          ? 'grid-cols-[minmax(0,1fr)_7.75rem] items-end gap-2 min-[380px]:grid-cols-[minmax(0,1fr)_8.5rem]'
          : null,
      )}
    >
      <label className="grid min-w-0 gap-1.5" htmlFor={searchInputId}>
        <span className="text-xs font-medium text-muted-foreground">
          {t('controls.searchLabel')}
        </span>
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={searchInputId}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 rounded-lg border-white/10 bg-background/80 pe-9 ps-9"
            data-testid="feed.controls.search-input"
          />
          {searchInput ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="absolute top-1/2 end-2 -translate-y-1/2"
              aria-label={t('controls.clearSearchAriaLabel')}
              onClick={() => onSearchInputChange('')}
              data-testid="feed.controls.clear-search-button"
            >
              <X />
            </Button>
          ) : null}
        </div>
      </label>

      <div className="grid min-w-0 gap-2">
        <div className="grid min-w-0 gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {t('controls.tldLabel')}
          </span>
          <MlsTldFilterCombobox
            value={tldInput}
            onValueChange={onTldInputChange}
          />
        </div>

        {hasActiveFilters && !isMobile ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 justify-self-start px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={onClearFilters}
            data-testid="feed.controls.clear-filters-button"
          >
            <X data-icon="inline-start" />
            {t('controls.clear')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

interface MlsAppliedFilterChipsProps {
  searchInput: string;
  tldInput: string;
  onSearchInputChange: (value: string) => void;
  onTldInputChange: (value: string) => void;
  className?: string;
}

function MlsAppliedFilterChips({
  searchInput,
  tldInput,
  onSearchInputChange,
  onTldInputChange,
  className,
}: MlsAppliedFilterChipsProps) {
  const t = useTranslations('feed');
  const searchValue = searchInput.trim();
  const tldValue = normalizeTldFilter(tldInput);

  if (!searchValue && !tldValue) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {searchValue ? (
        <button
          type="button"
          className="inline-flex h-7 max-w-full shrink-0 items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 text-xs font-medium text-cyan-100 transition-colors hover:bg-cyan-300/15"
          onClick={() => onSearchInputChange('')}
          aria-label={t('controls.clearSearchAriaLabel')}
        >
          <span className="min-w-0 truncate">
            {t('controls.searchLabel')}: {searchValue}
          </span>
          <X className="size-3" />
        </button>
      ) : null}

      {tldValue ? (
        <button
          type="button"
          className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 text-xs font-medium text-emerald-100 transition-colors hover:bg-emerald-300/15"
          onClick={() => onTldInputChange('')}
          aria-label={`${t('controls.clear')} .${tldValue}`}
        >
          <span>
            {t('controls.tldLabel')}: .{tldValue}
          </span>
          <X className="size-3" />
        </button>
      ) : null}
    </div>
  );
}

function MlsFeedHeaderCount({
  listingCount,
  isLoading,
  testId,
  variant = 'pill',
}: MlsFeedHeaderCountProps) {
  const t = useTranslations('feed');
  const value = isLoading ? '--' : listingCount;

  if (variant === 'inline') {
    return (
      <div
        className="inline-flex w-fit items-baseline gap-1.5 text-white/42"
        data-testid={testId}
      >
        <span className="text-sm font-semibold tracking-tight text-white/72 tabular-nums">
          {value}
        </span>
        <span className="text-[0.68rem] leading-none font-medium tracking-wide uppercase">
          {t('users.columns.domains')}
        </span>
      </div>
    );
  }

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
            data-testid="feed.controls.tld-combobox"
          />
        }
      >
        <span className="min-w-0 truncate">
          {selectedTld ? `.${selectedTld}` : t('controls.allTlds')}
        </span>
        <ChevronDown data-icon="inline-end" className="opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="min-w-[--anchor-width] p-0" align="start">
        <Command
          shouldFilter={true}
          className={cn('max-h-80', TLD_COMMAND_INPUT_GROUP_CLASS)}
        >
          <CommandInput
            className={TLD_COMMAND_INPUT_CLASS}
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
          className="fixed right-4 bottom-[calc(1.25rem_+_env(safe-area-inset-bottom,0px))] z-30 sm:right-6 lg:right-[max(1.5rem,calc((100vw-78rem)/2+1.5rem))]"
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
            data-testid="feed.list.back-to-top-button"
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

function getNamefiTitleSegments(title: string) {
  const match = NAMEFI_TITLE_SEGMENT_PATTERN.exec(title);

  if (!match) {
    return null;
  }

  return {
    beforeNamefi: title.slice(0, match.index).trim(),
    afterNamefi: title.slice(match.index + match[0].length).trim(),
  };
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
