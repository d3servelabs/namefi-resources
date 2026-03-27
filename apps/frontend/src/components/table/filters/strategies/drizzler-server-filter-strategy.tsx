import { useCallback, useMemo, useState } from 'react';
import type {
  IFilterStrategy,
  FilterDisplayOptions,
  DrizzlerFilterFieldConfig,
  DrizzlerFilterState,
  SingleFilterState,
} from '../types';
import { DrizzlerFilterPanel } from '../components/drizzler-filter-panel';
import type { FilterOptions } from '@samyx/drizzler-filters-sorters';

type DrizzlerServerFilterStrategy<TData = any> = IFilterStrategy<
  TData,
  DrizzlerFilterFieldConfig,
  DrizzlerFilterState
>;

export function useDrizzlerServerFilterStrategy<TData = any>({
  filterConfig: columnsFilterConfig,
  filterDisplayOptions,
  customFilters,
  onDrizzlerFilterChange,
  getFieldSuggestions,
}: {
  filterConfig?: Record<string, DrizzlerFilterFieldConfig>;
  customFilters?: Record<string, DrizzlerFilterFieldConfig>;

  filterDisplayOptions?: FilterDisplayOptions;
  onDrizzlerFilterChange?: (filterState: DrizzlerFilterState) => void;
  /**
   * Optional callback to get dynamic suggestion options for a field based on current data
   */
  getFieldSuggestions?: (args: {
    fieldId: string;
    field: DrizzlerFilterFieldConfig;
    filterState: DrizzlerFilterState;
  }) => { value: string; label: string; type?: 'wallet' }[];
}): DrizzlerServerFilterStrategy<TData> {
  const [filterState, setFilterState] = useState<DrizzlerFilterState>({
    columnFilters: {},
    customFilters: {},
  });

  const activeFilterCount = useMemo(() => {
    return (
      Object.keys(filterState.columnFilters).length +
      Object.keys(filterState.customFilters).length
    );
  }, [filterState]);

  const _onFilterStateChange = useCallback(
    (newFilterState: DrizzlerFilterState) => {
      setFilterState(newFilterState);
      onDrizzlerFilterChange?.(newFilterState);
    },
    [onDrizzlerFilterChange],
  );
  const filterConfig = useMemo(() => {
    const configKeys = Object.keys(columnsFilterConfig ?? {});
    const customKeys = Object.keys(customFilters ?? {});
    const overlap = configKeys.filter((k) => customKeys.includes(k));
    if (overlap.length > 0) {
      console.warn(`Filter key collision detected: ${overlap.join(', ')}`);
    }
    return { ...columnsFilterConfig, ...customFilters };
  }, [columnsFilterConfig, customFilters]);

  const clearAllFilters = useCallback(() => {
    _onFilterStateChange({
      columnFilters: {},
      customFilters: {},
    });
  }, [_onFilterStateChange]);
  return {
    filterState,
    filterConfig,
    filterDisplayOptions,
    activeFilterCount,
    onFilterStateChange: _onFilterStateChange,
    getFieldSuggestions,
    clearAllFilters: useCallback(() => {
      _onFilterStateChange({
        columnFilters: {},
        customFilters: {},
      });
    }, [_onFilterStateChange]),

    renderFilterPanel: (props) => {
      return (
        <DrizzlerFilterPanel
          open={props.open}
          onOpenChange={props.onOpenChange}
          filterState={filterState}
          filterConfig={columnsFilterConfig ?? {}}
          customFiltersConfig={customFilters ?? {}}
          onFilterStateChange={_onFilterStateChange}
          onClearAll={clearAllFilters}
          getFieldSuggestions={getFieldSuggestions}
        />
      );
    },
  };
}

/**
 * Converts object-based filter state to Drizzler FilterOptions format
 * Sanitizes empty filters - skips filters with no valid conditions
 */
function convertToDrizzlerFilterOptions<T extends Record<string, unknown>>(
  columnFilters: Record<string, SingleFilterState>,
): FilterOptions<T> | undefined {
  const entries = Object.entries(columnFilters);

  if (entries.length === 0) {
    return undefined;
  }

  // Convert all filters and filter out undefined ones (empty filters)
  const convertedFilters = entries
    .map(([columnId, filterState]) =>
      convertSingleFilter<T>(columnId, filterState),
    )
    .filter((filter): filter is FilterOptions<T> => filter !== undefined);

  // If no valid filters after sanitization, return undefined
  if (convertedFilters.length === 0) {
    return undefined;
  }

  // Single filter - return as is
  if (convertedFilters.length === 1) {
    return convertedFilters[0];
  }

  // Multiple filters - wrap in ComplexFilterCondition with 'and' at top level
  return {
    operator: 'and',
    conditions: convertedFilters,
  } as FilterOptions<T>;
}

/**
 * Check if a value is considered empty
 */
function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/**
 * Unary operators that don't require a value
 */
const UNARY_OPERATORS = [
  'isNull',
  'isNotNull',
  'isnull',
  'not_isnull',
  'string_isempty',
  'not_string_isempty',
  'array_isempty',
  'not_array_isempty',
];

/**
 * Operators that should have % wildcards added for "contains" functionality
 */
const CONTAINS_OPERATORS = ['like', 'ilike', 'notLike', 'notIlike'];

/**
 * Process value based on operator type
 * - Adds % wildcards for like/ilike operators (contains functionality)
 * - Returns value as-is for other operators
 */
function processValueForOperator(operator: string, value: unknown): unknown {
  // Skip processing for unary operators
  if (UNARY_OPERATORS.includes(operator)) {
    return value;
  }

  // Add % wildcards for contains operators (like, ilike, notLike, notIlike)
  if (CONTAINS_OPERATORS.includes(operator) && typeof value === 'string') {
    // Only add wildcards if not already present
    const hasLeadingWildcard = value.startsWith('%');
    const hasTrailingWildcard = value.endsWith('%');

    if (!hasLeadingWildcard && !hasTrailingWildcard) {
      return `%${value}%`;
    }
  }

  return value;
}

/**
 * Converts a single filter to Drizzler format
 * - Sanitizes empty values (filters out conditions with empty values except unary operators)
 * - Adds % wildcards for like/ilike operators automatically
 */
function convertSingleFilter<T extends Record<string, unknown>>(
  columnId: string,
  filterState: SingleFilterState,
): FilterOptions<T> | undefined {
  const { conditions, operator } = filterState;

  // Filter out conditions with empty values (except unary operators)
  const validConditions = conditions.filter((condition) => {
    if (UNARY_OPERATORS.includes(condition.operator)) {
      return true; // Unary operators don't need values
    }
    return !isEmptyValue(condition.value);
  });

  // If no valid conditions, return undefined
  if (validConditions.length === 0) {
    return undefined;
  }

  // Process values based on operator type
  const processedConditions = validConditions.map((condition) => ({
    operator: condition.operator,
    value: processValueForOperator(condition.operator, condition.value),
  }));

  // Single condition - return as SimpleFilterCondition
  if (processedConditions.length === 1) {
    return {
      [columnId]: {
        [processedConditions[0].operator]: processedConditions[0].value,
      },
    } as FilterOptions<T>;
  }

  // Multiple conditions - wrap in ComplexFilterCondition
  return {
    operator,
    conditions: processedConditions.map((condition) => ({
      [columnId]: {
        [condition.operator]: condition.value,
      },
    })),
  } as FilterOptions<T>;
}
// Export helper function for external use
export { convertToDrizzlerFilterOptions, convertSingleFilter };
