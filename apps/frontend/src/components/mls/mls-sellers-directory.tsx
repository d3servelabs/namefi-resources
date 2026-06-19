'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import {
  type Column,
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type OnChangeFn,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  ExternalLink,
  Loader2,
  RefreshCcw,
  Search,
  Users,
  X,
} from 'lucide-react';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { MlsSellerTierBadge } from '@/components/mls/mls-seller-tier-badge';
import { getMlsSellerTier } from '@namefi-astra/common/mls-seller-tiers';
import {
  Button,
  buttonVariants,
} from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  DEFAULT_MLS_FEED_LIMIT,
  MAX_MLS_FEED_LIMIT,
  type MlsSellerDirectoryPage,
  type MlsSellerDirectoryRow,
  type MlsSellerDirectorySortBy,
  type MlsSellerDirectorySortOrder,
} from '@/lib/mls/feed';
import { useTRPCClient } from '@/lib/trpc';

const SELLER_FILTER_DEBOUNCE_MS = 300;
const ACTIVE_ANY_VALUE = '__any__';
const SKELETON_KEYS = [
  'mls-seller-skeleton-1',
  'mls-seller-skeleton-2',
  'mls-seller-skeleton-3',
] as const;
const DEFAULT_USERS_MIN_POSTS = 1;
const DEFAULT_USERS_ACTIVE_WITHIN_DAYS: number | null = null;
const SELLER_TABLE_ROW_HEIGHT = 72;
const VIRTUAL_OVERSCAN_ROWS = 4;
const MIN_POST_OPTIONS = [1, 3, 5, 10, 20] as const;
const DEFAULT_USERS_SORT_BY: MlsSellerDirectorySortBy = 'domains';
const DEFAULT_USERS_SORT_ORDER: MlsSellerDirectorySortOrder = 'desc';
const CSV_HEADERS = [
  'source',
  'handle',
  'display_name',
  'profile_url',
  'listing_url',
  'sale_post_count',
  'domain_count',
  'namefi_domains_count',
  'tier_domain_count',
  'posts_per_week',
  'domains_per_post',
  'purchase_url_count',
  'days_since_last_post',
  'active_days',
  'first_posted_at',
  'last_posted_at',
  'latest_source_tweet_url',
  'sample_domains',
  'source_tweet_urls',
] as const;
const CSV_ESCAPE_RE = /[",\r\n]/;
const CSV_FORMULA_RE = /^[=+\-@]/;

interface AppliedMlsSellerDirectoryFilters {
  searchQuery: string | null;
  minSalePosts: number;
  activeWithinDays: number | null;
  sortBy: MlsSellerDirectorySortBy;
  sortOrder: MlsSellerDirectorySortOrder;
}
const ACTIVE_WITHIN_OPTIONS = [
  { days: null, value: ACTIVE_ANY_VALUE },
  { days: 7, value: '7' },
  { days: 30, value: '30' },
  { days: 90, value: '90' },
] as const;
const SELLER_SORT_COLUMN_BY_API_SORT: Record<MlsSellerDirectorySortBy, string> =
  {
    cadence: 'cadence',
    domains: 'domains',
    recent: 'recent',
    salePosts: 'salePosts',
  };
const API_SORT_BY_SELLER_SORT_COLUMN: Record<string, MlsSellerDirectorySortBy> =
  {
    cadence: 'cadence',
    domains: 'domains',
    recent: 'recent',
    salePosts: 'salePosts',
  };

export function MlsSellersDirectory() {
  const t = useTranslations('feed');
  const trpcClient = useTRPCClient();
  const filters = useMlsSellerDirectoryFilters();
  const [isExportingCsv, setIsExportingCsv] = useState(false);
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
  } = useInfiniteQuery<MlsSellerDirectoryPage, Error>({
    queryKey: [
      'mls-sellers',
      filters.searchQuery,
      filters.minSalePosts,
      filters.activeWithinDays,
      filters.sortBy,
      filters.sortOrder,
    ],
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      trpcClient.mls.getSellers.query({
        limit: DEFAULT_MLS_FEED_LIMIT,
        cursor: typeof pageParam === 'string' ? pageParam : null,
        query: filters.searchQuery,
        tld: null,
        minSalePosts: filters.minSalePosts,
        activeWithinDays: filters.activeWithinDays,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 60_000,
    retry: 1,
  });

  const sellers = useMemo(
    () => data?.pages.flatMap((page) => page.rows) ?? [],
    [data?.pages],
  );
  const firstPage = data?.pages[0];
  const total = firstPage?.total ?? sellers.length;
  const generatedAt = firstPage?.generatedAt ?? null;

  const exportCsv = useCallback(async () => {
    if (isExportingCsv) {
      return;
    }

    setIsExportingCsv(true);
    try {
      const rows = await fetchAllMatchingSellerRows(trpcClient, filters);
      downloadMlsSellerDirectoryCsv(rows, filters);
      toast.success(t('users.exportSuccess'));
    } catch (csvError) {
      toast.error(t('users.exportErrorTitle'), {
        description:
          csvError instanceof Error
            ? csvError.message
            : t('users.exportErrorFallback'),
      });
    } finally {
      setIsExportingCsv(false);
    }
  }, [filters, isExportingCsv, trpcClient, t]);

  return (
    <main className="mx-auto flex w-full max-w-[82rem] flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <MlsSellersHeader
        total={total}
        generatedAt={generatedAt}
        isLoading={isLoading}
        isRefetching={isRefetching}
        isExportingCsv={isExportingCsv}
        onRefresh={() => {
          void refetch();
        }}
        onExportCsv={() => {
          void exportCsv();
        }}
      />

      <MlsSellersControls
        searchInput={filters.searchInput}
        minSalePosts={filters.minSalePosts}
        activeWithinDays={filters.activeWithinDays}
        hasActiveFilters={filters.hasVisibleFilters}
        onSearchInputChange={filters.setSearchInput}
        onMinSalePostsChange={filters.setMinSalePosts}
        onActiveWithinDaysChange={filters.setActiveWithinDays}
        onClearFilters={filters.clearFilters}
      />

      <MlsSellersTable
        sellers={sellers}
        sorting={filters.sorting}
        onSortingChange={filters.setSorting}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => {
          void fetchNextPage();
        }}
      />
    </main>
  );
}

function useMlsSellerDirectoryFilters() {
  const [searchInput, setSearchInput] = useState('');
  const [minSalePosts, setMinSalePosts] = useState(DEFAULT_USERS_MIN_POSTS);
  const [activeWithinDays, setActiveWithinDays] = useState<number | null>(
    DEFAULT_USERS_ACTIVE_WITHIN_DAYS,
  );
  const [sortBy, setSortBy] = useState<MlsSellerDirectorySortBy>(
    DEFAULT_USERS_SORT_BY,
  );
  const [sortOrder, setSortOrder] = useState<MlsSellerDirectorySortOrder>(
    DEFAULT_USERS_SORT_ORDER,
  );
  const debouncedSearchInput = useDebouncedValue(
    searchInput,
    SELLER_FILTER_DEBOUNCE_MS,
  );
  const searchQuery = useMemo(
    () => normalizeFeedSearchQuery(debouncedSearchInput),
    [debouncedSearchInput],
  );
  const sorting = useMemo<SortingState>(
    () => [
      {
        id: SELLER_SORT_COLUMN_BY_API_SORT[sortBy],
        desc: sortOrder === 'desc',
      },
    ],
    [sortBy, sortOrder],
  );
  const setSorting = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      const nextSorting =
        typeof updater === 'function' ? updater(sorting) : updater;
      const nextSort = nextSorting[0];
      if (!nextSort) {
        setSortBy(DEFAULT_USERS_SORT_BY);
        setSortOrder(DEFAULT_USERS_SORT_ORDER);
        return;
      }

      const nextSortBy = API_SORT_BY_SELLER_SORT_COLUMN[nextSort.id];
      if (!nextSortBy) {
        return;
      }

      setSortBy(nextSortBy);
      setSortOrder(nextSort.desc ? 'desc' : 'asc');
    },
    [sorting],
  );
  const clearFilters = useCallback(() => {
    setSearchInput('');
    setMinSalePosts(DEFAULT_USERS_MIN_POSTS);
    setActiveWithinDays(DEFAULT_USERS_ACTIVE_WITHIN_DAYS);
    setSortBy(DEFAULT_USERS_SORT_BY);
    setSortOrder(DEFAULT_USERS_SORT_ORDER);
  }, []);
  const hasVisibleFilters = Boolean(
    searchInput.trim() ||
      minSalePosts !== DEFAULT_USERS_MIN_POSTS ||
      activeWithinDays !== DEFAULT_USERS_ACTIVE_WITHIN_DAYS ||
      sortBy !== DEFAULT_USERS_SORT_BY ||
      sortOrder !== DEFAULT_USERS_SORT_ORDER,
  );

  return {
    searchInput,
    searchQuery,
    minSalePosts,
    activeWithinDays,
    sortBy,
    sortOrder,
    sorting,
    hasVisibleFilters,
    setSearchInput,
    setMinSalePosts,
    setActiveWithinDays,
    setSortBy,
    setSortOrder,
    setSorting,
    clearFilters,
  };
}

