'use client';

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type {
  VisibilityState,
  ColumnOrderState,
  SortingState,
  ColumnSizingState,
  ColumnFiltersState,
} from '@tanstack/react-table';

const STORAGE_KEY_PREFIX = 'namefi-table-prefs:';
const CURRENT_VERSION = 1;

interface StoredPreferences {
  version: number;
  columnVisibility?: VisibilityState;
  columnOrder?: ColumnOrderState;
  sorting?: SortingState;
  columnSizing?: ColumnSizingState;
  filters?: ColumnFiltersState;
  pageSize?: number;
}

export interface TablePreferences {
  columnVisibility: VisibilityState;
  columnOrder: ColumnOrderState;
  sorting: SortingState;
  columnSizing: ColumnSizingState;
  filters: ColumnFiltersState;
  pageSize: number;
}

export interface UseTablePreferencesOptions {
  tableId: string;
  defaultPreferences?: Partial<TablePreferences>;
}

export interface UseTablePreferencesReturn {
  preferences: TablePreferences;
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>;
  setColumnOrder: Dispatch<SetStateAction<ColumnOrderState>>;
  setSorting: Dispatch<SetStateAction<SortingState>>;
  setColumnSizing: Dispatch<SetStateAction<ColumnSizingState>>;
  setFilters: Dispatch<SetStateAction<ColumnFiltersState>>;
  setPageSize: (size: number) => void;
  resetToDefaults: () => void;
  isLoaded: boolean;
}

const DEFAULT_PREFERENCES: TablePreferences = {
  columnVisibility: {},
  columnOrder: [],
  sorting: [],
  columnSizing: {},
  filters: [],
  pageSize: 50,
};

function getStorageKey(tableId: string): string {
  return `${STORAGE_KEY_PREFIX}${tableId}`;
}

function loadFromStorage(tableId: string): StoredPreferences | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const key = getStorageKey(tableId);
    const stored = localStorage.getItem(key);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as StoredPreferences;

    if (parsed.version !== CURRENT_VERSION) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(tableId: string, preferences: TablePreferences): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const key = getStorageKey(tableId);
    const toStore: StoredPreferences = {
      version: CURRENT_VERSION,
      columnVisibility: preferences.columnVisibility,
      columnOrder: preferences.columnOrder,
      sorting: preferences.sorting,
      columnSizing: preferences.columnSizing,
      filters: preferences.filters,
      pageSize: preferences.pageSize,
    };
    localStorage.setItem(key, JSON.stringify(toStore));
  } catch {
    // Silently fail if localStorage is unavailable or quota exceeded
  }
}

function clearStorage(tableId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const key = getStorageKey(tableId);
    localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}

export function useTablePreferences(
  options: UseTablePreferencesOptions,
): UseTablePreferencesReturn {
  const { tableId, defaultPreferences = {} } = options;

  const mergedDefaults = useMemo(
    () => ({
      ...DEFAULT_PREFERENCES,
      ...defaultPreferences,
    }),
    [defaultPreferences],
  );

  const [isLoaded, setIsLoaded] = useState(false);
  const [columnVisibility, setColumnVisibilityState] =
    useState<VisibilityState>(mergedDefaults.columnVisibility);
  const [columnOrder, setColumnOrderState] = useState<ColumnOrderState>(
    mergedDefaults.columnOrder,
  );
  const [sorting, setSortingState] = useState<SortingState>(
    mergedDefaults.sorting,
  );
  const [columnSizing, setColumnSizingState] = useState<ColumnSizingState>(
    mergedDefaults.columnSizing,
  );
  const [filters, setFiltersState] = useState<ColumnFiltersState>(
    mergedDefaults.filters,
  );
  const [pageSize, setPageSizeState] = useState<number>(
    mergedDefaults.pageSize,
  );

  useEffect(() => {
    setIsLoaded(false);
    const stored = loadFromStorage(tableId);
    if (stored) {
      setColumnVisibilityState(
        stored.columnVisibility ?? mergedDefaults.columnVisibility,
      );
      setColumnOrderState(stored.columnOrder ?? mergedDefaults.columnOrder);
      setSortingState(stored.sorting ?? mergedDefaults.sorting);
      setColumnSizingState(stored.columnSizing ?? mergedDefaults.columnSizing);
      setFiltersState(stored.filters ?? mergedDefaults.filters);
      setPageSizeState(stored.pageSize ?? mergedDefaults.pageSize);
    } else {
      setColumnVisibilityState(mergedDefaults.columnVisibility);
      setColumnOrderState(mergedDefaults.columnOrder);
      setSortingState(mergedDefaults.sorting);
      setColumnSizingState(mergedDefaults.columnSizing);
      setFiltersState(mergedDefaults.filters);
      setPageSizeState(mergedDefaults.pageSize);
    }
    setIsLoaded(true);
  }, [tableId, mergedDefaults]);

  const preferences = useMemo<TablePreferences>(
    () => ({
      columnVisibility,
      columnOrder,
      sorting,
      columnSizing,
      filters,
      pageSize,
    }),
    [columnVisibility, columnOrder, sorting, columnSizing, filters, pageSize],
  );

  useEffect(() => {
    if (isLoaded) {
      saveToStorage(tableId, preferences);
    }
  }, [tableId, preferences, isLoaded]);

  const setColumnVisibility: Dispatch<SetStateAction<VisibilityState>> =
    useCallback((value) => {
      setColumnVisibilityState(value);
    }, []);

  const setColumnOrder: Dispatch<SetStateAction<ColumnOrderState>> =
    useCallback((value) => {
      setColumnOrderState(value);
    }, []);

  const setSorting: Dispatch<SetStateAction<SortingState>> = useCallback(
    (value) => {
      setSortingState(value);
    },
    [],
  );

  const setColumnSizing: Dispatch<SetStateAction<ColumnSizingState>> =
    useCallback((value) => {
      setColumnSizingState(value);
    }, []);

  const setFilters: Dispatch<SetStateAction<ColumnFiltersState>> = useCallback(
    (value) => {
      setFiltersState(value);
    },
    [],
  );

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
  }, []);

  const resetToDefaults = useCallback(() => {
    clearStorage(tableId);
    setColumnVisibilityState(mergedDefaults.columnVisibility);
    setColumnOrderState(mergedDefaults.columnOrder);
    setSortingState(mergedDefaults.sorting);
    setColumnSizingState(mergedDefaults.columnSizing);
    setFiltersState(mergedDefaults.filters);
    setPageSizeState(mergedDefaults.pageSize);
  }, [tableId, mergedDefaults]);

  return {
    preferences,
    setColumnVisibility,
    setColumnOrder,
    setSorting,
    setColumnSizing,
    setFilters,
    setPageSize,
    resetToDefaults,
    isLoaded,
  };
}
