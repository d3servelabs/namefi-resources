'use client';

import { useTRPC } from '@/lib/trpc';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  buildOrderColumns,
  buildOrderItemColumns,
  buildPaymentColumns,
  OrderExpandedContent,
  renderOrderItemGroupHeader,
  renderPaymentGroupHeader,
} from './columns';
import {
  orderFilterConfig,
  orderItemFilterConfig,
  paymentFilterConfig,
  tableModeLabels,
} from './constants';
import { GroupByOrderToggle, FinancialTableCard } from './table-shell';
import {
  useFinancialTableControls,
  useFirstOrderGroupExpansion,
  useResetPageOnGlobalInputChange,
} from './table-controls';
import type {
  DetailTableProps,
  FinancialOrderItemRow,
  FinancialOrderRow,
  FinancialPaymentRow,
  TableMode,
} from './types';
import {
  normalizeOrderItemRows,
  normalizeOrderRows,
  normalizePaymentRows,
} from './utils';

export function DetailsSection({
  active,
  activeMode,
  onActiveModeChange,
  dateRange,
  globalFilters,
  onExport,
  isExporting,
}: DetailTableProps & {
  activeMode: TableMode;
  onActiveModeChange: (mode: TableMode) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Financial Detail
          </CardTitle>
          <CardDescription>
            Each table keeps its own table filters, sorting, column visibility,
            page size, and export input.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeMode}
            onValueChange={(value) => onActiveModeChange(value as TableMode)}
          >
            <TabsList className="flex h-auto flex-wrap justify-start">
              <TabsTrigger value="orderItemsByOrder">
                OrderItems Grouped by Order
              </TabsTrigger>
              <TabsTrigger value="paymentsByOrder">
                Payments Grouped by Order
              </TabsTrigger>
              <TabsTrigger value="ordersWithItems">
                Orders With OrderItems and Payments
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div hidden={activeMode !== 'orderItemsByOrder'}>
        <OrderItemsByOrderTable
          active={active && activeMode === 'orderItemsByOrder'}
          dateRange={dateRange}
          globalFilters={globalFilters}
          onExport={onExport}
          isExporting={isExporting}
        />
      </div>
      <div hidden={activeMode !== 'paymentsByOrder'}>
        <PaymentsByOrderTable
          active={active && activeMode === 'paymentsByOrder'}
          dateRange={dateRange}
          globalFilters={globalFilters}
          onExport={onExport}
          isExporting={isExporting}
        />
      </div>
      <div hidden={activeMode !== 'ordersWithItems'}>
        <OrdersWithItemsTable
          active={active && activeMode === 'ordersWithItems'}
          dateRange={dateRange}
          globalFilters={globalFilters}
          onExport={onExport}
          isExporting={isExporting}
        />
      </div>
    </div>
  );
}

