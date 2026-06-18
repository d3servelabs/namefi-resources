'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { cn } from '@namefi-astra/ui/lib/cn';
import { Minus, Plus } from 'lucide-react';
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDebounceCallback } from 'usehooks-ts';

interface DurationStepperProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  allowedValues?: number[];
  disabled?: boolean;
  className?: string;
  suffix?: string;
}

function clampToRange(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeAllowedValues(
  allowedValues: number[] | undefined,
  min: number,
  max: number,
) {
  if (!allowedValues || allowedValues.length === 0) {
    return undefined;
  }
  const normalized = Array.from(
    new Set(
      allowedValues.filter(
        (allowedValue) =>
          Number.isInteger(allowedValue) &&
          allowedValue >= min &&
          allowedValue <= max,
      ),
    ),
  ).sort((a, b) => a - b);

  return normalized.length > 0 ? normalized : undefined;
}

function findClosestAllowedValue(value: number, allowedValues: number[]) {
  let closestValue = allowedValues[0];
  if (closestValue === undefined) {
    return value;
  }

  let closestDistance = Math.abs(closestValue - value);
  for (const allowedValue of allowedValues.slice(1)) {
    const distance = Math.abs(allowedValue - value);
    if (distance < closestDistance) {
      closestValue = allowedValue;
      closestDistance = distance;
    }
  }

  return closestValue;
}

function normalizeValue(
  value: number,
  min: number,
  max: number,
  allowedValues: number[] | undefined,
) {
  const clampedValue = clampToRange(value, min, max);
  if (!allowedValues) {
    return clampedValue;
  }
  return findClosestAllowedValue(clampedValue, allowedValues);
}

function getNextAllowedValue(value: number, allowedValues: number[]) {
  for (const allowedValue of allowedValues) {
    if (allowedValue > value) {
      return allowedValue;
    }
  }
  return allowedValues[allowedValues.length - 1] ?? value;
}

function getPreviousAllowedValue(value: number, allowedValues: number[]) {
  for (let index = allowedValues.length - 1; index >= 0; index -= 1) {
    const allowedValue = allowedValues[index];
    if (allowedValue !== undefined && allowedValue < value) {
      return allowedValue;
    }
  }
  return allowedValues[0] ?? value;
}

export function DurationStepper({
  value,
  onChange,
  min,
  max,
  allowedValues,
  disabled = false,
  className,
  suffix = 'years',
}: DurationStepperProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedAllowedValues = useMemo(
    () => normalizeAllowedValues(allowedValues, min, max),
    [allowedValues, min, max],
  );
  const minSelectableValue = normalizedAllowedValues?.[0] ?? min;
  const maxSelectableValue =
    normalizedAllowedValues?.[normalizedAllowedValues.length - 1] ?? max;

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const debouncedOnChange = useDebounceCallback(onChange, 300);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      const numValue = Number.parseInt(newValue, 10);
      if (!Number.isNaN(numValue)) {
        const normalizedValue = normalizeValue(
          numValue,
          min,
          max,
          normalizedAllowedValues,
        );
        debouncedOnChange(normalizedValue);
      }
    },
    [min, max, normalizedAllowedValues, debouncedOnChange],
  );

  const handleBlur = useCallback(() => {
    const numValue = Number.parseInt(inputValue, 10);
    if (Number.isNaN(numValue)) {
      setInputValue(value.toString());
    } else {
      const normalizedValue = normalizeValue(
        numValue,
        min,
        max,
        normalizedAllowedValues,
      );
      setInputValue(normalizedValue.toString());
      onChange(normalizedValue);
    }
  }, [inputValue, value, min, max, normalizedAllowedValues, onChange]);

  const increment = useCallback(() => {
    const currentInputValue = Number.parseInt(inputValue, 10);
    const currentValue = Number.isNaN(currentInputValue)
      ? value
      : currentInputValue;
    const newValue = normalizedAllowedValues
      ? getNextAllowedValue(currentValue, normalizedAllowedValues)
      : Math.min(currentValue + 1, max);
    setInputValue(newValue.toString());
    onChange(newValue);
  }, [inputValue, value, max, normalizedAllowedValues, onChange]);

  const decrement = useCallback(() => {
    const currentInputValue = Number.parseInt(inputValue, 10);
    const currentValue = Number.isNaN(currentInputValue)
      ? value
      : currentInputValue;
    const newValue = normalizedAllowedValues
      ? getPreviousAllowedValue(currentValue, normalizedAllowedValues)
      : Math.max(currentValue - 1, min);
    setInputValue(newValue.toString());
    onChange(newValue);
  }, [inputValue, value, min, normalizedAllowedValues, onChange]);

  // Keyboard support for up/down arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) {
        if (e.key === 'ArrowUp') {
          increment();
        } else if (e.key === 'ArrowDown') {
          decrement();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [increment, decrement]);

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex h-10">
        <div className="relative flex items-center">
          <Input
            ref={inputRef}
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled}
            min={min}
            max={max}
            step={normalizedAllowedValues ? 'any' : 1}
            className="w-20 ps-2 pe-12 text-end rounded-s-md rounded-e-none border-e-0 h-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:z-10"
          />
          <span className="absolute right-2 text-xs font-light text-muted-foreground pointer-events-none select-none">
            {suffix}
          </span>
        </div>
        <div className="flex flex-col h-full">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={increment}
            disabled={disabled || value >= maxSelectableValue}
            className="h-1/2 w-8 rounded-none rounded-se-md border-s-0 border-b border-border focus:z-10"
            tabIndex={-1}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={decrement}
            disabled={disabled || value <= minSelectableValue}
            className="h-1/2 w-8 rounded-none rounded-ee-md border-s-0 border-t-0 border-border focus:z-10"
            tabIndex={-1}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
