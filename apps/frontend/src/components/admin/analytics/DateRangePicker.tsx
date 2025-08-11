'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/shadcn/popover';
import { CalendarIcon } from 'lucide-react';

interface DateRangePickerProps {
  value: {
    startDate: string;
    endDate: string;
  };
  onChange: (range: { startDate: string; endDate: string }) => void;
}

const presetRanges = [
  { label: 'Last 24 Hours', startDate: '1daysAgo', endDate: 'today' },
  { label: 'Last 7 Days', startDate: '7daysAgo', endDate: 'today' },
  { label: 'Last 30 Days', startDate: '30daysAgo', endDate: 'today' },
  { label: 'Last 90 Days', startDate: '90daysAgo', endDate: 'today' },
];

export default function DateRangePicker({
  value,
  onChange,
}: DateRangePickerProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(value.startDate);
  const [customEndDate, setCustomEndDate] = useState(value.endDate);

  const currentPreset = presetRanges.find(
    (range) =>
      range.startDate === value.startDate && range.endDate === value.endDate,
  );

  const handlePresetChange = (presetValue: string) => {
    if (presetValue === 'custom') {
      setIsCustom(true);
      return;
    }

    const preset = presetRanges.find(
      (range) => `${range.startDate}-${range.endDate}` === presetValue,
    );

    if (preset) {
      setIsCustom(false);
      onChange({
        startDate: preset.startDate,
        endDate: preset.endDate,
      });
    }
  };

  const handleCustomApply = () => {
    onChange({
      startDate: customStartDate,
      endDate: customEndDate,
    });
    setIsCustom(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarIcon className="h-4 w-4 mr-2" />
          {currentPreset ? currentPreset.label : 'Custom Range'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <Label>Date Range</Label>
            <Select
              value={
                currentPreset
                  ? `${currentPreset.startDate}-${currentPreset.endDate}`
                  : 'custom'
              }
              onValueChange={handlePresetChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {presetRanges.map((range) => (
                  <SelectItem
                    key={`${range.startDate}-${range.endDate}`}
                    value={`${range.startDate}-${range.endDate}`}
                  >
                    {range.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCustom && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  placeholder="7daysAgo, 2024-01-01"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use relative (7daysAgo) or absolute (YYYY-MM-DD) format
                </p>
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  placeholder="today, 2024-01-08"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use relative (today, now) or absolute (YYYY-MM-DD) format
                </p>
              </div>
              <Button onClick={handleCustomApply} size="sm" className="w-full">
                Apply Custom Range
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
