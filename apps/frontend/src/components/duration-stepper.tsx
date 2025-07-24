'use client';

import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { cn } from '@/lib/cn';
import { Minus, Plus } from 'lucide-react';
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDebounceCallback } from 'usehooks-ts';

interface DurationStepperProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
  className?: string;
  suffix?: string;
}

export function DurationStepper({
  value,
  onChange,
  min,
  max,
  disabled = false,
  className,
  suffix = 'years',
}: DurationStepperProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

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
        const clampedValue = Math.min(Math.max(numValue, min), max);
        debouncedOnChange(clampedValue);
      }
    },
    [min, max, debouncedOnChange],
  );

  const handleBlur = useCallback(() => {
    const numValue = Number.parseInt(inputValue, 10);
    if (Number.isNaN(numValue)) {
      setInputValue(value.toString());
    } else {
      const clampedValue = Math.min(Math.max(numValue, min), max);
      setInputValue(clampedValue.toString());
      onChange(clampedValue);
    }
  }, [inputValue, value, min, max, onChange]);

  const increment = useCallback(() => {
    const newValue = Math.min(Number(inputValue) + 1, max);
    setInputValue(newValue.toString());
    onChange(newValue);
  }, [inputValue, max, onChange]);

  const decrement = useCallback(() => {
    const newValue = Math.max(Number(inputValue) - 1, min);
    setInputValue(newValue.toString());
    onChange(newValue);
  }, [inputValue, min, onChange]);

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
            className="w-20 pl-2 pr-12 text-right rounded-l-md rounded-r-none border-r-0 h-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:z-10"
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
            disabled={disabled || value >= max}
            className="h-1/2 w-8 rounded-none rounded-tr-md border-l-0 border-b border-border focus:z-10"
            tabIndex={-1}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={decrement}
            disabled={disabled || value <= min}
            className="h-1/2 w-8 rounded-none rounded-br-md border-l-0 border-t-0 border-border focus:z-10"
            tabIndex={-1}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
