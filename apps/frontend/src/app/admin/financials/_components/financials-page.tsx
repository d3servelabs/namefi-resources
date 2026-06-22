'use client';

import { PermissionGate } from '@/components/access/PermissionGate';
import { AdminGuard } from '@/components/admin/admin-guard';
import { PageShell } from '@/components/page-shell';
import { convertToDrizzlerFilterOptions } from '@/components/table/filters/strategies/drizzler-server-filter-strategy';
import type { DrizzlerFilterState } from '@/components/table/filters/types';
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
import { globalFilterConfig } from './constants';
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
import { compactObject, downloadExport, getDefaultDateRange } from './utils';

const emptyDrizzlerFilterState: DrizzlerFilterState = {
  columnFilters: {},
  customFilters: {},
};

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
  const [globalDrizzlerFilterState, setGlobalDrizzlerFilterState] =
    useState<DrizzlerFilterState>(emptyDrizzlerFilterState);
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 400);
  const [debouncedGlobalDrizzlerFilterState] = useDebounceValue(
    globalDrizzlerFilterState,
    500,
  );

  const globalFilterOptions = useMemo(
    () =>
      convertToDrizzlerFilterOptions<Record<string, unknown>>({
        ...debouncedGlobalDrizzlerFilterState.columnFilters,
        ...debouncedGlobalDrizzlerFilterState.customFilters,
      }),
    [debouncedGlobalDrizzlerFilterState],
  );

  const globalFilters = useMemo<GlobalFilters>(
    () =>
      compactObject({
        searchTerm: debouncedSearchTerm.trim() || undefined,
        filterOptions: globalFilterOptions,
      }),
    [debouncedSearchTerm, globalFilterOptions],
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
  const globalFilterCount =
    (searchTerm.trim() ? 1 : 0) +
    Object.keys(globalDrizzlerFilterState.columnFilters).length +
    Object.keys(globalDrizzlerFilterState.customFilters).length;

  const handleResetGlobalFilters = () => {
    setSearchTerm('');
    setGlobalDrizzlerFilterState(emptyDrizzlerFilterState);
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
          data-testid="admin.financials.refresh-summary"
        >
          {summaryQuery.isFetching ? (
            <Loader2 className="h-4 w-4 me-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 me-2" />
          )}
          Refresh Summary
        </Button>
      </div>

      <GlobalFiltersCard
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        searchTerm={searchTerm}
        filterState={globalDrizzlerFilterState}
        filterConfig={globalFilterConfig}
        activeFilterCount={globalFilterCount}
        onSearchTermChange={setSearchTerm}
        onFilterStateChange={setGlobalDrizzlerFilterState}
        onReset={handleResetGlobalFilters}
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as PageTab)}
      >
        <TabsList className="w-fit">
          <TabsTrigger
            value="overview"
            data-testid="admin.financials.tab.overview"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="details"
            data-testid="admin.financials.tab.details"
          >
            Details
          </TabsTrigger>
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
