/**
 * Export all filter-related utilities, strategies, and components
 */

// Types
export type {
  IFilterStrategy,
  DefaultFilterField,
  DefaultSingleFilterState,
  FilterDisplayOptions,
  SingleFilterState,
  DrizzlerFilterState,
  DrizzlerFilterFieldConfig,
  DrizzlerFilterField,
  DrizzlerFilterCondition,
} from './types';

export type CustomFilterField = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  value?: string | number;
  onChange: (value: string | number | undefined) => void;
  onClear?: () => void;
};

// Strategies
export { useBasicServerFilterStrategy } from './strategies/basic-server-filter-strategy';
export {
  useDrizzlerServerFilterStrategy,
  convertToDrizzlerFilterOptions,
} from './strategies/drizzler-server-filter-strategy';

// Components
export { DrizzlerFilterPanel } from './components/drizzler-filter-panel';
export { DrizzlerFilterField as DrizzlerFilterFieldComponent } from './components/drizzler-filter-field';

// Client-side utilities
export { applyClientSideSorting } from './utils/apply-client-side-sorting';
export { useVisibility } from './utils/use-visibility';
export { useSorting } from './utils/use-sorting';
