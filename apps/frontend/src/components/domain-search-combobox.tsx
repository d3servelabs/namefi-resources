'use client';

import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { cn } from '@namefi-astra/ui/lib/cn';
import { ChevronDown, Loader2 } from 'lucide-react';
import type { FocusEvent, KeyboardEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

export type DomainSearchOptionSource = 'owned' | 'feed' | 'generated';

export type DomainSearchOption = {
  value: string;
  sources: DomainSearchOptionSource[];
};

type DomainSearchComboboxProps = {
  id?: string;
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  options: DomainSearchOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  required?: boolean;
  allowCustomValue?: boolean;
  isLoading?: boolean;
  className?: string;
  triggerClassName?: string;
};

const sourceLabels = {
  owned: 'Purchased',
  feed: 'Feed',
  generated: 'Studio',
} satisfies Record<DomainSearchOptionSource, string>;

const sourceBadgeClassNames = {
  owned:
    'border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300',
  feed: 'border-sky-400/30 bg-sky-400/10 text-sky-600 dark:text-sky-300',
  generated:
    'border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-300',
} satisfies Record<DomainSearchOptionSource, string>;

const PROTOCOL_PATTERN = /^https?:\/\//;
const WHITESPACE_PATTERN = /\s+/g;
const TRAILING_DOT_PATTERN = /\.+$/;

export function DomainSearchCombobox({
  id,
  name,
  value,
  onValueChange,
  onBlur,
  options,
  placeholder = 'Select or enter a domain',
  searchPlaceholder = 'Search domains...',
  emptyMessage = 'No matching domains.',
  disabled = false,
  required = false,
  allowCustomValue = true,
  isLoading = false,
  className,
  triggerClassName,
}: DomainSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = id ? `${id}-domain-options` : undefined;
  const inputValue = allowCustomValue ? value : searchValue;
  const selectedValue = normalizeDomainComboboxValue(value);
  const normalizedSearchValue = normalizeDomainComboboxValue(inputValue);

  useEffect(() => {
    if (!allowCustomValue || !open) {
      setSearchValue(value);
    }
  }, [allowCustomValue, open, value]);

  const filteredOptions = useMemo(() => {
    if (!normalizedSearchValue) return options;

    return options.filter((option) =>
      option.value.toLowerCase().includes(normalizedSearchValue),
    );
  }, [normalizedSearchValue, options]);

  const hasExactMatch = options.some(
    (option) => option.value.toLowerCase() === normalizedSearchValue,
  );
  const canUseCustomValue =
    allowCustomValue &&
    isDomainLikeCustomValue(normalizedSearchValue) &&
    !hasExactMatch;
  const showEmptyMessage =
    !isLoading && !canUseCustomValue && filteredOptions.length === 0;

  const handleInputChange = (nextValue: string) => {
    if (allowCustomValue) {
      onValueChange(nextValue);
    } else {
      setSearchValue(nextValue);
    }
    setOpen(true);
  };

  const handleBlur = (event: FocusEvent<HTMLFieldSetElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setOpen(false);
    setSearchValue(value);
    onBlur?.();
  };

  const handleSelect = (nextValue: string) => {
    onValueChange(nextValue);
    setSearchValue(nextValue);
    setOpen(false);
    onBlur?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      setSearchValue(value);
      return;
    }

    if (event.key === 'ArrowDown') {
      setOpen(true);
      return;
    }

    if (event.key === 'Enter' && open && canUseCustomValue) {
      event.preventDefault();
      handleSelect(normalizedSearchValue);
    }
  };

  return (
    <fieldset
      className={cn('relative m-0 w-full min-w-0 border-0 p-0', className)}
      onBlur={handleBlur}
    >
      {name ? (
        <input
          type="hidden"
          name={name}
          value={selectedValue}
          required={required}
        />
      ) : null}
      <Input
        id={id}
        ref={inputRef}
        value={inputValue}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-label={searchPlaceholder}
        className={cn(
          'h-10 w-full bg-background pr-10 font-normal',
          triggerClassName,
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        aria-label={
          open ? 'Close domain suggestions' : 'Open domain suggestions'
        }
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          setOpen((currentOpen) => !currentOpen);
          inputRef.current?.focus();
        }}
        className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        <ChevronDown
          data-icon="inline-end"
          className={cn('size-4 transition-transform', open && 'rotate-180')}
        />
      </Button>

      {open && !disabled ? (
        <DomainSearchListbox
          id={listboxId}
          isLoading={isLoading}
          canUseCustomValue={canUseCustomValue}
          customValue={normalizedSearchValue}
          options={filteredOptions}
          selectedValue={selectedValue}
          emptyMessage={emptyMessage}
          showEmptyMessage={showEmptyMessage}
          onSelect={handleSelect}
        />
      ) : null}
    </fieldset>
  );
}

function DomainSearchListbox({
  id,
  isLoading,
  canUseCustomValue,
  customValue,
  options,
  selectedValue,
  emptyMessage,
  showEmptyMessage,
  onSelect,
}: {
  id?: string;
  isLoading: boolean;
  canUseCustomValue: boolean;
  customValue: string;
  options: DomainSearchOption[];
  selectedValue: string;
  emptyMessage: string;
  showEmptyMessage: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <div
      id={id}
      role="listbox"
      className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
    >
      <div className="max-h-72 overflow-auto p-1">
        {isLoading ? (
          <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading domains
          </div>
        ) : null}
        {canUseCustomValue ? (
          <div>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Use typed domain
            </div>
            <DomainOptionButton
              selected={false}
              onSelect={() => onSelect(customValue)}
            >
              <span className="min-w-0 truncate">Use {customValue}</span>
            </DomainOptionButton>
          </div>
        ) : null}
        {options.length > 0 ? (
          <div>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Domains
            </div>
            {options.map((option) => (
              <DomainOptionButton
                key={option.value}
                selected={selectedValue === option.value}
                onSelect={() => onSelect(option.value)}
              >
                <span className="min-w-0 flex-1 truncate font-mono text-sm">
                  {option.value}
                </span>
                <span className="ml-2 flex shrink-0 items-center gap-1">
                  {option.sources.map((source) => (
                    <Badge
                      key={`${option.value}-${source}`}
                      variant="outline"
                      className={cn(
                        'px-1.5 py-0 text-[10px] font-medium',
                        sourceBadgeClassNames[source],
                      )}
                    >
                      {sourceLabels[source]}
                    </Badge>
                  ))}
                </span>
              </DomainOptionButton>
            ))}
          </div>
        ) : null}
        {showEmptyMessage ? (
          <div className="px-3 py-3 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DomainOptionButton({
  children,
  selected,
  onSelect,
}: {
  children: ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className="relative flex w-full cursor-pointer select-none items-center justify-start rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
    >
      {children}
    </button>
  );
}

function normalizeDomainComboboxValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(PROTOCOL_PATTERN, '')
    .split('/')[0]
    .replace(WHITESPACE_PATTERN, '')
    .replace(TRAILING_DOT_PATTERN, '');
}

function isDomainLikeCustomValue(value: string) {
  return value.includes('.');
}