function OrderItemsByOrderTable({
  active,
  dateRange,
  globalFilters,
  onExport,
  isExporting,
}: DetailTableProps) {
  const trpc = useTRPC();
  const [groupByOrder, setGroupByOrder] = useState(true);
  const controls = useFinancialTableControls<FinancialOrderItemRow>({
    tableId: 'admin-financials-order-items-by-order',
    defaultSorting: [{ id: 'orderCreatedAt', desc: true }],
    defaultColumnVisibility: {
      orderItemId: false,
      userId: false,
      nftWalletAddress: false,
    },
    filterConfig: orderItemFilterConfig,
  });

  useResetPageOnGlobalInputChange(controls.setPage, dateRange, globalFilters);

  const queryInput = useMemo(
    () => ({
      page: controls.page,
      pageSize: controls.pageSize,
      dateRange,
      globalFilters,
      tableFilters: controls.backendFilters,
      sorting: controls.backendSorting,
    }),
    [
      controls.page,
      controls.pageSize,
      controls.backendFilters,
      controls.backendSorting,
      dateRange,
      globalFilters,
    ],
  );

  const query = useQuery(
    trpc.admin.financials.listOrderItemGroups.queryOptions(queryInput, {
      enabled: active,
      placeholderData: (previous) => previous,
      trpc: { context: { skipBatch: true } },
    }),
  );

  const rows = useMemo(
    () => normalizeOrderItemRows(query.data?.items ?? []),
    [query.data?.items],
  );
  const groupExpansion = useFirstOrderGroupExpansion(rows, groupByOrder);
  const grouping = useMemo(
    () => (groupByOrder ? ['orderId'] : undefined),
    [groupByOrder],
  );
  const columns = useMemo(() => buildOrderItemColumns(), []);

  return (
    <FinancialTableCard
      title={tableModeLabels.orderItemsByOrder}
      description="Each row is an order item. The table groups visible rows by order."
      total={query.data?.total ?? 0}
      isFetching={query.isFetching}
      onRefresh={() => query.refetch()}
      isExporting={isExporting}
      onExport={(formatType) =>
        onExport({
          mode: 'orderItemsByOrder',
          format: formatType,
          tableFilters: controls.backendFilters,
          sorting: controls.backendSorting,
        })
      }
    >
      <GroupByOrderToggle
        enabled={groupByOrder}
        onToggle={() => setGroupByOrder((current) => !current)}
      />
      <ExtensibleDataTable<
        FinancialOrderItemRow,
        typeof controls.filterStrategy
      >
        columns={columns}
        data={rows}
        filterStrategy={controls.filterStrategy}
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        page={controls.page}
        pageSize={controls.pageSize}
        totalPages={query.data?.totalPages ?? 1}
        totalCount={query.data?.total ?? 0}
        onPageChange={controls.setPage}
        onPageSizeChange={controls.handlePageSizeChange}
        sorting={controls.sorting}
        onSortingChange={controls.handleSortingChange}
        columnVisibility={controls.columnVisibility}
        onColumnVisibilityChange={controls.setColumnVisibility}
        onResetPreferences={controls.resetToDefaults}
        grouping={grouping}
        groupedColumnMode={false}
        renderGroupHeader={
          groupByOrder ? renderOrderItemGroupHeader : undefined
        }
        expanded={groupByOrder ? groupExpansion.expanded : undefined}
        onExpandedChange={groupByOrder ? groupExpansion.setExpanded : undefined}
        emptyMessage="No order items found"
        loadingMessage="Loading order items..."
      />
    </FinancialTableCard>
  );
}

function PaymentsByOrderTable({
  active,
  dateRange,
  globalFilters,
  onExport,
  isExporting,
}: DetailTableProps) {
  const trpc = useTRPC();
  const [groupByOrder, setGroupByOrder] = useState(true);
  const controls = useFinancialTableControls<FinancialPaymentRow>({
    tableId: 'admin-financials-payments-by-order',
    defaultSorting: [{ id: 'orderCreatedAt', desc: true }],
    defaultColumnVisibility: {
      paymentProviderReferenceId: false,
      userId: false,
      nftWalletAddress: false,
    },
    filterConfig: paymentFilterConfig,
  });

  useResetPageOnGlobalInputChange(controls.setPage, dateRange, globalFilters);

  const queryInput = useMemo(
    () => ({
      page: controls.page,
      pageSize: controls.pageSize,
      dateRange,
      globalFilters,
      tableFilters: controls.backendFilters,
      sorting: controls.backendSorting,
    }),
    [
      controls.page,
      controls.pageSize,
      controls.backendFilters,
      controls.backendSorting,
      dateRange,
      globalFilters,
    ],
  );

  const query = useQuery(
    trpc.admin.financials.listPaymentGroups.queryOptions(queryInput, {
      enabled: active,
      placeholderData: (previous) => previous,
      trpc: { context: { skipBatch: true } },
    }),
  );

  const rows = useMemo(
    () => normalizePaymentRows(query.data?.items ?? []),
    [query.data?.items],
  );
  const groupExpansion = useFirstOrderGroupExpansion(rows, groupByOrder);
  const grouping = useMemo(
    () => (groupByOrder ? ['orderId'] : undefined),
    [groupByOrder],
  );
  const columns = useMemo(() => buildPaymentColumns(), []);

  return (
    <FinancialTableCard
      title={tableModeLabels.paymentsByOrder}
      description="Each row is a payment. The table groups visible rows by order."
      total={query.data?.total ?? 0}
      isFetching={query.isFetching}
      onRefresh={() => query.refetch()}
      isExporting={isExporting}
      onExport={(formatType) =>
        onExport({
          mode: 'paymentsByOrder',
          format: formatType,
          tableFilters: controls.backendFilters,
          sorting: controls.backendSorting,
        })
      }
    >
      <GroupByOrderToggle
        enabled={groupByOrder}
        onToggle={() => setGroupByOrder((current) => !current)}
      />
      <ExtensibleDataTable<FinancialPaymentRow, typeof controls.filterStrategy>
        columns={columns}
        data={rows}
        filterStrategy={controls.filterStrategy}
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        page={controls.page}
        pageSize={controls.pageSize}
        totalPages={query.data?.totalPages ?? 1}
        totalCount={query.data?.total ?? 0}
        onPageChange={controls.setPage}
        onPageSizeChange={controls.handlePageSizeChange}
        sorting={controls.sorting}
        onSortingChange={controls.handleSortingChange}
        columnVisibility={controls.columnVisibility}
        onColumnVisibilityChange={controls.setColumnVisibility}
        onResetPreferences={controls.resetToDefaults}
        grouping={grouping}
        groupedColumnMode={false}
        renderGroupHeader={groupByOrder ? renderPaymentGroupHeader : undefined}
        expanded={groupByOrder ? groupExpansion.expanded : undefined}
        onExpandedChange={groupByOrder ? groupExpansion.setExpanded : undefined}
        emptyMessage="No payments found"
        loadingMessage="Loading payments..."
      />
    </FinancialTableCard>
  );
}

