import { useState, useMemo, useCallback } from 'react';
import type { VisibilityState, ColumnDef } from '@tanstack/react-table';

type ColumnDefResolved<TData> = ColumnDef<TData, any> & {
  id?: string;
  accessorKey?: string;
};

type VisibilityStateFromColumns<CDef extends ColumnDefResolved<any>> = {
  [key in NonNullable<
    CDef['id'] extends string ? CDef['id'] : CDef['accessorKey']
  >]?: boolean;
};

type UseVisibilityProps<CDef extends ColumnDefResolved<any>> = {
  initial?: VisibilityStateFromColumns<CDef>;
  columns: CDef[];
  defaultVisibility?: boolean;
};

/**
 * Manages column visibility state for a table.
 * Computes a base visibility map from column definitions, then merges
 * caller-supplied initial overrides on top.
 */
export function useVisibility<CDef extends ColumnDefResolved<any>>({
  initial = {},
  columns,
  defaultVisibility = false,
}: UseVisibilityProps<CDef>) {
  const base = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        acc[column.id ?? column.accessorKey ?? ''] = defaultVisibility;
        return acc;
      },
      {} as Record<string, boolean>,
    );
  }, [columns, defaultVisibility]);

  const [columnVisibility, setColumnVisibility] = useState<
    VisibilityStateFromColumns<CDef>
  >({ ...base, ...initial } as VisibilityStateFromColumns<CDef>);

  const toggleColumnVisibility = useCallback(
    (columnId: keyof typeof initial) => {
      setColumnVisibility((prev) => ({
        ...prev,
        [columnId]: !prev[columnId],
      }));
    },
    [],
  );

  return {
    columnVisibility: columnVisibility as VisibilityState,
    setColumnVisibility,
    toggleColumnVisibility,
  };
}
