import type { SortingState } from '@tanstack/react-table';

/**
 * Compare two values for sorting. Handles null, string, number, boolean, and Date.
 */
function compareValues(a: unknown, b: unknown): number {
  // Nulls last
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  // Dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  // Booleans
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 0 : a ? -1 : 1;
  }

  // Numbers
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  // Strings (case-insensitive)
  return String(a).localeCompare(String(b), undefined, {
    sensitivity: 'base',
  });
}

/**
 * Apply TanStack sorting state to in-memory data (client-side sorting).
 *
 * @param data - Array of rows to sort
 * @param sorting - TanStack SortingState array
 * @param fieldAccessors - Map of column id to accessor function that extracts the value from a row
 * @returns New sorted array (does not mutate input)
 */
export function applyClientSideSorting<T>(
  data: T[],
  sorting: SortingState,
  fieldAccessors: Record<string, (row: T) => unknown>,
): T[] {
  if (!sorting || sorting.length === 0) return data;

  return [...data].sort((a, b) => {
    for (const sort of sorting) {
      const accessor = fieldAccessors[sort.id];
      if (!accessor) continue;
      const cmp = compareValues(accessor(a), accessor(b));
      if (cmp !== 0) return sort.desc ? -cmp : cmp;
    }
    return 0;
  });
}
