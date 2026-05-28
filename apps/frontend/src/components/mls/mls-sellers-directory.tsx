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
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
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
  type MlsSellerPriority,
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
const SELLER_TABLE_ROW_HEIGHT = 88;
const VIRTUAL_OVERSCAN_ROWS = 4;
const MIN_POST_OPTIONS = [1, 3, 5, 10, 20] as const;
const CSV_HEADERS = [
  'priority',
  'handle',
  'display_name',
  'profile_url',
  'listing_url',
  'sale_post_count',
  'domain_count',
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
  { label: 'Any time', value: ACTIVE_ANY_VALUE },
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
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
      toast.success('Twitter users CSV exported');
    } catch (csvError) {
      toast.error('Could not export Twitter users CSV', {
        description:
          csvError instanceof Error ? csvError.message : 'Please try again.',
      });
    } finally {
      setIsExportingCsv(false);
    }
  }, [filters, isExportingCsv, trpcClient]);

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
  const [sortBy, setSortBy] = useState<MlsSellerDirectorySortBy>('salePosts');
  const [sortOrder, setSortOrder] =
    useState<MlsSellerDirectorySortOrder>('desc');
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
        setSortBy('salePosts');
        setSortOrder('desc');
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
    setSortBy('salePosts');
    setSortOrder('desc');
  }, []);
  const hasVisibleFilters = Boolean(
    searchInput.trim() ||
      minSalePosts !== DEFAULT_USERS_MIN_POSTS ||
      activeWithinDays !== DEFAULT_USERS_ACTIVE_WITHIN_DAYS ||
      sortBy !== 'salePosts' ||
      sortOrder !== 'desc',
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
  return (
    <section className="border-border/70 border-b pb-4">
      <Link
        href="/feed"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to feed
      </Link>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Twitter users
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Loading users who post domain sale listings.'
              : `${total.toLocaleString()} matching users${generatedAt ? `, refreshed ${formatGeneratedAt(generatedAt)}` : ''}.`}
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
            Refresh
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
            Export CSV
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
  return (
    <section className="rounded-lg border border-border/70 bg-background">
      <div className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between">
        <div className="relative min-w-0 md:max-w-md md:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="mls-seller-search"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="Search handle, domain, or post text"
            className="h-9 bg-background pr-9 pl-9"
          />
          {searchInput ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="absolute top-1/2 right-2 -translate-y-1/2"
              aria-label="Clear search"
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
              aria-label="Minimum sale posts"
            >
              <SelectValue>{getMinPostsLabel(minSalePosts)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {MIN_POST_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {getMinPostsLabel(option)}
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
              aria-label="Active within"
            >
              <SelectValue>
                {getActiveWithinLabel(activeWithinDays)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ACTIVE_WITHIN_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
              Clear
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function getMinPostsLabel(value: number) {
  return `${value}+ posts`;
}

function getActiveWithinLabel(value: number | null) {
  return value ? `Last ${value}d` : 'Any time';
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
        <Table className="min-w-[68rem]">
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
                  No users match this threshold.
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
                className="h-[88px]"
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
                  <Loader2 className="mr-2 inline size-4 animate-spin" />
                  Loading more users
                </TableCell>
              </TableRow>
            ) : null}

            {hasNextPage && !isFetchingNextPage && rows.length > 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-14 text-center">
                  <Button type="button" variant="ghost" onClick={onLoadMore}>
                    Load more
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
  return useMemo<ColumnDef<MlsSellerDirectoryRow>[]>(
    () => [
      {
        id: 'seller',
        header: 'User',
        cell: ({ row }) => <SellerIdentityCell seller={row.original} />,
        enableSorting: false,
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={getPriorityBadgeClassName(row.original.priority)}
          >
            {row.original.priority}
          </Badge>
        ),
        enableSorting: false,
      },
      {
        id: 'salePosts',
        accessorFn: (seller) => seller.salePostCount,
        header: ({ column }) => (
          <SellerSortableHeader column={column} label="Sale posts" />
        ),
        cell: ({ row }) => (
          <SellerMetricCell
            value={row.original.salePostCount}
            detail={`${row.original.sourceTweetUrls.length.toLocaleString()} posts`}
          />
        ),
      },
      {
        id: 'domains',
        accessorFn: (seller) => seller.domainCount,
        header: ({ column }) => (
          <SellerSortableHeader column={column} label="Domains" />
        ),
        cell: ({ row }) => (
          <SellerMetricCell
            value={row.original.domainCount}
            detail={`${formatDecimal(row.original.domainsPerPost)} / post`}
          />
        ),
      },
      {
        id: 'cadence',
        accessorFn: (seller) => seller.postsPerWeek,
        header: ({ column }) => (
          <SellerSortableHeader column={column} label="Cadence" />
        ),
        cell: ({ row }) => (
          <SellerMetricCell
            value={formatDecimal(row.original.postsPerWeek)}
            detail="posts / week"
          />
        ),
      },
      {
        id: 'recent',
        accessorFn: (seller) => seller.lastPostedAt,
        header: ({ column }) => (
          <SellerSortableHeader column={column} label="Last post" />
        ),
        cell: ({ row }) => (
          <SellerMetricCell
            value={formatDaysAgo(row.original.daysSinceLastPost)}
            detail={formatShortDate(row.original.lastPostedAt)}
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
    [],
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
      className="ml-auto h-8 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase hover:text-foreground"
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
  const sampleDomains = seller.sampleDomains.slice(0, 3);
  const remainingDomains = Math.max(
    0,
    seller.domainCount - sampleDomains.length,
  );

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href={seller.listingUrl as Route}
          className="min-w-0 truncate font-medium text-foreground transition-colors hover:text-primary hover:underline"
        >
          {seller.handle}
        </Link>
        {seller.displayName ? (
          <span className="min-w-0 truncate text-xs text-muted-foreground">
            {seller.displayName}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        {sampleDomains.map((domain) => (
          <span
            key={domain}
            className="max-w-32 truncate rounded border border-border/70 bg-muted/30 px-1.5 py-0.5 font-mono"
          >
            {domain}
          </span>
        ))}
        {remainingDomains > 0 ? (
          <span className="shrink-0">+{remainingDomains.toLocaleString()}</span>
        ) : null}
      </div>
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
  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={seller.listingUrl as Route}
        className={buttonVariants({ variant: 'secondary', size: 'xs' })}
      >
        Listings
      </Link>
      <a
        href={seller.latestSourceTweetUrl}
        target="_blank"
        rel="noreferrer noopener"
        className={buttonVariants({ variant: 'outline', size: 'xs' })}
      >
        <ExternalLink data-icon="inline-start" />
        Post
      </a>
      <a
        href={seller.profileUrl}
        target="_blank"
        rel="noreferrer noopener"
        className={buttonVariants({ variant: 'ghost', size: 'xs' })}
      >
        X
      </a>
    </div>
  );
}

function getSellerTableHeadClassName(columnId: string) {
  return cn(
    'bg-background px-3 text-xs text-muted-foreground uppercase',
    columnId === 'seller' && 'min-w-[22rem] pl-4',
    columnId === 'priority' && 'w-[7rem]',
    ['salePosts', 'domains', 'cadence', 'recent'].includes(columnId) &&
      'w-[8.5rem] text-right',
    columnId === 'actions' && 'w-[13rem] pr-4 text-right',
  );
}

function getSellerTableCellClassName(columnId: string) {
  return cn(
    'h-[88px] px-3 py-2',
    columnId === 'seller' && 'max-w-[24rem] pl-4',
    ['salePosts', 'domains', 'cadence', 'recent'].includes(columnId) &&
      'text-right',
    columnId === 'actions' && 'pr-4 text-right',
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
          className="h-[88px]"
          style={{ height: SELLER_TABLE_ROW_HEIGHT }}
        >
          <TableCell colSpan={columnCount} className="px-4 py-3">
            <div className="grid grid-cols-[minmax(16rem,1fr)_5rem_repeat(4,7rem)_11rem] items-center gap-4">
              <div className="flex min-w-0 flex-col gap-2">
                <Skeleton className="h-4 w-36" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
              <Skeleton className="h-8 w-16 justify-self-end" />
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
    case 'priority':
      return row.priority;
    case 'handle':
      return row.handle;
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
    'namefi-twitter-users',
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

function formatDaysAgo(daysSinceLastPost: number) {
  if (daysSinceLastPost === 0) {
    return 'today';
  }

  return `${daysSinceLastPost}d`;
}

function formatDecimal(value: number) {
  return value.toLocaleString([], {
    maximumFractionDigits: 1,
  });
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'unknown';
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

function getPriorityBadgeClassName(priority: MlsSellerPriority) {
  switch (priority) {
    case 'P0':
      return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300';
    case 'P1':
      return 'border-amber-400/40 bg-amber-500/10 text-amber-300';
    case 'P2':
      return 'border-sky-400/40 bg-sky-500/10 text-sky-300';
  }
}
