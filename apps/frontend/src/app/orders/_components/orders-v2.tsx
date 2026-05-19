'use client';

import { AuthRequired } from '@/components/auth-required';
import { CartCard } from '@/components/cart-card';
import { PageShell } from '@/components/page-shell';
import type { DrizzlerFilterState } from '@/components/table/filters/types';
import {
  MobileTableEmpty,
  MobileTableList,
  MobileTableSkeleton,
} from '@/components/ui/mobile-table';
import { useAuth } from '@/hooks/use-auth';
import { getDomainForPoweredByNamefiThirdPartyOrigin } from '@/lib/origin/utils';
import { useTRPC } from '@/lib/trpc';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { useInfiniteQuery } from '@tanstack/react-query';
import { PackageX } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { OrderCard, type OrderCardOrder } from './order-card';
import {
  OrdersToolbar,
  type OrdersSortState,
  drizzlerStateToOrdersFilters,
} from './orders-toolbar';
import { NotificationsBell } from '@/components/notifications/notifications-bell';

const PAGE_SIZE = 25;

const EMPTY_DRIZZLER_STATE: DrizzlerFilterState = {
  columnFilters: {},
  customFilters: {},
};

const DEFAULT_SORT: OrdersSortState = {
  sortBy: 'date',
  sortDirection: 'desc',
};

export function OrdersPageV2() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  const currentPbnDomain = useMemo(
    () =>
      typeof window === 'undefined'
        ? null
        : getDomainForPoweredByNamefiThirdPartyOrigin(window.location.origin),
    [],
  );

  const [drizzlerState, setDrizzlerState] =
    useState<DrizzlerFilterState>(EMPTY_DRIZZLER_STATE);
  // Debounce the filter state — typing in a text condition shouldn't fire a
  // backend request on every keystroke.
  const [debouncedDrizzlerState] = useDebounceValue(drizzlerState, 300);

  const [sort, setSort] = useState<OrdersSortState>(DEFAULT_SORT);
  // On a PBN site, default to filtering items down to the current parent.
  // On the first-party site, "show all parents" is implicit and the toggle
  // isn't rendered.
  const [showAllParents, setShowAllParents] = useState(!currentPbnDomain);

  const derivedFilters = useMemo(
    () => drizzlerStateToOrdersFilters(debouncedDrizzlerState),
    [debouncedDrizzlerState],
  );

  const activeFilterCount = useMemo(() => {
    return Object.keys(debouncedDrizzlerState.columnFilters).length;
  }, [debouncedDrizzlerState]);

  const queryInput = useMemo(() => {
    const filters: Record<string, unknown> = {};
    if (derivedFilters.domainName)
      filters.domainName = derivedFilters.domainName;
    if (derivedFilters.orderStatuses)
      filters.orderStatuses = derivedFilters.orderStatuses;
    if (derivedFilters.orderId) filters.orderId = derivedFilters.orderId;
    if (derivedFilters.nftReceivingWalletAddress) {
      filters.nftReceivingWalletAddress =
        derivedFilters.nftReceivingWalletAddress;
    }
    if (derivedFilters.nftReceivingChainId !== undefined) {
      filters.nftReceivingChainId = derivedFilters.nftReceivingChainId;
    }
    return {
      sortBy: sort.sortBy,
      sortDirection: sort.sortDirection,
      limit: PAGE_SIZE,
      filters,
      // The backend reads the PBN parent from the request `Origin` and,
      // unless this is true, filters out orders with no items under that
      // parent. On first-party deployments this is a no-op.
      includeAllParents: showAllParents,
    };
  }, [derivedFilters, sort, showAllParents]);

  const infiniteOptions = trpc.orders.getMyOrders.infiniteQueryOptions(
    queryInput,
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialCursor: undefined as string | undefined,
    },
  );

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      ...infiniteOptions,
      enabled: isAuthenticated,
    });

  const orders = useMemo<OrderCardOrder[]>(
    () => (data?.pages ?? []).flatMap((page) => page.orders),
    [data],
  );
  // `totalCount` is the same on every page (it's a COUNT(*) OVER () from the
  // backend window pass), so the first page is the source of truth.
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const resetFilters = useCallback(() => {
    setDrizzlerState(EMPTY_DRIZZLER_STATE);
  }, []);

  const isPageLoading = isAuthLoading || (isAuthenticated && isLoading);

  if (!(isAuthenticated || isPageLoading)) {
    return <AuthRequired />;
  }

  return (
    <PageShell padding="default">
      <div className="my-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold font-mono">Order History</h1>
        </div>
        <OrdersToolbar
          drizzlerState={drizzlerState}
          onDrizzlerStateChange={setDrizzlerState}
          activeFilterCount={activeFilterCount}
          sort={sort}
          onSortChange={setSort}
          showPbnToggle={Boolean(currentPbnDomain)}
          showAllParents={showAllParents}
          onShowAllParentsChange={setShowAllParents}
          onReset={resetFilters}
        />
      </div>
      <div className="flex flex-col gap-4">
        {totalCount > 0 && (
          <div className="text-xs text-muted-foreground">
            Showing {orders.length} of {totalCount} order
            {totalCount === 1 ? '' : 's'}
          </div>
        )}

        {isPageLoading ? (
          <MobileTableSkeleton count={3} />
        ) : orders.length === 0 ? (
          <MobileTableEmpty
            icon={PackageX}
            title="No Orders Yet"
            description={
              currentPbnDomain && !showAllParents
                ? `No orders with ${currentPbnDomain} domains. Toggle "Show all parents" to see other orders.`
                : 'Your orders would appear here when placed.'
            }
          />
        ) : (
          <MobileTableList>
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                currentPbnDomain={currentPbnDomain}
                showAllParents={showAllParents}
              />
            ))}
          </MobileTableList>
        )}

        {hasNextPage && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Loading…' : 'Load more orders'}
            </Button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
