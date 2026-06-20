import { useState, useEffect, useMemo } from 'react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { DatePickerWithInput } from '@/components/date-picker/date-picker-with-input';
import { Plus, X, Check, ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { FilterOperators } from '@samyx/drizzler-filters-sorters';
import type {
  DrizzlerFilterFieldConfig,
  DrizzlerFilterCondition,
} from '../types';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@namefi-astra/ui/components/shadcn/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';
import { cn } from '@namefi-astra/ui/lib/cn';
import { UserWalletAvatar } from '@/components/user-avatar';

type DrizzlerFilterFieldProps = {
  field: DrizzlerFilterFieldConfig;
  conditions: DrizzlerFilterCondition[];
  logicalOperator: 'and' | 'or';
  onChange: (
    conditions: DrizzlerFilterCondition[],
    logicalOperator: 'and' | 'or',
  ) => void;
  onClear: () => void;
  suggestions?: { value: string; label: string; type?: 'wallet' }[];
};

// Operator definitions by field type
type OperatorLabelKey =
  | 'contains'
  | 'containsCaseInsensitive'
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'greaterOrEqual'
  | 'lessThan'
  | 'lessOrEqual'
  | 'after'
  | 'onOrAfter'
  | 'before'
  | 'onOrBefore'
  | 'isNull'
  | 'isNotNull'
  | 'inList'
  | 'notInList'
  | 'allElementsEquals'
  | 'allElementsNotEquals'
  | 'anyElementEquals'
  | 'anyElementNotEquals'
  | 'allElementsContain'
  | 'allElementsNotContain'
  | 'anyElementContains'
  | 'anyElementNotContain';

export const OPERATORS_BY_TYPE: Record<
  string,
  { value: FilterOperators; labelKey: OperatorLabelKey }[]
> = {
  text: [
    { value: 'like', labelKey: 'contains' },
    { value: 'ilike', labelKey: 'containsCaseInsensitive' },
    { value: 'eq', labelKey: 'equals' },
    { value: 'neq', labelKey: 'notEquals' },
    { value: 'isnull', labelKey: 'isNull' },
    { value: 'not_isnull', labelKey: 'isNotNull' },
  ],
  number: [
    { value: 'eq', labelKey: 'equals' },
    { value: 'neq', labelKey: 'notEquals' },
    { value: 'gt', labelKey: 'greaterThan' },
    { value: 'gte', labelKey: 'greaterOrEqual' },
    { value: 'lt', labelKey: 'lessThan' },
    { value: 'lte', labelKey: 'lessOrEqual' },
    { value: 'isnull', labelKey: 'isNull' },
    { value: 'not_isnull', labelKey: 'isNotNull' },
  ],
  date: [
    { value: 'eq', labelKey: 'equals' },
    { value: 'neq', labelKey: 'notEquals' },
    { value: 'gt', labelKey: 'after' },
    { value: 'gte', labelKey: 'onOrAfter' },
    { value: 'lt', labelKey: 'before' },
    { value: 'lte', labelKey: 'onOrBefore' },
    { value: 'isnull', labelKey: 'isNull' },
    { value: 'not_isnull', labelKey: 'isNotNull' },
  ],
  select: [
    { value: 'eq', labelKey: 'equals' },
    { value: 'neq', labelKey: 'notEquals' },
    { value: 'in_array', labelKey: 'inList' },
    { value: 'not_in_array', labelKey: 'notInList' },
    { value: 'isnull', labelKey: 'isNull' },
    { value: 'not_isnull', labelKey: 'isNotNull' },
  ],
  array: [
    { value: 'isnull', labelKey: 'isNull' },
    { value: 'not_isnull', labelKey: 'isNotNull' },

    { value: 'array_all_i_like', labelKey: 'allElementsEquals' },
    { value: 'not_array_all_i_like', labelKey: 'allElementsNotEquals' },

    { value: 'array_any_i_like', labelKey: 'anyElementEquals' },
    { value: 'not_array_any_i_like', labelKey: 'anyElementNotEquals' },

    { value: 'array_all_i_contains', labelKey: 'allElementsContain' },
    { value: 'not_array_all_i_contains', labelKey: 'allElementsNotContain' },

    { value: 'array_any_i_contains', labelKey: 'anyElementContains' },
    {
      value: 'not_array_any_i_contains',
      labelKey: 'anyElementNotContain',
    },
  ],
};

const UNARY_OPERATORS: FilterOperators[] = ['isnull', 'not_isnull'];
const SELECT_ARRAY_OPERATORS: FilterOperators[] = ['in_array', 'not_in_array'];

const formatValueForDisplay = (value: unknown, _type: string): string => {
  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[0]) : '';
  }
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
  suggestions,
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
  suggestions?: { value: string; label: string; type?: 'wallet' }[];
  onChange: (updated: DrizzlerFilterCondition) => void;
  onRemove: () => void;
  showRemove: boolean;
}) {
  const t = useTranslations('shared');
  const allOperators = OPERATORS_BY_TYPE[fieldType] ?? OPERATORS_BY_TYPE.text;
  // Filter operators based on allowedOperators if provided, then resolve labels.
  const operators = useMemo(() => {
    const operatorsList = allowedOperators
      ? allOperators.filter((op) => allowedOperators.includes(op.value))
      : allOperators;
    return operatorsList.map((op) => {
      let label =
        operatorsCustomLabels?.[op.value] ??
        t(`table.filter.operators.${op.labelKey}`);
      if (fieldType === 'array') {
        label = label
          .replace(
            'Elements',
            typeSpecificOptions?.array?.elementName?.plural ?? 'Elements',
          )
          .replace(
            'Element',
            typeSpecificOptions?.array?.elementName?.singular ?? 'Element',
          );
      }
      return { value: op.value, label };
    });
  }, [
    allowedOperators,
    allOperators,
    fieldType,
    typeSpecificOptions?.array?.elementName?.plural,
    typeSpecificOptions?.array?.elementName?.singular,
    operatorsCustomLabels,
    t,
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

  const [comboboxOpen, setComboboxOpen] = useState(false);

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

    let nextValue = condition.value;
    if (fieldType === 'select' && !isNewUnary) {
      if (SELECT_ARRAY_OPERATORS.includes(newOperator)) {
        if (Array.isArray(condition.value)) {
          nextValue = condition.value;
        } else if (condition.value !== undefined && condition.value !== null) {
          nextValue = [condition.value];
        } else {
          nextValue = undefined;
        }
      } else if (Array.isArray(condition.value)) {
        nextValue = condition.value[0];
      }
    }

    onChange({
      operator: newOperator,
      value: isNewUnary ? 'true' : nextValue,
    });
  };

  const handleValueChange = (newValue: unknown) => {
    onChange({
      operator: condition.operator,
      value: newValue,
    });
  };

  const renderCombobox = () => (
    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen} modal>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={comboboxOpen}
            className="h-9 w-full justify-between font-normal px-3"
          />
        }
      >
        {localValue || t('table.filter.enterValuePlaceholder')}
        <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start" side="bottom">
        <Command>
          <CommandInput
            placeholder={t('table.filter.typeValuePlaceholder')}
            value={localValue}
            onValueChange={(val) => {
              setLocalValue(val);
              // Allow free typing
              let processedValue: string | number = val;
              if (fieldType === 'number') {
                const trimmed = val.trim();
                if (trimmed !== '') {
                  const num = Number(trimmed);
                  if (!Number.isNaN(num)) {
                    processedValue = num;
                    handleValueChange(processedValue);
                  }
                } else {
                  handleValueChange(undefined);
                }
              } else {
                handleValueChange(val);
              }
            }}
          />
          <CommandList>
            <CommandEmpty className="py-2 px-4 text-sm text-muted-foreground">
              {t('table.filter.noSuggestions')}
            </CommandEmpty>
            <CommandGroup heading={t('table.filter.suggestions')}>
              {suggestions?.map((suggestion) => (
                <CommandItem
                  key={suggestion.value}
                  value={suggestion.label} // Use label for filtering if user types
                  onSelect={() => {
                    handleValueChange(
                      fieldType === 'number'
                        ? Number(suggestion.value)
                        : suggestion.value,
                    );
                    setLocalValue(suggestion.value); // Keep value in input
                    setComboboxOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'me-2 h-4 w-4',
                      localValue === suggestion.value
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                  {suggestion.type === 'wallet' ? (
                    <div className="flex items-center gap-2">
                      <UserWalletAvatar
                        address={suggestion.value}
                        className="h-6 w-6"
                      />
                      <span className="font-mono text-sm">
                        {suggestion.label}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span>{suggestion.label}</span>
                      {suggestion.label !== suggestion.value && (
                        <span className="text-xs text-muted-foreground">
                          {suggestion.value}
                        </span>
                      )}
                    </div>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="flex gap-2 items-start">
      <div className="flex flex-row gap-2 flex-1 space-y-2">
        <Select
          value={condition.operator}
          onValueChange={(v) => {
            if (!v) return;
            handleOperatorChange(v as FilterOperators);
          }}
        >
          <SelectTrigger className="h-6 w-28">
            <SelectValue>
              {operators.find((op) => op.value === condition.operator)?.label ??
                condition.operator}
            </SelectValue>
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
              value={localValue?.toString()}
              onValueChange={(v) => {
                const foundOption = fieldOptions?.find(
                  (option) => option.value?.toString() === v,
                );
                if (foundOption) {
                  handleValueChange(
                    SELECT_ARRAY_OPERATORS.includes(condition.operator)
                      ? [foundOption.value]
                      : foundOption.value,
                  );
                  setLocalValue(foundOption.value?.toString() ?? '');
                } else {
                  handleValueChange(undefined);
                  setLocalValue('');
                }
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t('table.filter.selectPlaceholder')}>
                  {fieldOptions.find(
                    (option) => option.value?.toString() === localValue,
                  )?.label ?? t('table.filter.selectPlaceholder')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {fieldOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value?.toString()}
                  >
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
              placeholder={t('table.filter.selectDatePlaceholder')}
              className="flex flex-col gap-2"
            />
          ) : suggestions && suggestions.length > 0 ? (
            renderCombobox()
          ) : (
            <Input
              type={fieldType === 'number' ? 'number' : 'text'}
              placeholder={t('table.filter.enterValuePlaceholder')}
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
  suggestions,
}: DrizzlerFilterFieldProps) {
  const t = useTranslations('shared');
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
              suggestions={suggestions}
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
            !canAddMoreConditions && field.maxConditions !== undefined
              ? t('table.filter.maxConditionsReached', {
                  count: field.maxConditions,
                })
              : undefined
          }
        >
          <Plus className="h-4 w-4 me-1" />
          {t('table.filter.addCondition')}
          {field.maxConditions !== undefined &&
            ` (${conditions.length}/${field.maxConditions})`}
        </Button>
        <Button onClick={onClear} size="sm" variant="outline">
          {t('table.filter.clearAllConditions')}
        </Button>
      </div>
    </div>
  );
}
