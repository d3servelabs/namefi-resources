import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { DatePickerWithInput } from '@/components/date-picker/date-picker-with-input';
import { Plus, X } from 'lucide-react';
import type { FilterOperators } from '@samyx/drizzler-filters-sorters';
import type {
  DrizzlerFilterFieldConfig,
  DrizzlerFilterCondition,
} from '../types';
import { useMemo } from 'react';

type DrizzlerFilterFieldProps = {
  field: DrizzlerFilterFieldConfig;
  conditions: DrizzlerFilterCondition[];
  logicalOperator: 'and' | 'or';
  onChange: (
    conditions: DrizzlerFilterCondition[],
    logicalOperator: 'and' | 'or',
  ) => void;
  onClear: () => void;
};

// Operator definitions by field type
export const OPERATORS_BY_TYPE: Record<
  string,
  { value: FilterOperators; label: string }[]
> = {
  text: [
    { value: 'like', label: 'Contains' },
    { value: 'ilike', label: 'Contains (case-insensitive)' },
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not Equals' },
    { value: 'isnull', label: 'Is Null' },
    { value: 'not_isnull', label: 'Is Not Null' },
  ],
  number: [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not Equals' },
    { value: 'gt', label: 'Greater Than' },
    { value: 'gte', label: 'Greater or Equal' },
    { value: 'lt', label: 'Less Than' },
    { value: 'lte', label: 'Less or Equal' },
    { value: 'isnull', label: 'Is Null' },
    { value: 'not_isnull', label: 'Is Not Null' },
  ],
  date: [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not Equals' },
    { value: 'gt', label: 'After' },
    { value: 'gte', label: 'On or After' },
    { value: 'lt', label: 'Before' },
    { value: 'lte', label: 'On or Before' },
    { value: 'isnull', label: 'Is Null' },
    { value: 'not_isnull', label: 'Is Not Null' },
  ],
  select: [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not Equals' },
    { value: 'in_array', label: 'In List' },
    { value: 'not_in_array', label: 'Not In List' },
    { value: 'isnull', label: 'Is Null' },
    { value: 'not_isnull', label: 'Is Not Null' },
  ],
  array: [
    { value: 'isnull', label: 'Is Null' },
    { value: 'not_isnull', label: 'Is Not Null' },

    { value: 'array_all_i_like', label: 'All Elements Equals' },
    { value: 'not_array_all_i_like', label: 'All Elements Does Not Equal' },

    { value: 'array_any_i_like', label: 'Any Element Equals' },
    { value: 'not_array_any_i_like', label: 'Any Element Does Not Equal' },

    { value: 'array_all_i_contains', label: 'All Elements Contain' },
    { value: 'not_array_all_i_contains', label: 'All Elements Do Not Contain' },

    { value: 'array_any_i_contains', label: 'Any Element Contains' },
    {
      value: 'not_array_any_i_contains',
      label: 'Any Element Does Not Contain',
    },
  ],
};

const UNARY_OPERATORS: FilterOperators[] = ['isnull', 'not_isnull'];

