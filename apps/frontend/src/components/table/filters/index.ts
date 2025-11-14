/**
 * Export all filter-related utilities, strategies, and components
 */

// Types
export type {
  IFilterStrategy,
  DefaultFilterField,
  DefaultSingleFilterState,
  FilterDisplayOptions,
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