interface MlsSellersHeaderProps {
  total: number;
  generatedAt: string | null;
  isLoading: boolean;
  isRefetching: boolean;
  isExportingCsv: boolean;
  onRefresh: () => void;
  onExportCsv: () => void;
}

function MlsSellersHeader({
  total,
  generatedAt,
  isLoading,
  isRefetching,
  isExportingCsv,
  onRefresh,
  onExportCsv,
}: MlsSellersHeaderProps) {
  const t = useTranslations('feed');
  const tCommon = useTranslations('common');

  return (
    <section className="border-border/70 border-b pb-4">
      <Link
        href="/feed"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 rtl:-scale-x-100" />
        {t('users.backToFeed')}
      </Link>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('users.title')}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? t('users.loadingSubtitle')
              : generatedAt
                ? t('users.subtitleRefreshed', {
                    count: total,
                    refreshedAt: formatGeneratedAt(generatedAt),
                  })
                : t('users.subtitle', { count: total })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
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

          <Button
            type="button"
            variant="secondary"
            onClick={onExportCsv}
            disabled={isLoading || isExportingCsv}
          >
            {isExportingCsv ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Download data-icon="inline-start" />
            )}
            {t('users.exportCsv')}
          </Button>
        </div>
      </div>
    </section>
  );
}

