import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/shadcn/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/shadcn/accordion';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Badge } from '@/components/ui/shadcn/badge';
import { Filter } from 'lucide-react';
import type { ColumnFiltersState } from '@tanstack/react-table';
import { cn } from '@/lib/cn';

type FilterOperator = 'like' | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';

type FilterValue = {
  operator: FilterOperator;
  value: string | number | Date;
};

type FilterConfig = {
  [columnId: string]: {
    type: 'text' | 'number' | 'date' | 'select';
    label?: string;
    options?: { value: string; label: string }[];
  };
};

type CustomFilterField = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  value?: string | number;
  onChange: (value: string | number | undefined) => void;
  onClear?: () => void;
};

type TableFilterPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterConfig: FilterConfig;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  customFilters?: CustomFilterField[];
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

function FilterField({
  columnId,
  config,
  value,
  onChange,
}: {
  columnId: string;
  config: FilterConfig[string];
  value: FilterValue | undefined;
  onChange: (value: FilterValue | undefined) => void;
}) {
  const operators = OPERATORS_BY_TYPE[config.type] ?? OPERATORS_BY_TYPE.text;
  const defaultOperator = operators[0]?.value ?? 'eq';

  const [operator, setOperator] = useState<FilterOperator>(
    value?.operator ?? defaultOperator,
  );
  const [filterValue, setFilterValue] = useState<string>(
    formatFilterInputValue(value?.value) ?? '',
  );

  useEffect(() => {
    setOperator(value?.operator ?? defaultOperator);
    setFilterValue(formatFilterInputValue(value?.value) ?? '');
  }, [value?.operator, value?.value, defaultOperator]);

  const handleApply = () => {
    if (!filterValue) {
      onChange(undefined);
    } else {
      let processedValue: string | number | Date = filterValue;

      if (config.type === 'number') {
        processedValue = Number(filterValue);
        if (Number.isNaN(processedValue)) {
          return;
        }
      } else if (config.type === 'date') {
        processedValue = new Date(filterValue);
        if (Number.isNaN(processedValue.getTime())) {
          return;
        }
      }

      onChange({ operator, value: processedValue });
    }
  };

  const handleClear = () => {
    setFilterValue('');
    setOperator(defaultOperator);
    onChange(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor={`filter-operator-${columnId}`}
          className="text-xs font-medium text-foreground"
        >
          Operator
        </label>
        <Select
          value={operator}
          onValueChange={(v) => setOperator(v as FilterOperator)}
        >
          <SelectTrigger id={`filter-operator-${columnId}`} className="h-9">
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
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`filter-value-${columnId}`}
          className="text-xs font-medium text-foreground"
        >
          Value
        </label>
        {config.type === 'select' && config.options ? (
          <Select value={filterValue} onValueChange={(v) => setFilterValue(v)}>
            <SelectTrigger id={`filter-value-${columnId}`} className="h-9">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {config.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={`filter-value-${columnId}`}
            type={
              config.type === 'number'
                ? 'number'
                : config.type === 'date'
                  ? 'date'
                  : 'text'
            }
            placeholder={`Enter ${config.label?.toLowerCase() || 'value'}...`}
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleApply();
              }
            }}
            className="h-9"
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
          disabled={!value}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

function CustomFilter({ filter }: { filter: CustomFilterField }) {
  const [localValue, setLocalValue] = useState<string>(
    filter.value !== undefined ? String(filter.value) : '',
  );
  useEffect(() => {
    setLocalValue(filter.value !== undefined ? String(filter.value) : '');
  }, [filter.value]);
  const handleApply = () => {
    if (!localValue) {
      filter.onChange(undefined);
    } else {
      let processedValue: string | number = localValue;
      if (filter.type === 'number') {
        processedValue = Number(localValue);
        if (Number.isNaN(processedValue)) {
          return;
        }
      }
      filter.onChange(processedValue);
    }
  };

  const handleClear = () => {
    setLocalValue('');
    filter.onChange(undefined);
    filter.onClear?.();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor={`custom-filter-${filter.id}`}
          className="text-xs font-medium text-foreground"
        >
          Value
        </label>
        {filter.type === 'select' && filter.options ? (
          <Select value={localValue} onValueChange={(v) => setLocalValue(v)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder={filter.placeholder || 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={`custom-filter-${filter.id}`}
            type={
              filter.type === 'number'
                ? 'number'
                : filter.type === 'date'
                  ? 'date'
                  : 'text'
            }
            placeholder={
              filter.placeholder || `Enter ${filter.label.toLowerCase()}...`
            }
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleApply();
              }
            }}
            className="h-9"
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
          disabled={
            filter.value === undefined ||
            filter.value === null ||
            filter.value === ''
          }
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

export function TableFilterPanel({
  open,
  onOpenChange,
  filterConfig,
  columnFilters,
  onColumnFiltersChange,
  customFilters = [],
}: TableFilterPanelProps) {
  const activeFiltersCount =
    columnFilters.length +
    customFilters.filter((f) => f.value !== undefined && f.value !== '').length;

  const handleFilterChange = (
    columnId: string,
    value: FilterValue | undefined,
  ) => {
    // Both server-side and client-side now use the operator/value object
    const newFilters = value
      ? [
          ...columnFilters.filter((f) => f.id !== columnId),
          { id: columnId, value },
        ]
      : columnFilters.filter((f) => f.id !== columnId);
    onColumnFiltersChange(newFilters);
  };

  const handleClearAll = () => {
    onColumnFiltersChange([]);
    // Clear all custom filters
    customFilters.forEach((filter) => {
      filter.onChange(undefined);
      filter.onClear?.();
    });
  };

  const getFilterValue = (columnId: string): FilterValue | undefined => {
    const filter = columnFilters.find((f) => f.id === columnId);
    if (!filter || filter.value === undefined) return undefined;

    // All filters now use the operator/value object format
    if (
      typeof filter.value === 'object' &&
      filter.value !== null &&
      'operator' in filter.value &&
      'value' in filter.value
    ) {
      return filter.value as FilterValue;
    }

    // Fallback: if somehow a simple value is passed, wrap it
    return {
      operator: 'like',
      value: filter.value as string | number | Date,
    };
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[625px] overflow-y-auto px-2 sm:px-4 pt-2">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Table Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount} active</Badge>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-auto p-1"
              >
                Clear all
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            Apply filters to narrow down your table results
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Custom Filters Section */}
          {customFilters.length > 0 && (
            <div className="space-y-4 pb-6 border-b border-border">
              <div className="flex items-center gap-3 px-1">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  General Filters
                </h3>
                <div className="h-px flex-1 bg-border" />
              </div>
              <Accordion type="multiple" className="w-full">
                {customFilters.map((filter) => {
                  const isActive =
                    filter.value !== undefined && filter.value !== '';
                  return (
                    <AccordionItem
                      key={filter.id}
                      value={filter.id}
                      className="border-none"
                    >
                      <AccordionTrigger
                        className={cn(
                          'hover:no-underline px-3 py-3 hover:bg-muted/70 rounded-md transition-colors',
                          isActive && 'bg-primary/5',
                        )}
                      >
                        <div className="flex items-center justify-between w-full pr-2">
                          <span
                            className={cn(
                              'text-sm font-medium',
                              isActive && 'text-primary',
                            )}
                          >
                            {filter.label}
                          </span>
                          {isActive && (
                            <Badge
                              variant="default"
                              className="ml-2 text-xs bg-primary"
                            >
                              Active
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pt-2">
                        <CustomFilter filter={filter} />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}

          {/* Column Filters Section */}
          {Object.keys(filterConfig).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Column Filters
                </h3>
                <div className="h-px flex-1 bg-border" />
              </div>
              <Accordion type="multiple" className="w-full">
                {Object.entries(filterConfig).map(([columnId, config]) => {
                  const filterValue = getFilterValue(columnId);
                  const isActive = !!filterValue;

                  return (
                    <AccordionItem
                      key={columnId}
                      value={columnId}
                      className="border-none"
                    >
                      <AccordionTrigger
                        className={cn(
                          'hover:no-underline px-3 py-3 hover:bg-muted/70 rounded-md transition-colors',
                          isActive && 'bg-primary/5',
                        )}
                      >
                        <div className="flex items-center justify-between w-full pr-2">
                          <span
                            className={cn(
                              'text-sm font-medium',
                              isActive && 'text-primary',
                            )}
                          >
                            {config.label || columnId}
                          </span>
                          {isActive && (
                            <Badge
                              variant="default"
                              className="ml-2 text-xs bg-primary"
                            >
                              Active
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pt-2">
                        <FilterField
                          columnId={columnId}
                          config={config}
                          value={filterValue}
                          onChange={(value) =>
                            handleFilterChange(columnId, value)
                          }
                        />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}

          {Object.keys(filterConfig).length === 0 &&
            customFilters.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No filters available
              </div>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
