import * as React from 'react';
import { type ReactNode, useMemo } from 'react';
import { parseDate } from 'chrono-node';
import { useTranslations } from 'next-intl';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Calendar } from '@namefi-astra/ui/components/shadcn/calendar';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';
import { cn } from '@namefi-astra/ui/lib/cn';

function formatDate(date: Date | undefined) {
  if (!date) {
    return '';
  }

  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function NaturalLanguageDatePicker({
  taglineContent,
  hideTagline = true,
  value,
  onChange,
  label,
  hideLabel = true,
  className,
}: {
  taglineContent?:
    | string
    | ((value: string, date: Date | undefined) => ReactNode);
  hideTagline?: boolean;
  value: { display: string; date: Date | undefined };
  onChange: (value: { display: string; date: Date | undefined }) => void;
  label?: string;
  hideLabel: boolean;
  className?: string;
}) {
  const t = useTranslations('shared');
  const date = useMemo(
    () => value.date ?? parseDate(value.display) ?? undefined,
    [value.date, value.display],
  );
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date | undefined>(date);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {!hideLabel && (
        <Label htmlFor="date" className="px-1">
          {label}
        </Label>
      )}

      <div className="relative flex gap-2">
        <Input
          id="date"
          value={value.display}
          placeholder={t('datePicker.naturalLanguagePlaceholder')}
          className="bg-background pe-10"
          onChange={(e) => {
            const date = parseDate(e.target.value);
            onChange({ display: e.target.value, date: date ?? undefined });
            if (date) {
              setMonth(date);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                id="date-picker"
                variant="ghost"
                className="absolute top-1/2 end-2 size-6 -translate-y-1/2"
              />
            }
          >
            <CalendarIcon className="size-3.5" />
            <span className="sr-only">{t('datePicker.selectDate')}</span>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={(date) => {
                onChange({
                  display: formatDate(date),
                  date: date ?? undefined,
                });
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {!hideTagline && (
        <div className="text-muted-foreground px-1 text-sm">
          {typeof taglineContent === 'function'
            ? taglineContent(value.display, date)
            : (taglineContent ?? '')}
        </div>
      )}
    </div>
  );
}
