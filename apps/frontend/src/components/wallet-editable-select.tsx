'use client';

import { Input } from '@namefi-astra/ui/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';
import { cn } from '@namefi-astra/ui/lib/cn';
import { getShortAddress } from '@/lib/string';
import type { ChangeEvent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useResizeObserver } from 'usehooks-ts';
import { NetworkLogo } from './network-logo';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { useAllowedChains } from '@/hooks/use-allowed-chains';

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
  parentDomain?: string;
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
  parentDomain,
}: WalletEditableSelectProps) {
  const { nftChains: chains, defaultNftChainId: defaultChainId } =
    useAllowedChains(parentDomain);
  const activeChainId = selectedChainId ?? defaultChainId;
  // Track both the input value and what's selected in the dropdown
  const [localValue, setLocalValue] = useState({
    input: value,
    selected: value,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const { width = 0 } = useResizeObserver({
    // @ts-expect-error: Remove this once usehooks-ts releases bug-fix https://github.com/juliencrn/usehooks-ts/issues/681
    ref: inputContainerRef,
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
    (newValue: string | null) => {
      if (!newValue) return;
      setLocalValue({ input: newValue, selected: newValue });
      onValueChange(newValue);
    },
    [onValueChange],
  );

  const allowChangeChain = useMemo(() => {
    return chains.length > 0 && onChainIdChange;
  }, [chains, onChainIdChange]);
  const selectedChain = useMemo(() => {
    return chains.find((chain) => chain.id === activeChainId);
  }, [activeChainId, chains]);
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center w-full">
        {allowChangeChain && (
          <Select
            value={selectedChainId?.toString() ?? defaultChainId.toString()}
            onValueChange={(value) => {
              if (!value) return;
              onChainIdChange?.(Number.parseInt(value));
            }}
          >
            <SelectTrigger className="h-12 py-5.5 mr-1">
              <SelectValue placeholder="Select a Chain">
                {selectedChain ? (
                  <span className="flex items-center gap-2">
                    <NetworkLogo
                      network={selectedChain.id}
                      className="size-4"
                    />
                    {selectedChain.name}
                  </span>
                ) : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              align="end"
              sideOffset={8}
              alignItemWithTrigger={false}
              className="p-1"
            >
              {chains.map((chain) => (
                <SelectItem key={chain.id} value={chain.id.toString()}>
                  <NetworkLogo network={chain.id} className="size-4" />
                  {chain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="relative flex-1" ref={inputContainerRef}>
          {icon ? (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
              {icon}
            </div>
          ) : null}

          <Input
            value={localValue.input}
            onChange={handleInputChange}
            placeholder={placeholder}
            ref={inputRef}
            className={cn(
              'h-12 rounded-md px-3 py-1',
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
              <SelectTrigger className="absolute right-3 top-1/2 -translate-y-1/2 border-none dark:bg-transparent" />
              <SelectContent
                align="end"
                alignOffset={-12}
                alignItemWithTrigger={false}
                side="bottom"
                sideOffset={10}
                className="min-w-[18rem] p-1"
                style={{
                  // Ensure the dropdown is readable even before the resize observer reports.
                  width: width ? `${width}px` : '28rem',
                  maxWidth: 'min(90vw, 42rem)',
                }}
              >
                {options.map((option) => (
                  <SelectItem
                    key={option.walletAddress}
                    value={option.walletAddress}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Badge>
                        {option.isLinkedWallet ? 'Linked' : 'Connected'}
                      </Badge>
                      <NetworkLogo network={activeChainId} className="size-4" />
                      <span
                        className={cn('font-mono', isMobile ? '' : 'truncate')}
                      >
                        {isMobile
                          ? getShortAddress(option.walletAddress)
                          : option.walletAddress}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
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
