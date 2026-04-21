/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
import { useEffect, useState } from 'react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { Filter, X } from 'lucide-react';
import { toast } from 'sonner';

type FilterOperator = 'like' | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';

type ColumnFilterProps = {
  columnId: string;
  columnName: string;
  filterType?: 'text' | 'number' | 'date' | 'select';
  value?:
    | { operator: FilterOperator; value: string | number | Date }
    | string
    | number
    | Date;
  onChange: (
    value:
      | { operator: FilterOperator; value: string | number | Date }
      | undefined,
  ) => void;
  options?: { value: string; label: string }[];
};

const OPERATORS_BY_TYPE: Record<
  string,
  { value: FilterOperator; label: string }[]
> = {
  text: [
    { value: 'like', label: 'Contains' },
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not Equals' },
  ],
  number: [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not Equals' },
    { value: 'gt', label: 'Greater Than' },
    { value: 'gte', label: 'Greater or Equal' },
    { value: 'lt', label: 'Less Than' },
    { value: 'lte', label: 'Less or Equal' },
  ],
  date: [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not Equals' },
    { value: 'gt', label: 'After' },
    { value: 'gte', label: 'On or After' },
    { value: 'lt', label: 'Before' },
    { value: 'lte', label: 'On or Before' },
  ],
  select: [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not Equals' },
  ],
};

const formatFilterInputValue = (raw?: string | number | Date): string => {
  if (raw instanceof Date) {
    return raw.toISOString().split('T')[0];
  }
  return raw !== undefined && raw !== null ? String(raw) : '';
};

export function ColumnFilter({
  columnId,
  columnName,
  filterType = 'text',
  value,
  onChange,
  options,
}: ColumnFilterProps) {
  const operators = OPERATORS_BY_TYPE[filterType] ?? OPERATORS_BY_TYPE.text;
  const defaultOperator = operators[0]?.value ?? 'like';

  // Normalize value to FilterValue format
  const normalizedValue =
    value && typeof value === 'object' && 'operator' in value
      ? value
      : value
        ? { operator: defaultOperator, value: value as string | number | Date }
        : undefined;

  const [open, setOpen] = useState(false);
  const [operator, setOperator] = useState<FilterOperator>(
    normalizedValue?.operator ?? defaultOperator,
  );
  const [filterValue, setFilterValue] = useState<string>(
    formatFilterInputValue(normalizedValue?.value) ?? '',
  );

  useEffect(() => {
    if (!normalizedValue) {
      setOperator(defaultOperator);
      setFilterValue('');
      return;
    }
    setOperator(normalizedValue.operator ?? defaultOperator);
    setFilterValue(formatFilterInputValue(normalizedValue.value));
  }, [normalizedValue, defaultOperator]);

  const handleApply = () => {
    if (!filterValue) {
      onChange(undefined);
    } else {
      let processedValue: string | number | Date = filterValue;

      if (filterType === 'number') {
        processedValue = Number(filterValue);
        if (Number.isNaN(processedValue)) {
          toast.error('Invalid number');
          return;
        }
      } else if (filterType === 'date') {
        processedValue = new Date(filterValue);
        if (Number.isNaN(processedValue.getTime())) {
          toast.error('Invalid date');
          return;
        }
      }

      onChange({ operator, value: processedValue });
    }
    setOpen(false);
  };

  const handleClear = () => {
    setFilterValue('');
    setOperator(defaultOperator);
    onChange(undefined);
    setOpen(false);
  };

  const isActive = !!normalizedValue;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            className="h-7 gap-1"
          />
        }
      >
        <Filter className="h-3 w-3" />
        {isActive && <span className="sr-only">Filter active</span>}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Filter {columnName}</h4>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="filter-operator"
              className="text-xs text-muted-foreground"
            >
              Operator
            </label>
            <Select
              value={operator}
              onValueChange={(value) => {
                if (!value) return;
                setOperator(value as FilterOperator);
              }}
            >
              <SelectTrigger>
                <SelectValue id="filter-operator" />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="filter-value"
              className="text-xs text-muted-foreground"
            >
              Value
            </label>
            {filterType === 'select' && options ? (
              <Select
                value={filterValue}
                onValueChange={(value) => {
                  if (value == null) return;
                  setFilterValue(value);
                }}
              >
                <SelectTrigger id="filter-value">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="filter-value"
                type={
                  filterType === 'number'
                    ? 'number'
                    : filterType === 'date'
                      ? 'date'
                      : 'text'
                }
                placeholder={`Enter ${columnName.toLowerCase()}...`}
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApply();
                  }
                }}
              />
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleApply} size="sm" className="flex-1">
              Apply
            </Button>
            <Button
              onClick={handleClear}
              size="sm"
              variant="outline"
              className="gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
