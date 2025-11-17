import type { ReactNode, ComponentType } from 'react';
import type { ColumnDef, Row } from '@tanstack/react-table';
import type { FilterOperators } from '@samyx/drizzler-filters-sorters';

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

// Drizzler-specific types
export type DrizzlerFilterFieldConfig = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'array';
  allowedOperators?: FilterOperators[]; // undefined = all operators allowed
  maxConditions?: number; // undefined = unlimited conditions
  options?: { value: string; label: string }[];
  columnId: string; // SQL column name for buildWhereClause
  typeSpecificOptions?: {
    array?: {
      elementName?: {
        singular: string;
        plural: string;
      };
    };
  };
  operatorsCustomLabels?: Record<FilterOperators, string>;
};

// Alias for backward compatibility
export type DrizzlerFilterField = DrizzlerFilterFieldConfig;

export type DrizzlerFilterCondition = {
  operator: FilterOperators;
  value: unknown;
};

// Single filter state for one column/field
export type SingleFilterState = {
  operator: 'and' | 'or';
  conditions: DrizzlerFilterCondition[];
};

// Overall filter state using plain objects for clean separation
export type DrizzlerFilterState = {
  columnFilters: Record<string, SingleFilterState>; // columnId -> filter
  customFilters: Record<string, SingleFilterState>; // customId -> filter
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
