import type {
  ColumnDef,
  SortingState,
  VisibilityState,
  Row,
  ColumnFiltersState,
  ColumnOrderState,
} from '@tanstack/react-table';
import type { ReactNode, Dispatch, SetStateAction } from 'react';

import { ExtensibleDataTable } from './extensible-data-table';
import { useBasicServerFilterStrategy } from './filters/strategies/basic-server-filter-strategy';

export type FilterConfig = {
  [columnId: string]: {
    type: 'text' | 'number' | 'date' | 'select';
    label?: string;
    options?: { value: string; label: string }[];
  };
};

type CustomFilterField = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  value?: string | number;
  onChange: (value: string | number | undefined) => void;
  onClear?: () => void;
};

type FilterDisplayOptions = {
  showInHeader?: boolean; // Show filters in column headers (default: true)
  showInPanel?: boolean; // Show filters in side panel (default: true)
};

type ServerDataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading?: boolean;
  isFetching?: boolean;

  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;

  // Sorting
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;

  // Global search
  searchTerm?: string;
  onSearchChange?: (search: string) => void;
  searchPlaceholder?: string;

  // Column filtering
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  filterConfig?: FilterConfig;
  filterDisplayOptions?: FilterDisplayOptions;
  customFilters?: CustomFilterField[];

  // Expansion
  renderSubRow?: (row: Row<TData>) => ReactNode;
  getRowCanExpand?: (row: Row<TData>) => boolean;

  // Custom rendering
  emptyMessage?: string;
  loadingMessage?: string;

  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: Dispatch<SetStateAction<VisibilityState>>;

  // Column ordering
  columnOrder?: ColumnOrderState;
  onColumnOrderChange?: Dispatch<SetStateAction<ColumnOrderState>>;
};

export function ServerDataTable<TData>({
  columnFilters,
  onColumnFiltersChange,
  filterConfig,
  filterDisplayOptions,
  customFilters,
  ...props
}: ServerDataTableProps<TData>) {
  const filterStrategy = useBasicServerFilterStrategy({
    columnFilters,
    filterConfig,
    filterDisplayOptions,
    onColumnFiltersChange,
    customFilters,
  });
  return <ExtensibleDataTable {...props} filterStrategy={filterStrategy} />;
}
