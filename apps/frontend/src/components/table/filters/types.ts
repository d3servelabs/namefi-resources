import type { ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

export type DefaultFilterField = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: { value: string; label: string }[];
  columnId?: string;
};

export type FilterDisplayOptions = {
  showInHeader?: boolean; // Show filters in column headers (default: true)
  showInPanel?: boolean; // Show filters in side panel (default: true)
};
export type DefaultSingleFilterState = {
  id: string;
  value: unknown;
};

export interface IFilterStrategy<
  TData = any,
  FilterField = any,
  FilterState = any,
> {
  filterState?: FilterState;
  onFilterStateChange: (filters: FilterState) => void;
  filterConfig: Record<string, FilterField>;
  filterDisplayOptions?: FilterDisplayOptions;
  activeFilterCount: number;
  clearAllFilters?: () => void;

  renderFilter?: (props: {
    columnId: string;
    columns: ColumnDef<TData, any>[];
    filterStrategy: Omit<
      IFilterStrategy<TData, FilterField, FilterState>,
      'renderFilter' | 'renderFilterPanel'
    >;
  }) => ReactNode;

  renderFilterPanel?: (props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filterStrategy: Omit<
      IFilterStrategy<TData, FilterField, FilterState>,
      'renderFilterPanel'
    >;
    columns: ColumnDef<TData, any>[];
  }) => ReactNode;
}
