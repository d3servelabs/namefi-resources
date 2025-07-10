'use client';

import { Input } from '@/components/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/shadcn/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn, getShortAddress } from '@/lib/utils';
import { CHAINS } from '@namefi-astra/utils';
import type { ChangeEvent, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useResizeObserver } from 'usehooks-ts';
import { NetworkLogo } from './NetworkLogo';
import { Badge } from './ui/shadcn/badge';

interface WalletEditableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options?: { walletAddress: string; isLinkedWallet: boolean }[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  helpText?: string;
  icon?: ReactNode;
}

export function WalletEditableSelect({
  value,
  onValueChange,
  options = [],
  placeholder = '',
  error,
  disabled = false,
  className,
  helpText,
  icon,
}: WalletEditableSelectProps) {
  // Track both the input value and what's selected in the dropdown
  const [localValue, setLocalValue] = useState({
    input: value,
    selected: value,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const { width = 0 } = useResizeObserver({
    // @ts-ignore: Remove this once usehooks-ts releases bug-fix https://github.com/juliencrn/usehooks-ts/issues/681
    ref: inputRef,
    box: 'border-box',
  });
  const isMobile = useIsMobile();

  // Only update from props if the value is different from both input and selected
  useEffect(() => {
    setLocalValue((prev) => {
      if (value !== prev.input && value !== prev.selected) {
        return { input: value, selected: value };
      }
      return prev;
    });
  }, [value]);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue((prev) => ({ ...prev, input: newValue, selected: '' }));
      onValueChange(newValue);
    },
    [onValueChange],
  );

  const handleSelectChange = useCallback(
    (newValue: string) => {
      setLocalValue({ input: newValue, selected: newValue });
      onValueChange(newValue);
    },
    [onValueChange],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 flex items-center">{icon}</div>
        )}
        <Input
          value={localValue.input}
          onChange={handleInputChange}
          placeholder={placeholder}
          ref={inputRef}
          className={cn(
            'h-14 rounded-md px-3 py-1',
            icon && 'pl-9',
            options.length > 0 && 'pr-9',
            className,
          )}
          disabled={disabled}
        />
        {options.length > 0 && (
          <Select
            value={localValue.selected}
            onValueChange={handleSelectChange}
          >
            <SelectTrigger className="absolute right-3 border-none dark:bg-transparent" />
            <SelectContent
              align="end"
              alignOffset={-12}
              position="popper"
              side="bottom"
              sideOffset={10}
              style={{ width: width ? `${width}px` : undefined }}
            >
              {options.map((option) => (
                <SelectItem
                  key={option.walletAddress}
                  value={option.walletAddress}
                >
                  <div className="flex items-center gap-2">
                    <Badge>
                      {option.isLinkedWallet ? 'Linked' : 'Connected'}
                    </Badge>
                    <NetworkLogo network={CHAINS.base.id} className="size-4" />
                    {isMobile
                      ? getShortAddress(option.walletAddress)
                      : option.walletAddress}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {(error || helpText) && (
        <p
          className={cn(
            'text-sm mt-1',
            error ? 'text-red-500' : 'text-secondary-foreground/50',
          )}
        >
          {error || helpText}
        </p>
      )}
    </div>
  );
}
