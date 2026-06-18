'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
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

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !Number.isNaN(date.getTime());
}

type DatePickerWithInputProps = {
  label?: string;
  value?: Date;
  /**
   * Callback fired when the date changes.
   * If provided, the component operates in controlled mode.
   * If omitted, the component operates in uncontrolled mode.
   */
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  id?: string;
  className?: string;
};

/**
 * Date picker component with input field and calendar popover.
 *
 * **Controllability**: The component is controlled if `onChange` is provided,
 * uncontrolled otherwise. The `value` prop can be `undefined` in both modes.
 *
 * @example
 * // Controlled mode
 * <DatePickerWithInput
 *   value={date}
 *   onChange={setDate}
 * />
 *
 * @example
 * // Uncontrolled mode
 * <DatePickerWithInput />
 */
export function DatePickerWithInput({
  label,
  value: controlledValue,
  onChange,
  placeholder = 'June 01, 2025',
  id = 'date',
  className,
}: DatePickerWithInputProps) {
  const [open, setOpen] = useState(false);
  const [uncontrolledDate, setUncontrolledDate] = useState<Date | undefined>(
    controlledValue ?? undefined,
  );
  const [month, setMonth] = useState<Date | undefined>(
    controlledValue ?? undefined,
  );
  const [inputValue, setInputValue] = useState(
    formatDate(controlledValue ?? undefined),
  );

  // Controllability is determined by onChange, not value (since value can be undefined)
  const date = onChange ? controlledValue : uncontrolledDate;
  const setDate = (newDate: Date | undefined) => {
    if (onChange) {
      onChange(newDate);
    } else {
      setUncontrolledDate(newDate);
    }
  };

  useEffect(() => {
    if (onChange) {
      // In controlled mode, sync input and month with controlledValue (even if undefined)
      setInputValue(formatDate(controlledValue));
      if (controlledValue !== undefined) {
        setMonth(controlledValue);
      }
    }
  }, [onChange, controlledValue]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setInputValue(inputVal);
    const parsedDate = new Date(inputVal);
    if (isValidDate(parsedDate)) {
      setDate(parsedDate);
      setMonth(parsedDate);
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setInputValue(formatDate(selectedDate));
    setMonth(selectedDate);
    setOpen(false);
  };

  return (
    <div className={className || 'flex flex-col gap-3'}>
      {label && (
        <Label htmlFor={id} className="px-1">
          {label}
        </Label>
      )}
      <div className="relative flex gap-2">
        <Input
          id={id}
          value={onChange ? formatDate(controlledValue) : inputValue}
          placeholder={placeholder}
          className="bg-background pe-10"
          onChange={handleInputChange}
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
                id={`${id}-picker`}
                variant="ghost"
                className="absolute top-1/2 end-2 size-6 -translate-y-1/2"
              />
            }
          >
            <CalendarIcon className="size-3.5" />
            <span className="sr-only">Select date</span>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0 z-[9999] pointer-events-auto"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={handleDateSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
