'use client';

import { NaturalLanguageDatePicker } from '@/components/date-picker/natural-language-date-picker';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { orderStatusValues } from '@namefi-astra/common/shared-schemas';
import { RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { subDays } from 'date-fns';
import { allSelectValue } from './constants';
import type { DateRangeInput, GlobalFilters } from './types';
import {
  formatDateForBackend,
  renderParsedDateTagline,
  toNaturalDateValue,
} from './utils';

export function GlobalFiltersCard({
  dateRange,
  onDateRangeChange,
  searchTerm,
  orderStatus,
  autoRenew,
  legacyBackfilled,
  activeFilterCount,
  onSearchTermChange,
  onOrderStatusChange,
  onAutoRenewChange,
  onLegacyBackfilledChange,
  onReset,
}: {
  dateRange: DateRangeInput;
  onDateRangeChange: (dateRange: DateRangeInput) => void;
  searchTerm: string;
  orderStatus: GlobalFilters['orderStatus'];
  autoRenew: boolean | undefined;
  legacyBackfilled: boolean | undefined;
  activeFilterCount: number;
  onSearchTermChange: (value: string) => void;
  onOrderStatusChange: (value: GlobalFilters['orderStatus']) => void;
  onAutoRenewChange: (value: boolean | undefined) => void;
  onLegacyBackfilledChange: (value: boolean | undefined) => void;
  onReset: () => void;
}) {
  return (
    <Card>
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
          >
            <RotateCcw className="h-4 w-4 mr-2" />
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
              />
            </div>
            <SelectFilter
              label="Order Status"
              value={orderStatus}
              options={orderStatusValues.map((status) => ({
                value: status,
                label: status,
              }))}
              onChange={(value) =>
                onOrderStatusChange(value as GlobalFilters['orderStatus'])
              }
            />
            <BooleanSelectFilter
              label="Auto-renew Order"
              value={autoRenew}
              trueLabel="Auto-renew only"
              falseLabel="Manual only"
              onChange={onAutoRenewChange}
            />
            <BooleanSelectFilter
              label="Legacy Backfilled"
              value={legacyBackfilled}
              trueLabel="Backfilled only"
              falseLabel="Native only"
              onChange={onLegacyBackfilledChange}
            />
          </div>
        </div>
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
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label>Order Created Date</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Type natural language or pick exact dates from the calendar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => applyPreset(7)}>
            7D
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset(30)}>
            30D
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset(90)}>
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

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string | undefined) => void;
}) {
  const selectedLabel = value
    ? (options.find((option) => option.value === value)?.label ?? value)
    : 'All';

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value ?? allSelectValue}
        onValueChange={(nextValue) => {
          if (!nextValue || nextValue === allSelectValue) {
            onChange(undefined);
            return;
          }
          onChange(nextValue);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={`All ${label.toLowerCase()}`}>
            {selectedLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={allSelectValue}>All</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function BooleanSelectFilter({
  label,
  value,
  trueLabel,
  falseLabel,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  trueLabel: string;
  falseLabel: string;
  onChange: (value: boolean | undefined) => void;
}) {
  return (
    <SelectFilter
      label={label}
      value={value === undefined ? undefined : String(value)}
      options={[
        { value: 'true', label: trueLabel },
        { value: 'false', label: falseLabel },
      ]}
      onChange={(nextValue) => {
        if (nextValue === undefined) {
          onChange(undefined);
          return;
        }
        onChange(nextValue === 'true');
      }}
    />
  );
}
