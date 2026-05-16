'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDebounceValue } from 'usehooks-ts';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@namefi-astra/ui/components/shadcn/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';
import { useTRPC } from '@/lib/trpc';
import type { UserOption, UserSelectComboBoxProps } from './types';

const DEFAULT_MAX_RESULTS = 20;
const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_CHARS = 2;

function getUserLabel(user: UserOption): string {
  if (user.primaryEmail) return user.primaryEmail;
  if (user.displayName) return user.displayName;
  if (user.walletAddresses.length > 0) return user.walletAddresses[0];
  return user.id;
}

function getUserSubLabel(user: UserOption): string | null {
  const primary = getUserLabel(user);
  const parts: string[] = [];
  if (user.displayName && user.displayName !== primary) {
    parts.push(user.displayName);
  }
  if (user.walletAddresses.length > 0) {
    const wallet = user.walletAddresses[0];
    if (wallet !== primary) {
      parts.push(`${wallet.slice(0, 6)}…${wallet.slice(-4)}`);
    }
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function UserSelectComboBox(props: UserSelectComboBoxProps) {
  const {
    placeholder,
    disabled,
    maxResults = DEFAULT_MAX_RESULTS,
    excludeUserIds,
    className,
    id,
    ariaLabel,
  } = props;
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [debouncedTerm] = useDebounceValue(term, SEARCH_DEBOUNCE_MS);

  const selectedIds = useMemo<string[]>(() => {
    if (props.mode === 'multiple') {
      return props.value.map((u) => u.id);
    }
    return props.value ? [props.value.id] : [];
  }, [props]);

  // Selected users are intentionally NOT excluded from server results — the
  // dropdown shows them with a checkmark so the same row can be used to
  // toggle off. Only the caller's explicit `excludeUserIds` are filtered.
  const effectiveExcludeIds = useMemo(
    () => excludeUserIds ?? [],
    [excludeUserIds],
  );

  const trimmedTerm = debouncedTerm.trim();
  const rawTrimmedTerm = term.trim();
  const meetsMinChars = trimmedTerm.length >= MIN_SEARCH_CHARS;
  // While the user is still typing (term differs from the debounced
  // value) we treat the input as "pending" so the dropdown shows a
  // single loading state instead of flickering between stale results
  // and the spinner.
  const isDebouncing =
    rawTrimmedTerm.length >= MIN_SEARCH_CHARS && term !== debouncedTerm;

  const searchQuery = useQuery({
    ...trpc.admin.users.searchUsersForPicker.queryOptions(
      {
        searchTerm: trimmedTerm,
        limit: maxResults,
        excludeUserIds:
          effectiveExcludeIds.length > 0 ? effectiveExcludeIds : undefined,
      },
      { trpc: { context: { skipBatch: true } } },
    ),
    enabled: open && meetsMinChars,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const results = meetsMinChars ? (searchQuery.data ?? []) : [];
  const isLoading = isDebouncing || searchQuery.isFetching;
  const hasError = searchQuery.isError;
  const errorMessage = searchQuery.error?.message ?? null;

  const maxSelected =
    props.mode === 'multiple' ? (props.maxSelected ?? null) : null;
  const atMaxSelected =
    props.mode === 'multiple' &&
    maxSelected !== null &&
    props.value.length >= maxSelected;

  const handleToggle = (user: UserOption) => {
    if (props.mode === 'single') {
      props.onChange(user);
      setOpen(false);
      setTerm('');
      return;
    }
    const exists = props.value.some((u) => u.id === user.id);
    if (exists) {
      props.onChange(props.value.filter((u) => u.id !== user.id));
      return;
    }
    if (atMaxSelected) return;
    // Keep the search term in multi mode — admins frequently pick several
    // users that share a prefix (e.g. an org domain), and re-typing it
    // after every chip would be noisy.
    props.onChange([...props.value, user]);
  };

  const handleRemoveChip = (userId: string) => {
    if (props.mode !== 'multiple') return;
    props.onChange(props.value.filter((u) => u.id !== userId));
  };

  const handleClearSingle = () => {
    if (props.mode !== 'single') return;
    props.onChange(null);
  };

  if (props.mode === 'single') {
    const selected = props.value;
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          aria-label={ariaLabel ?? 'Select user'}
          disabled={disabled}
          className={cn(
            'border-input bg-transparent dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          {selected ? (
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate">{getUserLabel(selected)}</span>
            </span>
          ) : (
            <span className="text-muted-foreground truncate">
              {placeholder ?? 'Search users…'}
            </span>
          )}
          <span className="flex items-center gap-1 shrink-0">
            {selected && !disabled ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  handleClearSingle();
                }}
                className="text-muted-foreground hover:text-foreground inline-flex items-center"
                aria-label="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <ChevronsUpDown className="text-muted-foreground h-4 w-4" />
          </span>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="dark bg-popover text-popover-foreground border-border w-[--anchor-width] min-w-[280px] border p-0 shadow-lg"
        >
          <SearchBody
            term={term}
            onTermChange={setTerm}
            placeholder={placeholder}
            results={results}
            selectedIds={selectedIds}
            isLoading={isLoading}
            hasError={hasError}
            errorMessage={errorMessage}
            meetsMinChars={meetsMinChars}
            onToggle={handleToggle}
            atMaxSelected={false}
          />
        </PopoverContent>
      </Popover>
    );
  }

  const selectedCount = props.value.length;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        aria-label={ariaLabel ?? 'Select users'}
        disabled={disabled}
        className={cn(
          'border-input bg-transparent dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-9 w-full items-center justify-between gap-2 rounded-md border px-2 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {props.value.map((user) => (
            <span
              key={user.id}
              className="bg-muted inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
              title={getUserLabel(user)}
            >
              <span className="max-w-[22ch] truncate">
                {getUserLabel(user)}
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  handleRemoveChip(user.id);
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${getUserLabel(user)}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selectedCount === 0 ? (
            <span className="text-muted-foreground px-1 truncate">
              {placeholder ?? 'Search users by email, name, wallet, or domain…'}
            </span>
          ) : null}
        </span>
        <ChevronsUpDown className="text-muted-foreground h-4 w-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="dark bg-popover text-popover-foreground border-border w-[--anchor-width] min-w-[320px] border p-0 shadow-lg"
      >
        <SearchBody
          term={term}
          onTermChange={setTerm}
          placeholder={placeholder}
          results={results}
          selectedIds={selectedIds}
          isLoading={isLoading}
          hasError={hasError}
          errorMessage={errorMessage}
          meetsMinChars={meetsMinChars}
          onToggle={handleToggle}
          atMaxSelected={atMaxSelected}
          maxSelected={maxSelected}
          selectedCount={selectedCount}
        />
      </PopoverContent>
    </Popover>
  );
}

function SearchBody({
  term,
  onTermChange,
  placeholder,
  results,
  selectedIds,
  isLoading,
  hasError,
  errorMessage,
  meetsMinChars,
  onToggle,
  atMaxSelected,
  maxSelected,
  selectedCount,
}: {
  term: string;
  onTermChange: (next: string) => void;
  placeholder?: string;
  results: UserOption[];
  selectedIds: string[];
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  meetsMinChars: boolean;
  onToggle: (user: UserOption) => void;
  atMaxSelected: boolean;
  maxSelected?: number | null;
  selectedCount?: number;
}) {
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  return (
    <Command shouldFilter={false} className="w-full">
      {/*
       * Concrete colors + `appearance-none` are required: the shadcn
       * `CommandInput` primitive wraps an `<input>` with only
       * width/text-size/outline classes — without an explicit reset the
       * user-agent default (white background, system text color, native
       * spin/search affordances) leaks through and the field looks
       * unstyled even when the surrounding popover is themed.
       */}
      <CommandInput
        value={term}
        onValueChange={onTermChange}
        placeholder={placeholder ?? 'Search by email, name, wallet, or domain…'}
        className="appearance-none bg-transparent text-foreground caret-foreground placeholder:text-muted-foreground"
      />
      {atMaxSelected && maxSelected ? (
        <div className="text-muted-foreground border-t px-3 py-2 text-xs">
          You've selected the maximum of {maxSelected}
          {typeof selectedCount === 'number' ? ` (${selectedCount})` : ''}.
          Remove a chip to add another.
        </div>
      ) : null}
      <CommandList className="max-h-[260px]">
        {!meetsMinChars ? (
          <div className="text-muted-foreground px-3 py-6 text-center text-xs">
            Type at least {MIN_SEARCH_CHARS} characters to search.
          </div>
        ) : isLoading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 px-3 py-6 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
          </div>
        ) : hasError ? (
          <div className="text-destructive space-y-1 px-3 py-6 text-center text-xs">
            <div>Couldn't load users.</div>
            {errorMessage ? (
              <div className="text-destructive/80 break-all text-[11px] font-mono">
                {errorMessage}
              </div>
            ) : null}
          </div>
        ) : results.length === 0 ? (
          <CommandEmpty>No matching users.</CommandEmpty>
        ) : (
          <CommandGroup>
            {results.map((user) => {
              const isSelected = selectedSet.has(user.id);
              const disableRow = atMaxSelected && !isSelected;
              const label = getUserLabel(user);
              const sub = getUserSubLabel(user);
              return (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  disabled={disableRow}
                  onSelect={() => onToggle(user)}
                  className="flex items-center gap-2"
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-input',
                    )}
                    aria-hidden
                  >
                    {isSelected ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm">{label}</span>
                    {sub ? (
                      <span className="text-muted-foreground truncate text-xs">
                        {sub}
                      </span>
                    ) : null}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
