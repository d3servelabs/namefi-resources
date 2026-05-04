'use client';

import { PermissionGate } from '@/components/access/PermissionGate';
import { AdminGuard } from '@/components/admin/admin-guard';
import { PageShell } from '@/components/page-shell';
import { useTRPC } from '@/lib/trpc';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { Permission } from '@namefi-astra/utils/permissions';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useDebounceValue } from 'usehooks-ts';
import { DetailsSection } from './detail-tables';
import { GlobalFiltersCard } from './global-filters-card';
import { FinancialCharts, SummaryCards } from './overview';
import type {
  DateRangeInput,
  ExportRequest,
  FinancialSummary,
  GlobalFilters,
  PageTab,
  TableMode,
} from './types';
import {
  compactObject,
  countActiveFilters,
  downloadExport,
  getDefaultDateRange,
} from './utils';

export function FinancialsPage() {
  return (
    <AdminGuard>
      <PermissionGate
        permissions={[
          Permission.READ_ANALYTICS,
          Permission.READ_ORDERS,
          Permission.READ_USERS,
        ]}
        permissionsMode="every"
      >
        <FinancialsPageContent />
      </PermissionGate>
    </AdminGuard>
  );
}

function FinancialsPageContent() {
  const trpc = useTRPC();
  const [activeTab, setActiveTab] = useState<PageTab>('overview');
  const [activeMode, setActiveMode] = useState<TableMode>('orderItemsByOrder');
  const [dateRange, setDateRange] =
    useState<DateRangeInput>(getDefaultDateRange);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderStatus, setOrderStatus] =
    useState<GlobalFilters['orderStatus']>();
  const [autoRenew, setAutoRenew] = useState<boolean>();
  const [legacyBackfilled, setLegacyBackfilled] = useState<boolean>();
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 400);

  const globalFilters = useMemo<GlobalFilters>(
    () =>
      compactObject({
        searchTerm: debouncedSearchTerm.trim() || undefined,
        orderStatus,
        autoRenew,
        legacyBackfilled,
      }),
    [debouncedSearchTerm, orderStatus, autoRenew, legacyBackfilled],
  );

  const summaryQuery = useQuery(
    trpc.admin.financials.getSummary.queryOptions(
      {
        dateRange,
        globalFilters,
      },
      {
        placeholderData: (previous) => previous,
        trpc: { context: { skipBatch: true } },
      },
    ),
  );

  const exportMutation = useMutation(
    trpc.admin.financials.exportData.mutationOptions({
      onSuccess: (data) => {
        downloadExport(data);
        toast.success('Export ready', {
          description: data.fileName,
        });
      },
      onError: (error) => {
        toast.error('Export failed', {
          description: error.message,
        });
      },
    }),
  );

  const summary = summaryQuery.data as FinancialSummary | undefined;
  const globalFilterCount = countActiveFilters(globalFilters);

  const handleResetGlobalFilters = () => {
    setSearchTerm('');
    setOrderStatus(undefined);
    setAutoRenew(undefined);
    setLegacyBackfilled(undefined);
  };

  const handleExport = (request: ExportRequest) => {
    exportMutation.mutate({
      ...request,
      dateRange,
      globalFilters,
    });
  };

  return (
    <PageShell padding="admin" className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financials</h1>
          <p className="text-muted-foreground mt-1">
            Review order, payment, refund, and revenue data by order creation
            date.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => summaryQuery.refetch()}
          disabled={summaryQuery.isFetching}
          className="w-fit"
        >
          {summaryQuery.isFetching ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Summary
        </Button>
      </div>

      <GlobalFiltersCard
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        searchTerm={searchTerm}
        orderStatus={orderStatus}
        autoRenew={autoRenew}
        legacyBackfilled={legacyBackfilled}
        activeFilterCount={globalFilterCount}
        onSearchTermChange={setSearchTerm}
        onOrderStatusChange={setOrderStatus}
        onAutoRenewChange={setAutoRenew}
        onLegacyBackfilledChange={setLegacyBackfilled}
        onReset={handleResetGlobalFilters}
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as PageTab)}
      >
        <TabsList className="w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
      </Tabs>

      <div hidden={activeTab !== 'overview'} className="space-y-6">
        <SummaryCards
          summary={summary}
          isLoading={summaryQuery.isLoading}
          isFetching={summaryQuery.isFetching}
        />
        <FinancialCharts
          summary={summary}
          isLoading={summaryQuery.isLoading}
          isFetching={summaryQuery.isFetching}
        />
      </div>

      <div hidden={activeTab !== 'details'}>
        <DetailsSection
          active={activeTab === 'details'}
          activeMode={activeMode}
          onActiveModeChange={setActiveMode}
          dateRange={dateRange}
          globalFilters={globalFilters}
          onExport={handleExport}
          isExporting={exportMutation.isPending}
        />
      </div>
    </PageShell>
  );
}
