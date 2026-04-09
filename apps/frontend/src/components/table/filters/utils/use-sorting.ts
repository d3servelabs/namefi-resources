import { useState, useCallback } from 'react';
import type { SortingState } from '@tanstack/react-table';

type UseSortingProps = {
  initial?: SortingState;
};

/**
 * Manages sorting state for a table.
 * Provides controlled state, a setter, and helpers to toggle or clear sorting.
 */
export function useSorting({ initial = [] }: UseSortingProps = {}) {
  const [sorting, setSorting] = useState<SortingState>(initial);

  const toggleSort = useCallback((columnId: string, multi = false) => {
    setSorting((prev) => {
      const existing = prev.find((s) => s.id === columnId);
      if (!existing) {
        const entry = { id: columnId, desc: false };
        return multi ? [...prev, entry] : [entry];
      }
      if (!existing.desc) {
        const updated = { id: columnId, desc: true };
        return multi
          ? prev.map((s) => (s.id === columnId ? updated : s))
          : [updated];
      }
      // Third click removes the sort
      return multi ? prev.filter((s) => s.id !== columnId) : [];
    });
  }, []);

  const clearSorting = useCallback(() => setSorting([]), []);

  return { sorting, setSorting, toggleSort, clearSorting };
}
