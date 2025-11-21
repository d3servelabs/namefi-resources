'use client';

import { Input } from '@/components/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/cn';
import { getShortAddress } from '@/lib/string';
import { CHAINS } from '@namefi-astra/utils';
import type { ChangeEvent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useResizeObserver } from 'usehooks-ts';
import { NetworkLogo } from './network-logo';
import { Badge } from './ui/shadcn/badge';
import { useAllowedChains } from '@/hooks/use-allowed-chains';
import { useDefaultChainId } from '@/hooks/use-allowed-chains';

interface WalletEditableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options?: { walletAddress: string; isLinkedWallet: boolean }[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  helpText?: ReactNode;
  icon?: ReactNode;
  onChainIdChange?: (chainId: number) => void;
  selectedChainId?: number;
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
  onChainIdChange,
  selectedChainId,
}: WalletEditableSelectProps) {
  const { chains } = useAllowedChains();
  const defaultChainId = useDefaultChainId();
  // Track both the input value and what's selected in the dropdown
  const [localValue, setLocalValue] = useState({
    input: value,
    selected: value,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const { width = 0 } = useResizeObserver({
    // @ts-expect-error: Remove this once usehooks-ts releases bug-fix https://github.com/juliencrn/usehooks-ts/issues/681
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

  const allowChangeChain = useMemo(() => {
    return chains.length > 0 && onChainIdChange;
  }, [chains, onChainIdChange]);
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative flex items-center">
        {allowChangeChain && (
          <Select
            value={selectedChainId?.toString() ?? defaultChainId.toString()}
            onValueChange={(value) => {
              onChainIdChange?.(Number.parseInt(value));
            }}
          >
            <SelectTrigger className="h-12 py-5.5 mr-1">
              <SelectValue placeholder="Select a Chain" />
            </SelectTrigger>
            <SelectContent align="end">
              {chains.map((chain) => (
                <SelectItem key={chain.id} value={chain.id.toString()}>
                  <NetworkLogo network={chain.id} className="size-4" />
                  {chain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {!allowChangeChain && icon && (
          <div className="absolute left-3 flex items-center">{icon}</div>
        )}

        <Input
          value={localValue.input}
          onChange={handleInputChange}
          placeholder={placeholder}
          ref={inputRef}
          className={cn(
            'h-12 rounded-md px-3 py-1',
            !allowChangeChain && icon && 'pl-9',
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
        <div
          className={cn(
            'mt-1 text-sm min-h-[1.5rem]',
            error ? 'text-red-500' : 'text-secondary-foreground/50',
          )}
        >
          {error ? error : helpText}
        </div>
      )}
    </div>
  );
}
