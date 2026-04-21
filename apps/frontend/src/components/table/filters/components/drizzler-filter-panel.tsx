import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@namefi-astra/ui/components/shadcn/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@namefi-astra/ui/components/shadcn/accordion';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Filter } from 'lucide-react';
import { cn } from '@namefi-astra/ui/lib/cn';
import { DrizzlerFilterField } from './drizzler-filter-field';
import type {
  DrizzlerFilterFieldConfig as DrizzlerFilterFieldType,
  DrizzlerFilterState,
  DrizzlerFilterCondition,
  SingleFilterState,
} from '../types';
import { useMemo } from 'react';

type DrizzlerFilterPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterState: DrizzlerFilterState;
  filterConfig: Record<string, DrizzlerFilterFieldType>;
  customFiltersConfig?: Record<string, DrizzlerFilterFieldType>;
  onFilterStateChange: (state: DrizzlerFilterState) => void;
  onClearAll: () => void;
};

export function DrizzlerFilterPanel({
  open,
  onOpenChange,
  filterState,
  filterConfig,
  customFiltersConfig,
  onFilterStateChange,
  onClearAll,
  getFieldSuggestions,
}: DrizzlerFilterPanelProps & {
  getFieldSuggestions?: (args: {
    fieldId: string;
    field: DrizzlerFilterFieldType;
    filterState: DrizzlerFilterState;
  }) => { value: string; label: string; type?: 'wallet' }[];
}) {
  const activeFilterCount =
    Object.keys(filterState.columnFilters).length +
    Object.keys(filterState.customFilters).length;

  // Single unified handler for both column and custom filters
  const handleFilterChange = (
    type: 'column' | 'custom',
    fieldId: string,
    conditions: DrizzlerFilterCondition[],
    logicalOperator: 'and' | 'or',
  ) => {
    const isColumn = type === 'column';
    const targetFilters = isColumn
      ? filterState.columnFilters
      : filterState.customFilters;
    const otherFilters = isColumn
      ? filterState.customFilters
      : filterState.columnFilters;

    const newFilters = { ...targetFilters };

    if (conditions.length === 0) {
      delete newFilters[fieldId];
    } else {
      newFilters[fieldId] = { operator: logicalOperator, conditions };
    }

    onFilterStateChange({
      columnFilters: isColumn ? newFilters : otherFilters,
      customFilters: isColumn ? otherFilters : newFilters,
    });
  };

  const handleClearFilter = (type: 'column' | 'custom', fieldId: string) => {
    const isColumn = type === 'column';
    const targetFilters = isColumn
      ? filterState.columnFilters
      : filterState.customFilters;
    const otherFilters = isColumn
      ? filterState.customFilters
      : filterState.columnFilters;

    const newFilters = { ...targetFilters };
    delete newFilters[fieldId];

    onFilterStateChange({
      columnFilters: isColumn ? newFilters : otherFilters,
      customFilters: isColumn ? otherFilters : newFilters,
    });
  };

  const getFilterForField = (
    type: 'column' | 'custom',
    fieldId: string,
  ): SingleFilterState | undefined => {
    return type === 'column'
      ? filterState.columnFilters[fieldId]
      : filterState.customFilters[fieldId];
  };

  // Use customFiltersConfig prop directly
  const customFilterConfigsArray = useMemo(
    () => Object.entries(customFiltersConfig ?? {}),
    [customFiltersConfig],
  );
  const columnFilterConfigsArray = useMemo(
    () => Object.entries(filterConfig ?? {}),
    [filterConfig],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[625px] overflow-y-auto px-2 sm:px-4 pt-2">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Advanced Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary">{activeFilterCount} active</Badge>
              )}
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-auto p-1"
              >
                Clear all
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            Build complex filters with multiple conditions and AND/OR logic
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Custom Filters Section */}
          {customFilterConfigsArray.length > 0 && (
            <div className="space-y-4 pb-6 border-b border-border">
              <div className="flex items-center gap-3 px-1">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  General Filters
                </h3>
                <div className="h-px flex-1 bg-border" />
              </div>
              <Accordion multiple className="w-full">
                {customFilterConfigsArray.map(([fieldId, field]) => {
                  const filterForField = getFilterForField('custom', fieldId);
                  const isActive = !!filterForField;
                  const suggestions = getFieldSuggestions?.({
                    fieldId,
                    field,
                    filterState,
                  });

                  return (
                    <AccordionItem
                      key={fieldId}
                      value={fieldId}
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
                            {field.label}
                          </span>
                          {isActive && (
                            <Badge
                              variant="default"
                              className="ml-2 text-xs bg-primary"
                            >
                              {filterForField.conditions.length} condition
                              {filterForField.conditions.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pt-2">
                        <DrizzlerFilterField
                          field={field}
                          conditions={filterForField?.conditions ?? []}
                          logicalOperator={filterForField?.operator ?? 'and'}
                          onChange={(conditions, logicalOperator) =>
                            handleFilterChange(
                              'custom',
                              fieldId,
                              conditions,
                              logicalOperator,
                            )
                          }
                          onClear={() => handleClearFilter('custom', fieldId)}
                          suggestions={suggestions}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}

          {/* Column Filters Section */}
          {columnFilterConfigsArray.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Column Filters
                </h3>
                <div className="h-px flex-1 bg-border" />
              </div>
              <Accordion multiple className="w-full">
                {columnFilterConfigsArray.map(([fieldId, field]) => {
                  const filterForField = getFilterForField('column', fieldId);
                  const isActive = !!filterForField;
                  const suggestions = getFieldSuggestions?.({
                    fieldId,
                    field,
                    filterState,
                  });

                  return (
                    <AccordionItem
                      key={fieldId}
                      value={fieldId}
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
                            {field.label}
                          </span>
                          {isActive && (
                            <Badge
                              variant="default"
                              className="ml-2 text-xs bg-primary"
                            >
                              {filterForField.conditions.length} condition
                              {filterForField.conditions.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pt-2">
                        <DrizzlerFilterField
                          field={field}
                          conditions={filterForField?.conditions ?? []}
                          logicalOperator={filterForField?.operator ?? 'and'}
                          onChange={(conditions, logicalOperator) =>
                            handleFilterChange(
                              'column',
                              fieldId,
                              conditions,
                              logicalOperator,
                            )
                          }
                          onClear={() => handleClearFilter('column', fieldId)}
                          suggestions={suggestions}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}

          {columnFilterConfigsArray.length === 0 &&
            customFilterConfigsArray.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No filters available
              </div>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