const formatValueForDisplay = (value: unknown, type: string): string => {
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

function SingleConditionEditor({
  condition,
  fieldType,
  fieldOptions,
  allowedOperators,
  typeSpecificOptions,
  operatorsCustomLabels,
  onChange,
  onRemove,
  showRemove,
}: {
  condition: DrizzlerFilterCondition;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'array';
  fieldOptions?: { value: string; label: string }[];
  allowedOperators?: FilterOperators[];
  typeSpecificOptions?: DrizzlerFilterFieldConfig['typeSpecificOptions'];
  operatorsCustomLabels?: Record<FilterOperators, string>;
  onChange: (updated: DrizzlerFilterCondition) => void;
  onRemove: () => void;
  showRemove: boolean;
}) {
  const allOperators = OPERATORS_BY_TYPE[fieldType] ?? OPERATORS_BY_TYPE.text;
  // Filter operators based on allowedOperators if provided
  const operators = useMemo(() => {
    let operatorsList = allowedOperators
      ? allOperators.filter((op) => allowedOperators.includes(op.value))
      : allOperators;
    if (operatorsCustomLabels) {
      operatorsList = operatorsList.map((op) => ({
        ...op,
        label: operatorsCustomLabels[op.value] ?? op.label,
      }));
    }
    if (fieldType === 'array') {
      return operatorsList.map((op) => ({
        ...op,
        label: op.label
          .replace(
            'Elements',
            typeSpecificOptions?.array?.elementName?.plural ?? 'Elements',
          )
          .replace(
            'Element',
            typeSpecificOptions?.array?.elementName?.singular ?? 'Element',
          ),
      }));
    }
    return operatorsList;
  }, [
    allowedOperators,
    allOperators,
    fieldType,
    typeSpecificOptions?.array?.elementName?.plural,
    typeSpecificOptions?.array?.elementName?.singular,
    operatorsCustomLabels,
  ]);
  const isUnaryOperator = UNARY_OPERATORS.includes(condition.operator);

  const [localValue, setLocalValue] = useState<string>(
    formatValueForDisplay(condition.value, fieldType),
  );
  const [dateValue, setDateValue] = useState<Date | undefined>(
    fieldType === 'date' && condition.value instanceof Date
      ? condition.value
      : fieldType === 'date' && typeof condition.value === 'string'
        ? new Date(condition.value)
        : undefined,
  );

  useEffect(() => {
    setLocalValue(formatValueForDisplay(condition.value, fieldType));
    if (fieldType === 'date') {
      if (condition.value instanceof Date) {
        setDateValue(condition.value);
      } else if (typeof condition.value === 'string') {
        const parsed = new Date(condition.value);
        setDateValue(Number.isNaN(parsed.getTime()) ? undefined : parsed);
      } else {
        setDateValue(undefined);
      }
    }
  }, [condition.value, fieldType]);

  const handleOperatorChange = (newOperator: FilterOperators) => {
    const isNewUnary = UNARY_OPERATORS.includes(newOperator);
    onChange({
      operator: newOperator,
      value: isNewUnary ? 'true' : condition.value,
    });
  };

  const handleValueChange = (newValue: unknown) => {
    onChange({
      operator: condition.operator,
      value: newValue,
    });
  };

  return (
    <div className="flex gap-2 items-start">
      <div className="flex flex-row gap-2 flex-1 space-y-2">
        <Select
          value={condition.operator}
          onValueChange={(v) => handleOperatorChange(v as FilterOperators)}
        >
          <SelectTrigger className="h-6 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!isUnaryOperator &&
          (fieldType === 'select' && fieldOptions ? (
            <Select
              value={localValue}
              onValueChange={(v) => {
                setLocalValue(v);
                handleValueChange(v);
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {fieldOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : fieldType === 'date' ? (
            <DatePickerWithInput
              value={dateValue}
              onChange={(date) => {
                setDateValue(date);
                if (date) {
                  setLocalValue(date.toISOString().split('T')[0]);
                  handleValueChange(date);
                } else {
                  setLocalValue('');
                  handleValueChange(undefined);
                }
              }}
              placeholder="Select date..."
              className="flex flex-col gap-2"
            />
          ) : (
            <Input
              type={fieldType === 'number' ? 'number' : 'text'}
              placeholder="Enter value..."
              value={localValue}
              onChange={(e) => {
                setLocalValue(e.target.value);
              }}
              onBlur={() => {
                let processedValue: string | number = localValue;
                if (fieldType === 'number') {
                  const trimmed = localValue.trim();
                  if (trimmed === '') {
                    handleValueChange(undefined);
                    return;
                  }
                  processedValue = Number(trimmed);
                  if (!Number.isNaN(processedValue)) {
                    handleValueChange(processedValue);
                  }
                } else {
                  handleValueChange(localValue);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="h-9"
            />
          ))}
      </div>

      {showRemove && (
        <Button
          onClick={onRemove}
          size="sm"
          variant="ghost"
          className="h-9 w-9 p-0 mt-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function DrizzlerFilterField({
  field,
  conditions: _conditions,
  logicalOperator,
  onChange,
  onClear,
}: DrizzlerFilterFieldProps) {
  const conditions: DrizzlerFilterCondition[] = useMemo(() => {
    if (!_conditions || _conditions.length === 0) {
      return [
        {
          operator:
            field.type === 'array' ? OPERATORS_BY_TYPE.array[3]?.value : 'eq',
          value: undefined,
        },
      ];
    }
    return _conditions;
  }, [_conditions, field.type]);
  const canAddMoreConditions =
    field.maxConditions === undefined ||
    conditions.length < field.maxConditions;

  const handleAddCondition = () => {
    if (!canAddMoreConditions) return;

    const allOperators =
      OPERATORS_BY_TYPE[field.type] ?? OPERATORS_BY_TYPE.text;
    const operators = field.allowedOperators
      ? allOperators.filter((op) => field.allowedOperators?.includes(op.value))
      : allOperators;
    const defaultOperator = operators[0]?.value ?? 'eq';

    onChange(
      [
        ...conditions,
        {
          operator: defaultOperator,
          value: undefined,
        },
      ],
      logicalOperator,
    );
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    if (newConditions.length === 0) {
      onClear();
    } else {
      onChange(newConditions, logicalOperator);
    }
  };

  const handleUpdateCondition = (
    index: number,
    updated: DrizzlerFilterCondition,
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = updated;
    onChange(newConditions, logicalOperator);
  };

  const handleToggleLogicalOperator = () => {
    onChange(conditions, logicalOperator === 'and' ? 'or' : 'and');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {conditions.map((condition, index) => (
          <div key={index}>
            <SingleConditionEditor
              condition={condition}
              fieldType={field.type}
              fieldOptions={field.options}
              allowedOperators={field.allowedOperators}
              typeSpecificOptions={field.typeSpecificOptions}
              operatorsCustomLabels={field.operatorsCustomLabels}
              onChange={(updated) => handleUpdateCondition(index, updated)}
              onRemove={() => handleRemoveCondition(index)}
              showRemove={conditions.length > 1}
            />
            {index < conditions.length - 1 && (
              <div className="flex items-center justify-center py-2">
                <Button
                  onClick={handleToggleLogicalOperator}
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs"
                >
                  {logicalOperator.toUpperCase()}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleAddCondition}
          size="sm"
          variant="outline"
          className="flex-1"
          disabled={!canAddMoreConditions}
          title={
            !canAddMoreConditions
              ? `Maximum ${field.maxConditions} condition${field.maxConditions === 1 ? '' : 's'} reached`
              : undefined
          }
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Condition
          {field.maxConditions !== undefined &&
            ` (${conditions.length}/${field.maxConditions})`}
        </Button>
        <Button onClick={onClear} size="sm" variant="outline">
          Clear All
        </Button>
      </div>
    </div>
  );
}
