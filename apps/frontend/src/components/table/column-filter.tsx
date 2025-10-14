/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/shadcn/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Filter, X } from 'lucide-react';
import { toast } from 'sonner';

type FilterOperator = 'like' | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';

type ColumnFilterProps = {
  columnId: string;
  columnName: string;
  filterType?: 'text' | 'number' | 'date';
  value?: { operator: FilterOperator; value: string | number | Date };
  onChange: (
    value:
      | { operator: FilterOperator; value: string | number | Date }
      | undefined,
  ) => void;
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
}: ColumnFilterProps) {
  const operators = OPERATORS_BY_TYPE[filterType] ?? OPERATORS_BY_TYPE.text;
  const defaultOperator = operators[0]?.value ?? 'like';

  const [open, setOpen] = useState(false);
  const [operator, setOperator] = useState<FilterOperator>(
    value?.operator ?? defaultOperator,
  );
  const [filterValue, setFilterValue] = useState<string>(
    formatFilterInputValue(value?.value) ?? '',
  );

  useEffect(() => {
    if (!value) {
      setOperator(defaultOperator);
      setFilterValue('');
      return;
    }
    setOperator(value.operator ?? defaultOperator);
    setFilterValue(formatFilterInputValue(value.value));
  }, [value, defaultOperator]);

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

  const isActive = !!value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isActive ? 'default' : 'ghost'}
          size="sm"
          className="h-7 gap-1"
        >
          <Filter className="h-3 w-3" />
          {isActive && <span className="sr-only">Filter active</span>}
        </Button>
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
              onValueChange={(v) => setOperator(v as FilterOperator)}
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
