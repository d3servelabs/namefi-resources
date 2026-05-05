'use client';

import {
  convertToDrizzlerFilterOptions,
  useDrizzlerServerFilterStrategy,
} from '@/components/table/filters/strategies/drizzler-server-filter-strategy';
import type { DrizzlerFilterState } from '@/components/table/filters/types';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import type { ExpandedState, SortingState } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import type {
  DateRangeInput,
  GlobalFilters,
  TableControlsParams,
} from './types';
import { toBackendSorting } from './utils';

export function useFinancialTableControls<
  Data extends Record<string, unknown>,
>({
  tableId,
  defaultSorting,
  defaultColumnVisibility,
  filterConfig,
}: TableControlsParams) {
  const [page, setPage] = useState(1);
  const [drizzlerFilterState, setDrizzlerFilterState] =
    useState<DrizzlerFilterState>({ columnFilters: {}, customFilters: {} });
  const [debouncedDrizzlerFilterState] = useDebounceValue(
    drizzlerFilterState,
    500,
  );
  const {
    preferences: { sorting, pageSize, columnVisibility },
    setSorting,
    setPageSize,
    setColumnVisibility,
    resetToDefaults,
  } = useTablePreferences({
    tableId,
    defaultPreferences: {
      sorting: defaultSorting,
      pageSize: 25,
      columnVisibility: defaultColumnVisibility ?? {},
    },
  });

  const backendFilters = useMemo(
    () =>
      convertToDrizzlerFilterOptions<Data>(
        debouncedDrizzlerFilterState.columnFilters,
      ),
    [debouncedDrizzlerFilterState],
  );
  const backendSorting = useMemo(() => toBackendSorting(sorting), [sorting]);
  const filterStrategy = useDrizzlerServerFilterStrategy<Data>({
    filterConfig,
    onDrizzlerFilterChange: (next) => {
      setDrizzlerFilterState(next);
      setPage(1);
    },
  });

  return {
    page,
    setPage,
    pageSize,
    sorting,
    columnVisibility,
    setColumnVisibility,
    resetToDefaults,
    backendFilters,
    backendSorting,
    filterStrategy,
    handlePageSizeChange: (nextPageSize: number) => {
      setPage(1);
      setPageSize(nextPageSize);
    },
    handleSortingChange: (nextSorting: SortingState) => {
      setPage(1);
      setSorting(nextSorting);
    },
  };
}

export function useFirstOrderGroupExpansion<Data extends { orderId: string }>(
  rows: Data[],
  groupByOrder: boolean,
) {
  const initialExpanded = useMemo<ExpandedState>(() => {
    if (!groupByOrder || rows.length === 0) return {};
    return { [`orderId:${rows[0].orderId}`]: true };
  }, [rows, groupByOrder]);

  const [expanded, setExpanded] = useState<ExpandedState>(initialExpanded);

  return { expanded, setExpanded };
}

export function useResetPageOnGlobalInputChange(
  setPage: (page: number) => void,
  dateRange: DateRangeInput,
  globalFilters: GlobalFilters,
) {
  const resetKey = `${dateRange.startDate}|${dateRange.endDate}|${globalFilters.searchTerm ?? ''}|${JSON.stringify(globalFilters.filterOptions ?? '')}`;

  useEffect(() => {
    if (resetKey.length > 0) {
      setPage(1);
    }
  }, [setPage, resetKey]);
}
