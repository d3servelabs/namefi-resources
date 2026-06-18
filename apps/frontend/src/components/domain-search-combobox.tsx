'use client';

import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { cn } from '@namefi-astra/ui/lib/cn';
import { ChevronDown, Loader2 } from 'lucide-react';
import type { FocusEvent, KeyboardEvent, ReactNode } from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

export type DomainSearchOptionSource = 'owned' | 'feed' | 'studio' | 'outbound';

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
  feed: 'Namefi Feed',
  studio: 'Studio',
  outbound: 'Outbound',
} satisfies Record<DomainSearchOptionSource, string>;

const sourceBadgeClassNames = {
  owned:
    'border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300',
  feed: 'border-sky-400/30 bg-sky-400/10 text-sky-600 dark:text-sky-300',
  studio:
    'border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-300',
  outbound:
    'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-700 dark:text-fuchsia-300',
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const generatedId = useId();
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openRef = useRef(open);
  const listboxId = id ? `${id}-domain-options` : `${generatedId}-options`;
  const inputValue = allowCustomValue ? value : searchValue;
  const selectedValue = normalizeDomainComboboxValue(value);
  const normalizedSearchValue = normalizeDomainComboboxValue(inputValue);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!allowCustomValue || !open) {
      setSearchValue(value);
    }
  }, [allowCustomValue, open, value]);

  const openCombobox = useCallback(() => {
    if (disabled) return;

    openRef.current = true;
    setOpen(true);
  }, [disabled]);

  const closeCombobox = useCallback(() => {
    if (!openRef.current) return;

    openRef.current = false;
    setOpen(false);
    setSearchValue(value);
    onBlur?.();
  }, [onBlur, value]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        fieldsetRef.current?.contains(event.target)
      ) {
        return;
      }

      closeCombobox();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [closeCombobox, open]);

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
  const suggestionCount = (canUseCustomValue ? 1 : 0) + filteredOptions.length;
  const activeOptionId =
    open && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  useEffect(() => {
    if (!open || suggestionCount === 0) {
      setActiveIndex(-1);
      return;
    }

    const selectedOptionIndex = filteredOptions.findIndex(
      (option) => option.value === selectedValue,
    );
    setActiveIndex(
      selectedOptionIndex >= 0
        ? selectedOptionIndex + (canUseCustomValue ? 1 : 0)
        : 0,
    );
  }, [
    canUseCustomValue,
    filteredOptions,
    open,
    selectedValue,
    suggestionCount,
  ]);

  const getSuggestionValue = (index: number) => {
    if (index < 0 || index >= suggestionCount) return undefined;
    if (canUseCustomValue && index === 0) return normalizedSearchValue;
    return filteredOptions[index - (canUseCustomValue ? 1 : 0)]?.value;
  };

  const handleInputChange = (nextValue: string) => {
    if (allowCustomValue) {
      onValueChange(nextValue);
    } else {
      setSearchValue(nextValue);
    }
    openCombobox();
  };

  const handleBlur = (event: FocusEvent<HTMLFieldSetElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    closeCombobox();
  };

  const handleSelect = (nextValue: string) => {
    onValueChange(nextValue);
    setSearchValue(nextValue);
    openRef.current = false;
    setOpen(false);
    onBlur?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openCombobox();

      if (suggestionCount === 0) {
        setActiveIndex(-1);
        return;
      }

      setActiveIndex((currentIndex) => {
        if (currentIndex < 0) {
          return event.key === 'ArrowDown' ? 0 : suggestionCount - 1;
        }

        return event.key === 'ArrowDown'
          ? (currentIndex + 1) % suggestionCount
          : (currentIndex - 1 + suggestionCount) % suggestionCount;
      });
      return;
    }

    if (event.key === 'Escape') {
      closeCombobox();
      return;
    }

    if (event.key === 'Enter' && open) {
      const activeValue = getSuggestionValue(activeIndex);
      if (activeValue) {
        event.preventDefault();
        handleSelect(activeValue);
      }
    }
  };

  return (
    <fieldset
      ref={fieldsetRef}
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
        onFocus={openCombobox}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        role="combobox"
        aria-autocomplete="list"
        aria-activedescendant={activeOptionId}
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-label={searchPlaceholder}
        className={cn(
          'h-10 w-full bg-background pe-10 font-normal',
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
          setOpen((currentOpen) => {
            openRef.current = !currentOpen;
            return !currentOpen;
          });
          inputRef.current?.focus();
        }}
        className="absolute top-1/2 end-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        <ChevronDown
          data-icon="inline-end"
          className={cn('transition-transform', open && 'rotate-180')}
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
          activeIndex={activeIndex}
          emptyMessage={emptyMessage}
          showEmptyMessage={showEmptyMessage}
          onActiveIndexChange={setActiveIndex}
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
  activeIndex,
  emptyMessage,
  showEmptyMessage,
  onActiveIndexChange,
  onSelect,
}: {
  id?: string;
  isLoading: boolean;
  canUseCustomValue: boolean;
  customValue: string;
  options: DomainSearchOption[];
  selectedValue: string;
  activeIndex: number;
  emptyMessage: string;
  showEmptyMessage: boolean;
  onActiveIndexChange: (index: number) => void;
  onSelect: (value: string) => void;
}) {
  const optionIndexOffset = canUseCustomValue ? 1 : 0;

  return (
    <div
      id={id}
      role="listbox"
      className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
    >
      <div className="max-h-72 overflow-auto p-1">
        {isLoading ? (
          <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" />
            Loading domains
          </div>
        ) : null}
        {canUseCustomValue ? (
          <div>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Use typed domain
            </div>
            <DomainOptionButton
              id={`${id}-option-0`}
              value={customValue}
              selected={false}
              active={activeIndex === 0}
              onActive={() => onActiveIndexChange(0)}
              onSelect={onSelect}
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
            {options.map((option, optionIndex) => {
              const itemIndex = optionIndex + optionIndexOffset;

              return (
                <DomainOptionButton
                  key={option.value}
                  id={`${id}-option-${itemIndex}`}
                  value={option.value}
                  selected={selectedValue === option.value}
                  active={activeIndex === itemIndex}
                  onActive={() => onActiveIndexChange(itemIndex)}
                  onSelect={onSelect}
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-sm">
                    {option.value}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
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
              );
            })}
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
  id,
  value,
  selected,
  active,
  onActive,
  onSelect,
}: {
  children: ReactNode;
  id?: string;
  value: string;
  selected: boolean;
  active: boolean;
  onActive: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={active}
      data-checked={selected ? true : undefined}
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={onActive}
      onClick={() => onSelect(value)}
      className={cn(
        'relative flex w-full min-w-0 cursor-pointer select-none items-center justify-start gap-2 rounded-sm px-2 py-1.5 text-start text-sm outline-none',
        'hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground',
        active && 'bg-muted text-foreground',
      )}
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
