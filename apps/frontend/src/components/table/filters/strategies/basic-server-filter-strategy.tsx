import type {
  IFilterStrategy,
  FilterDisplayOptions,
  DefaultSingleFilterState,
  DefaultFilterField,
} from '../types';
import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TableFilterPanel } from '../../table-filter-panel';
import type { CustomFilterField } from '..';
import type { ColumnFiltersState } from '@tanstack/react-table';
import type { FilterConfig } from '../../server-data-table-v2';
import { isNotNil } from 'ramda';

type BasicServerFilterStrategy<TData = any> = IFilterStrategy<
  TData,
  DefaultFilterField,
  DefaultSingleFilterState[]
>;

export function useBasicServerFilterStrategy<TData = any>({
  columnFilters,
  filterConfig: _filterConfig,
  filterDisplayOptions,
  onColumnFiltersChange,
  customFilters,
}: {
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  filterConfig?: FilterConfig;
  filterDisplayOptions?: FilterDisplayOptions;
  customFilters?: CustomFilterField[];
}): BasicServerFilterStrategy<TData> {
  const t = useTranslations('shared');
  const [filterState, setFilterState] = useState<DefaultSingleFilterState[]>(
    [],
  );

  const activeFilterCount = useMemo(() => {
    return filterState.length;
  }, [filterState]);

  const columnFiltersIds = useMemo(() => {
    return new Set(Object.keys(_filterConfig ?? {}));
  }, [_filterConfig]);

  const customFiltersIds = useMemo(() => {
    return new Set((customFilters ?? []).map((filter) => filter.id));
  }, [customFilters]);

  const filterConfig = useMemo(() => {
    const filters: Record<string, DefaultFilterField> = {};
    for (const filter of customFilters ?? []) {
      filters[filter.id] = {
        id: filter.id,
        type: filter.type,
        label: filter.label,
        options: filter.options,
      };
    }
    for (const filterKey in _filterConfig ?? {}) {
      const _filterConfigItem = _filterConfig?.[filterKey];
      filters[filterKey] = {
        id: filterKey,
        type: _filterConfigItem?.type ?? 'text',
        label: _filterConfigItem?.label ?? filterKey,
        options: _filterConfigItem?.options,
        columnId: filterKey,
      };
    }
    return filters;
  }, [_filterConfig, customFilters]);

  const _onFilterStateChange = useCallback(
    (filterState: DefaultSingleFilterState[]) => {
      setFilterState(filterState ?? []);

      const newColumnFilters = filterState.filter((filter) =>
        columnFiltersIds.has(filter.id),
      );
      onColumnFiltersChange?.(newColumnFilters ?? []);

      // Update custom filters
      if (customFiltersIds.size > 0) {
        const newCustomFiltersStates = filterState.filter((filter) =>
          customFiltersIds.has(filter.id),
        );
        const newCustomFiltersStatesMap = new Map(
          newCustomFiltersStates.map((filter) => [filter.id, filter]),
        );

        for (const customFilter of customFilters ?? []) {
          const _value = newCustomFiltersStatesMap.get(customFilter.id)?.value;
          customFilter.onChange?.(
            typeof _value === 'number' ? _value : _value?.toString(),
          );
        }
      }
    },
    [columnFiltersIds, customFiltersIds, onColumnFiltersChange, customFilters],
  );

  return {
    filterState,
    filterConfig,
    filterDisplayOptions,
    activeFilterCount,
    onFilterStateChange: _onFilterStateChange,
    clearAllFilters: useCallback(() => {
      _onFilterStateChange([]);
    }, [_onFilterStateChange]),

    renderFilter: ({ columnId, columns, filterStrategy }) => {
      return <div>{t('table.filter.label')}</div>;
    },

    renderFilterPanel: (props) => {
      return <BasicServerFilterPanel {...props} />;
    },
  };
}

function BasicServerFilterPanel(
  props: Parameters<
    NonNullable<BasicServerFilterStrategy['renderFilterPanel']>
  >[0],
) {
  const { filterState, filterConfig, onFilterStateChange } =
    props.filterStrategy;

  const columnFilterConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filterConfig).filter(
          ([id]) => id && filterConfig?.[id]?.columnId,
        ),
      ),
    [filterConfig],
  );
  const columnFiltersState = useMemo(
    () =>
      (filterState || [])
        .filter(({ id }) => id && isNotNil(filterConfig?.[id]?.columnId))
        .map(({ id, value }) => ({
          id,
          value,
        })),
    [filterState, filterConfig],
  );

  const customFiltersConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filterConfig ?? {}).filter(
          ([id]) => !id || !filterConfig?.[id]?.columnId,
        ),
      ),
    [filterConfig],
  );
  const customFiltersState = useMemo(
    () =>
      (filterState || [])
        .filter(({ id }) => !id || !filterConfig?.[id].columnId)
        .map(({ id, value }) => ({
          id,
          value: typeof value === 'number' ? value : value?.toString(),
        })),
    [filterState, filterConfig],
  );
  const customFiltersConfigAndState = useMemo(
    () =>
      Object.entries(customFiltersConfig).map(([id, config]) => ({
        ...config,
        ...customFiltersState.find((f) => f.id === id),
        onChange: (value: string | number | undefined) => {
          const newFilterState = [
            ...(filterState || []).filter((f) => f.id !== id),
            { id, value },
          ];
          onFilterStateChange?.(newFilterState);
        },
        onClear: () => {
          const newFilterState = [
            ...(filterState || []).filter((f) => f.id !== id),
          ];
          onFilterStateChange?.(newFilterState);
        },
      })),
    [filterState, customFiltersState, onFilterStateChange, customFiltersConfig],
  );

  return (
    <TableFilterPanel
      open={props.open}
      onOpenChange={props.onOpenChange}
      filterConfig={columnFilterConfig || {}}
      columnFilters={columnFiltersState}
      onColumnFiltersChange={onFilterStateChange}
      customFilters={customFiltersConfigAndState}
      onClearAll={() => {
        onFilterStateChange?.([]);
      }}
    />
  );
}
