'use client';

import { NaturalLanguageDatePicker } from '@/components/date-picker/natural-language-date-picker';
import { DrizzlerFilterPanel } from '@/components/table/filters/components/drizzler-filter-panel';
import type {
  DrizzlerFilterFieldConfig,
  DrizzlerFilterState,
} from '@/components/table/filters/types';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { Filter, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { subDays } from 'date-fns';
import type { DateRangeInput } from './types';
import {
  formatDateForBackend,
  renderParsedDateTagline,
  toNaturalDateValue,
} from './utils';

const emptyFilterConfig: Record<string, DrizzlerFilterFieldConfig> = {};

export function GlobalFiltersCard({
  dateRange,
  onDateRangeChange,
  searchTerm,
  filterState,
  filterConfig,
  activeFilterCount,
  onSearchTermChange,
  onFilterStateChange,
  onReset,
}: {
  dateRange: DateRangeInput;
  onDateRangeChange: (dateRange: DateRangeInput) => void;
  searchTerm: string;
  filterState: DrizzlerFilterState;
  filterConfig: Record<string, DrizzlerFilterFieldConfig>;
  activeFilterCount: number;
  onSearchTermChange: (value: string) => void;
  onFilterStateChange: (value: DrizzlerFilterState) => void;
  onReset: () => void;
}) {
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const advancedFilterCount =
    Object.keys(filterState.columnFilters).length +
    Object.keys(filterState.customFilters).length;

  return (
    <Card data-testid="admin.financials.global-filters">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Global Filters</CardTitle>
            <CardDescription>
              These filters apply to summaries, charts, detail tables, and
              backend exports.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={activeFilterCount === 0 && searchTerm.length === 0}
            data-testid="admin.financials.global-filters.reset"
          >
            <RotateCcw className="h-4 w-4 me-2" />
            Reset Global Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
          <FinancialDateRangeControl
            value={dateRange}
            onChange={onDateRangeChange}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="financial-global-search">Search</Label>
              <Input
                id="financial-global-search"
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                placeholder="Orders, users, domains, wallets, payments..."
                data-testid="admin.financials.global-filters.search"
              />
            </div>
            <div className="space-y-2">
              <Label>Advanced Filters</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setFilterPanelOpen(true)}
                data-testid="admin.financials.global-filters.configure"
              >
                <Filter className="h-4 w-4 me-2" />
                Configure Filters
                {advancedFilterCount > 0 && (
                  <Badge variant="secondary" className="ms-2">
                    {advancedFilterCount}
                  </Badge>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Filter by order status, auto-renewal, and legacy backfill with
                multiple conditions.
              </p>
            </div>
          </div>
        </div>
        <DrizzlerFilterPanel
          open={filterPanelOpen}
          onOpenChange={setFilterPanelOpen}
          filterState={filterState}
          filterConfig={emptyFilterConfig}
          customFiltersConfig={filterConfig}
          onFilterStateChange={onFilterStateChange}
          onClearAll={() =>
            onFilterStateChange({ columnFilters: {}, customFilters: {} })
          }
        />
      </CardContent>
    </Card>
  );
}

function FinancialDateRangeControl({
  value,
  onChange,
}: {
  value: DateRangeInput;
  onChange: (value: DateRangeInput) => void;
}) {
  const [startValue, setStartValue] = useState(() =>
    toNaturalDateValue(value.startDate),
  );
  const [endValue, setEndValue] = useState(() =>
    toNaturalDateValue(value.endDate),
  );

  useEffect(() => {
    setStartValue(toNaturalDateValue(value.startDate));
    setEndValue(toNaturalDateValue(value.endDate));
  }, [value.startDate, value.endDate]);

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    const next = {
      startDate: formatDateForBackend(start),
      endDate: formatDateForBackend(end),
    };
    setStartValue(toNaturalDateValue(next.startDate));
    setEndValue(toNaturalDateValue(next.endDate));
    onChange(next);
  };

  return (
    <div
      className="space-y-3 rounded-lg border bg-muted/20 p-3"
      data-testid="admin.financials.date-range"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label>Order Created Date</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Type natural language or pick exact dates from the calendar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset(7)}
            data-testid="admin.financials.date-range.preset-7d"
          >
            7D
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset(30)}
            data-testid="admin.financials.date-range.preset-30d"
          >
            30D
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset(90)}
            data-testid="admin.financials.date-range.preset-90d"
          >
            90D
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <NaturalLanguageDatePicker
          label="Start"
          hideLabel={false}
          hideTagline={false}
          taglineContent={renderParsedDateTagline}
          value={startValue}
          onChange={(next) => {
            setStartValue(next);
            if (next.date) {
              onChange({
                ...value,
                startDate: formatDateForBackend(next.date),
              });
            }
          }}
        />
        <NaturalLanguageDatePicker
          label="End"
          hideLabel={false}
          hideTagline={false}
          taglineContent={renderParsedDateTagline}
          value={endValue}
          onChange={(next) => {
            setEndValue(next);
            if (next.date) {
              onChange({
                ...value,
                endDate: formatDateForBackend(next.date),
              });
            }
          }}
        />
      </div>
    </div>
  );
}