function OrdersWithItemsTable({
  active,
  dateRange,
  globalFilters,
  onExport,
  isExporting,
}: DetailTableProps) {
  const trpc = useTRPC();
  const controls = useFinancialTableControls<FinancialOrderRow>({
    tableId: 'admin-financials-orders-with-items',
    defaultSorting: [{ id: 'createdAt', desc: true }],
    defaultColumnVisibility: {
      userId: false,
      nftWalletAddress: false,
    },
    filterConfig: orderFilterConfig,
  });

  useResetPageOnGlobalInputChange(controls.setPage, dateRange, globalFilters);

  const queryInput = useMemo(
    () => ({
      page: controls.page,
      pageSize: controls.pageSize,
      dateRange,
      globalFilters,
      tableFilters: controls.backendFilters,
      sorting: controls.backendSorting,
    }),
    [
      controls.page,
      controls.pageSize,
      controls.backendFilters,
      controls.backendSorting,
      dateRange,
      globalFilters,
    ],
  );

  const query = useQuery(
    trpc.admin.financials.listOrdersWithItems.queryOptions(queryInput, {
      enabled: active,
      placeholderData: (previous) => previous,
      trpc: { context: { skipBatch: true } },
    }),
  );

  const rows = useMemo(
    () => normalizeOrderRows(query.data?.items ?? []),
    [query.data?.items],
  );
  const columns = useMemo(() => buildOrderColumns(), []);

  return (
    <FinancialTableCard
      title={tableModeLabels.ordersWithItems}
      description="Each row is an order. Expanded content shows order items and payments."
      total={query.data?.total ?? 0}
      isFetching={query.isFetching}
      onRefresh={() => query.refetch()}
      isExporting={isExporting}
      onExport={(formatType) =>
        onExport({
          mode: 'ordersWithItems',
          format: formatType,
          tableFilters: controls.backendFilters,
          sorting: controls.backendSorting,
        })
      }
    >
      <ExtensibleDataTable<FinancialOrderRow, typeof controls.filterStrategy>
        columns={columns}
        data={rows}
        filterStrategy={controls.filterStrategy}
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        page={controls.page}
        pageSize={controls.pageSize}
        totalPages={query.data?.totalPages ?? 1}
        totalCount={query.data?.total ?? 0}
        onPageChange={controls.setPage}
        onPageSizeChange={controls.handlePageSizeChange}
        sorting={controls.sorting}
        onSortingChange={controls.handleSortingChange}
        columnVisibility={controls.columnVisibility}
        onColumnVisibilityChange={controls.setColumnVisibility}
        onResetPreferences={controls.resetToDefaults}
        renderSubRow={(row) => <OrderExpandedContent order={row.original} />}
        getRowCanExpand={(row) =>
          row.original.items.length > 0 || row.original.payments.length > 0
        }
        emptyMessage="No orders found"
        loadingMessage="Loading orders..."
      />
    </FinancialTableCard>
  );
}