interface MlsSellersControlsProps {
  searchInput: string;
  minSalePosts: number;
  activeWithinDays: number | null;
  hasActiveFilters: boolean;
  onSearchInputChange: (value: string) => void;
  onMinSalePostsChange: (value: number) => void;
  onActiveWithinDaysChange: (value: number | null) => void;
  onClearFilters: () => void;
}

function MlsSellersControls({
  searchInput,
  minSalePosts,
  activeWithinDays,
  hasActiveFilters,
  onSearchInputChange,
  onMinSalePostsChange,
  onActiveWithinDaysChange,
  onClearFilters,
}: MlsSellersControlsProps) {
  const t = useTranslations('feed');

  return (
    <section className="rounded-lg border border-border/70 bg-background">
      <div className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between">
        <div className="relative min-w-0 md:max-w-md md:flex-1">
          <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="mls-seller-search"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder={t('users.searchPlaceholder')}
            className="h-9 bg-background pe-9 ps-9"
          />
          {searchInput ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="absolute top-1/2 end-2 -translate-y-1/2"
              aria-label={t('users.clearSearchAriaLabel')}
              onClick={() => onSearchInputChange('')}
            >
              <X />
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(minSalePosts)}
            onValueChange={(value) => {
              if (!value) {
                return;
              }

              onMinSalePostsChange(Number.parseInt(value, 10));
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-[8.75rem] bg-background"
              aria-label={t('users.minPostsAriaLabel')}
            >
              <SelectValue>
                {t('users.minPostsOption', { count: minSalePosts })}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {MIN_POST_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {t('users.minPostsOption', { count: option })}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={
              activeWithinDays ? String(activeWithinDays) : ACTIVE_ANY_VALUE
            }
            onValueChange={(value) =>
              onActiveWithinDaysChange(
                !value || value === ACTIVE_ANY_VALUE
                  ? null
                  : Number.parseInt(value, 10),
              )
            }
          >
            <SelectTrigger
              size="sm"
              className="w-[8.75rem] bg-background"
              aria-label={t('users.activeWithinAriaLabel')}
            >
              <SelectValue>
                {getActiveWithinLabel(t, activeWithinDays)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ACTIVE_WITHIN_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.days === null
                      ? t('users.anyTime')
                      : t('users.activeWithinDays', { count: option.days })}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
            >
              <X data-icon="inline-start" />
              {t('users.clear')}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function getActiveWithinLabel(
  t: ReturnType<typeof useTranslations<'feed'>>,
  value: number | null,
) {
  return value ? t('users.lastDays', { count: value }) : t('users.anyTime');
}

interface MlsSellersTableProps {
  sellers: MlsSellerDirectoryRow[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | undefined;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

function MlsSellersTable({
  sellers,
  sorting,
  onSortingChange,
  isLoading,
  isError,
  errorMessage,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: MlsSellersTableProps) {
  const t = useTranslations('feed');
  const tCommon = useTranslations('common');
  const columns = useMlsSellerColumns();
  const table = useReactTable({
    data: sellers,
    columns,
    state: { sorting },
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableSortingRemoval: false,
    sortDescFirst: true,
  });
  const rows = table.getRowModel().rows;
  const virtualRows = useMlsVirtualRows({
    itemCount: rows.length,
    rowHeight: SELLER_TABLE_ROW_HEIGHT,
    onNearEnd: useCallback(() => {
      if (hasNextPage && !isFetchingNextPage) {
        onLoadMore();
      }
    }, [hasNextPage, isFetchingNextPage, onLoadMore]),
  });
  const visibleRows = rows.slice(virtualRows.startIndex, virtualRows.endIndex);
  const topSpacerHeight = virtualRows.offsetTop;
  const bottomSpacerHeight =
    (rows.length - virtualRows.endIndex) * SELLER_TABLE_ROW_HEIGHT;
  const columnCount = table.getAllLeafColumns().length;

  return (
    <section className="overflow-hidden rounded-lg border border-border/70 bg-background">
      <div
        ref={virtualRows.containerRef}
        className="h-[min(44rem,calc(100vh-17rem))] min-h-[26rem] overflow-auto"
      >
        <Table className="min-w-[56rem]">
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={getSellerTableHeadClassName(header.column.id)}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <MlsSellersSkeletonRows columnCount={columnCount} />
            ) : null}

            {isError && rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-28 text-center text-destructive"
                >
                  {errorMessage}
                </TableCell>
              </TableRow>
            ) : null}

            {!isLoading && !isError && rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-28 text-center text-muted-foreground"
                >
                  {t('users.emptyThreshold')}
                </TableCell>
              </TableRow>
            ) : null}

            {topSpacerHeight > 0 ? (
              <TableRow aria-hidden="true">
                <TableCell
                  colSpan={columnCount}
                  className="p-0"
                  style={{ height: topSpacerHeight }}
                />
              </TableRow>
            ) : null}

            {visibleRows.map((row) => (
              <TableRow
                key={row.id}
                className="h-[72px]"
                style={{ height: SELLER_TABLE_ROW_HEIGHT }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={getSellerTableCellClassName(cell.column.id)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {bottomSpacerHeight > 0 ? (
              <TableRow aria-hidden="true">
                <TableCell
                  colSpan={columnCount}
                  className="p-0"
                  style={{ height: bottomSpacerHeight }}
                />
              </TableRow>
            ) : null}

            {isError && rows.length > 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-14 text-center text-destructive"
                >
                  {errorMessage}
                </TableCell>
              </TableRow>
            ) : null}

            {isFetchingNextPage ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-14 text-center text-muted-foreground"
                >
                  <Loader2 className="me-2 inline size-4 animate-spin" />
                  {t('users.loadingMore')}
                </TableCell>
              </TableRow>
            ) : null}

            {hasNextPage && !isFetchingNextPage && rows.length > 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-14 text-center">
                  <Button type="button" variant="ghost" onClick={onLoadMore}>
                    {tCommon('actions.loadMore')}
                  </Button>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function useMlsSellerColumns() {
  const t = useTranslations('feed');

  return useMemo<ColumnDef<MlsSellerDirectoryRow>[]>(
    () => [
      {
        id: 'seller',
        header: t('users.columns.user'),
        cell: ({ row }) => <SellerIdentityCell seller={row.original} />,
        enableSorting: false,
      },
      {
        id: 'domains',
        accessorFn: (seller) => seller.domainCount,
        header: ({ column }) => (
          <SellerSortableHeader
            column={column}
            label={t('users.columns.domains')}
          />
        ),
        cell: ({ row }) => (
          <SellerMetricCell
            value={row.original.domainCount}
            detail={t('users.domainsPerPost', {
              count: formatDecimal(row.original.domainsPerPost),
            })}
          />
        ),
      },
      {
        id: 'cadence',
        accessorFn: (seller) => seller.postsPerWeek,
        header: ({ column }) => (
          <SellerSortableHeader
            column={column}
            label={t('users.columns.cadence')}
          />
        ),
        cell: ({ row }) => (
          <SellerMetricCell
            value={formatDecimal(row.original.postsPerWeek)}
            detail={t('users.postsPerWeek')}
          />
        ),
      },
      {
        id: 'recent',
        accessorFn: (seller) => seller.lastPostedAt,
        header: ({ column }) => (
          <SellerSortableHeader
            column={column}
            label={t('users.columns.lastPost')}
          />
        ),
        cell: ({ row }) => (
          <SellerMetricCell
            value={formatDaysAgo(t, row.original.daysSinceLastPost)}
            detail={formatShortDate(t, row.original.lastPostedAt)}
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => <SellerActionsCell seller={row.original} />,
        enableSorting: false,
      },
    ],
    [t],
  );
}

function SellerSortableHeader({
  column,
  label,
}: {
  column: Column<MlsSellerDirectoryRow, unknown>;
  label: string;
}) {
  const sorted = column.getIsSorted();
  const SortIcon =
    sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="ms-auto h-8 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase hover:text-foreground"
      onClick={column.getToggleSortingHandler()}
    >
      {label}
      <SortIcon
        data-icon="inline-end"
        className={cn(sorted && 'text-primary')}
      />
    </Button>
  );
}

function SellerIdentityCell({ seller }: { seller: MlsSellerDirectoryRow }) {
  const t = useTranslations('feed');
  const namefiDomainsCount = seller.namefiDomainsCount ?? 0;
  const sellerTier = getMlsSellerTier(
    seller.tierDomainCount ?? seller.domainCount,
  );

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
          {seller.source.label}
        </span>
        <Link
          href={seller.listingUrl as Route}
          className="min-w-0 truncate font-medium text-foreground transition-colors hover:text-primary hover:underline"
        >
          {seller.handle}
        </Link>
        {sellerTier ? <MlsSellerTierBadge tier={sellerTier} /> : null}
      </div>
      {seller.displayName || namefiDomainsCount > 0 ? (
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {[
            seller.displayName,
            namefiDomainsCount > 0
              ? t('users.namefiOwned', { count: namefiDomainsCount })
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      ) : null}
    </div>
  );
}

function SellerMetricCell({
  value,
  detail,
}: {
  value: number | string;
  detail: string;
}) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="font-medium text-foreground">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </div>
  );
}

function SellerActionsCell({ seller }: { seller: MlsSellerDirectoryRow }) {
  const t = useTranslations('feed');

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={seller.listingUrl as Route}
        className={buttonVariants({ variant: 'secondary', size: 'xs' })}
      >
        {t('users.listings')}
      </Link>
      <a
        href={seller.latestSourceTweetUrl}
        target="_blank"
        rel="noreferrer noopener"
        className={buttonVariants({ variant: 'outline', size: 'xs' })}
      >
        <ExternalLink data-icon="inline-start" />
        {t('users.post')}
      </a>
      <a
        href={seller.profileUrl}
        target="_blank"
        rel="noreferrer noopener"
        className={buttonVariants({ variant: 'ghost', size: 'xs' })}
      >
        {seller.source.label}
      </a>
    </div>
  );
}

function getSellerTableHeadClassName(columnId: string) {
  return cn(
    'bg-background px-3 text-xs text-muted-foreground uppercase',
    columnId === 'seller' && 'min-w-[22rem] ps-4',
    ['domains', 'cadence', 'recent'].includes(columnId) &&
      'w-[8.5rem] text-end',
    columnId === 'actions' && 'w-[13rem] pe-4 text-end',
  );
}

function getSellerTableCellClassName(columnId: string) {
  return cn(
    'h-[72px] px-3 py-2',
    columnId === 'seller' && 'max-w-[24rem] ps-4',
    ['domains', 'cadence', 'recent'].includes(columnId) && 'text-end',
    columnId === 'actions' && 'pe-4 text-end',
  );
}

interface MlsVirtualRowsConfig {
  itemCount: number;
  rowHeight: number;
  onNearEnd: () => void;
}

function useMlsVirtualRows({
  itemCount,
  rowHeight,
  onNearEnd,
}: MlsVirtualRowsConfig) {
  const nearEndCallbackRef = useRef(onNearEnd);
  const [containerElement, setContainerElement] = useState<HTMLElement | null>(
    null,
  );
  const [range, setRange] = useState({ startIndex: 0, endIndex: 0 });

  useEffect(() => {
    nearEndCallbackRef.current = onNearEnd;
  }, [onNearEnd]);

  const updateRange = useCallback(() => {
    if (!containerElement) {
      setRange({ startIndex: 0, endIndex: Math.min(itemCount, 12) });
      return;
    }

    const { scrollTop, clientHeight, scrollHeight } = containerElement;
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / rowHeight) - VIRTUAL_OVERSCAN_ROWS,
    );
    const endIndex = Math.min(
      itemCount,
      Math.ceil((scrollTop + clientHeight) / rowHeight) + VIRTUAL_OVERSCAN_ROWS,
    );

    setRange((current) =>
      current.startIndex === startIndex && current.endIndex === endIndex
        ? current
        : { startIndex, endIndex },
    );

    if (scrollHeight - (scrollTop + clientHeight) < rowHeight * 5) {
      nearEndCallbackRef.current();
    }
  }, [containerElement, itemCount, rowHeight]);

  useEffect(() => {
    if (!containerElement) {
      updateRange();
      return;
    }

    updateRange();
    containerElement.addEventListener('scroll', updateRange, {
      passive: true,
    });

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(updateRange);
    resizeObserver?.observe(containerElement);

    return () => {
      containerElement.removeEventListener('scroll', updateRange);
      resizeObserver?.disconnect();
    };
  }, [containerElement, updateRange]);

  return {
    containerRef: setContainerElement,
    startIndex: range.startIndex,
    endIndex: range.endIndex,
    offsetTop: range.startIndex * rowHeight,
    totalHeight: itemCount * rowHeight,
  };
}

function MlsSellersSkeletonRows({ columnCount }: { columnCount: number }) {
  return (
    <>
      {SKELETON_KEYS.map((key) => (
        <TableRow
          key={key}
          className="h-[72px]"
          style={{ height: SELLER_TABLE_ROW_HEIGHT }}
        >
          <TableCell colSpan={columnCount} className="px-4 py-3">
            <div className="grid grid-cols-[minmax(16rem,1fr)_repeat(3,7rem)_11rem] items-center gap-4">
              <div className="flex min-w-0 flex-col gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-8 w-16 justify-self-end" />
              <Skeleton className="h-8 w-16 justify-self-end" />
              <Skeleton className="h-8 w-16 justify-self-end" />
              <Skeleton className="h-8 w-28 justify-self-end" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
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

async function fetchAllMatchingSellerRows(
  trpcClient: ReturnType<typeof useTRPCClient>,
  filters: AppliedMlsSellerDirectoryFilters,
) {
  const rows: MlsSellerDirectoryRow[] = [];
  let cursor: string | null = null;
  let pageCount = 0;

  do {
    const page: MlsSellerDirectoryPage = await trpcClient.mls.getSellers.query({
      limit: MAX_MLS_FEED_LIMIT,
      cursor,
      query: filters.searchQuery,
      tld: null,
      minSalePosts: filters.minSalePosts,
      activeWithinDays: filters.activeWithinDays,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });

    rows.push(...page.rows);
    cursor = page.nextCursor;
    pageCount += 1;

    if (pageCount > 200) {
      throw new Error('CSV export exceeded the maximum page count.');
    }
  } while (cursor);

  return rows;
}

function downloadMlsSellerDirectoryCsv(
  rows: MlsSellerDirectoryRow[],
  filters: AppliedMlsSellerDirectoryFilters,
) {
  const csv = buildMlsSellerDirectoryCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = buildMlsSellerDirectoryCsvFilename(filters);
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildMlsSellerDirectoryCsv(rows: MlsSellerDirectoryRow[]) {
  return [
    CSV_HEADERS.join(','),
    ...rows.map((row) =>
      CSV_HEADERS.map((header) =>
        escapeCsvCell(getMlsSellerDirectoryCsvValue(row, header)),
      ).join(','),
    ),
  ].join('\r\n');
}

function getMlsSellerDirectoryCsvValue(
  row: MlsSellerDirectoryRow,
  header: (typeof CSV_HEADERS)[number],
) {
  switch (header) {
    case 'handle':
      return row.handle;
    case 'source':
      return row.source.id;
    case 'display_name':
      return row.displayName ?? '';
    case 'profile_url':
      return row.profileUrl;
    case 'listing_url':
      return row.listingUrl;
    case 'sale_post_count':
      return String(row.salePostCount);
    case 'domain_count':
      return String(row.domainCount);
    case 'namefi_domains_count':
      return String(row.namefiDomainsCount ?? 0);
    case 'tier_domain_count':
      return String(row.tierDomainCount ?? row.domainCount);
    case 'posts_per_week':
      return String(row.postsPerWeek);
    case 'domains_per_post':
      return String(row.domainsPerPost);
    case 'purchase_url_count':
      return String(row.purchaseUrlCount);
    case 'days_since_last_post':
      return String(row.daysSinceLastPost);
    case 'active_days':
      return String(row.activeDays);
    case 'first_posted_at':
      return row.firstPostedAt;
    case 'last_posted_at':
      return row.lastPostedAt;
    case 'latest_source_tweet_url':
      return row.latestSourceTweetUrl;
    case 'sample_domains':
      return row.sampleDomains.join('; ');
    case 'source_tweet_urls':
      return row.sourceTweetUrls.join('; ');
  }
}

function escapeCsvCell(value: string) {
  const normalized = CSV_FORMULA_RE.test(value.trimStart())
    ? `'${value}`
    : value;

  if (!CSV_ESCAPE_RE.test(normalized)) {
    return normalized;
  }

  return `"${normalized.replaceAll('"', '""')}"`;
}

function buildMlsSellerDirectoryCsvFilename(
  filters: AppliedMlsSellerDirectoryFilters,
) {
  const parts = [
    'namefi-feed-users',
    `sort-${filters.sortBy}-${filters.sortOrder}`,
    `minposts-${filters.minSalePosts}`,
    `active-${filters.activeWithinDays ?? 'any'}`,
    `search-${filters.searchQuery ? toFilenamePart(filters.searchQuery) : 'all'}`,
    new Date().toISOString().slice(0, 10),
  ];

  return `${parts.map(toFilenamePart).join('_')}.csv`;
}

function toFilenamePart(value: string | number) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function formatDaysAgo(
  t: ReturnType<typeof useTranslations<'feed'>>,
  daysSinceLastPost: number,
) {
  if (daysSinceLastPost === 0) {
    return t('users.today');
  }

  return t('users.daysAgo', { count: daysSinceLastPost });
}

function formatDecimal(value: number) {
  return value.toLocaleString([], {
    maximumFractionDigits: 1,
  });
}

function formatShortDate(
  t: ReturnType<typeof useTranslations<'feed'>>,
  value: string,
) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t('users.unknownDate');
  }

  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  });
}

function formatGeneratedAt(value: string) {
  const generatedAt = new Date(value);
  if (Number.isNaN(generatedAt.getTime())) {
    return 'just now';
  }

  return generatedAt.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}
