import type { FilterOperators } from '@samyx/drizzler-filters-sorters';
import type { DrizzlerFilterFieldConfig } from '../types';

/**
 * Advanced Filter System Types
 *
 * This system supports building complex nested filter conditions with two UI modes:
 * - Panel mode: Tree-like view with indentation
 * - Flow mode: Inline flex layout
 */

export type AdvancedFilterCondition = {
  id: string;
  type: 'condition';
  field: string;
  operator: FilterOperators;
  value: unknown | unknown[];
};

export type AdvancedFilterGroup = {
  id: string;
  type: 'group';
  operator: 'and' | 'or';
  items: (AdvancedFilterCondition | AdvancedFilterGroup)[];
};

export type AdvancedFilterState = {
  root: AdvancedFilterGroup;
};

export type FilterBuilderMode = 'panel' | 'flow';

export type FilterFieldConfig = DrizzlerFilterFieldConfig;

/**
 * Props for filter components
 */
export type FilterConditionProps = {
  condition: AdvancedFilterCondition;
  variant: 'panel' | 'flow';
  fields: FilterFieldConfig[];
  onChange: (updates: Partial<AdvancedFilterCondition>) => void;
  onRemove: () => void;
};

export type FilterGroupProps = {
  group: AdvancedFilterGroup;
  actions: FilterActions;
  fields: FilterFieldConfig[];
};

export type PanelFilterGroupProps = FilterGroupProps & {
  depth: number;
};

export type FlowFilterGroupProps = FilterGroupProps & {
  isRoot?: boolean;
};

export type FilterBuilderProps = {
  mode: FilterBuilderMode;
  initialState?: AdvancedFilterState;
  fields: FilterFieldConfig[];
  onStateChange?: (state: AdvancedFilterState) => void;
};

/**
 * Filter actions returned by useFilterLogic hook
 */
export type FilterActions = {
  addCondition: (groupId: string, condition: AdvancedFilterCondition) => void;
  removeCondition: (groupId: string, conditionId: string) => void;
  addGroup: (parentGroupId: string, group: AdvancedFilterGroup) => void;
  removeGroup: (groupId: string) => void;
  toggleOperator: (groupId: string) => void;
  updateCondition: (
    groupId: string,
    conditionId: string,
    updates: Partial<AdvancedFilterCondition>,
  ) => void;
  clearAll: () => void;
  convertToDrizzler: () => any;
};

/**
 * Return type for useFilterLogic hook
 */
export type UseFilterLogicReturn = {
  filterState: AdvancedFilterState;
  actions: FilterActions;
};
