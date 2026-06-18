'use client';

import { useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils/namefi-flavor';

export interface HostnamesChipInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** Rendered below the chip grid when the list is currently empty — e.g. the computed default preview. */
  emptyStateHint?: React.ReactNode;
  /** Disables add/remove while a submit is in flight. */
  disabled?: boolean;
}

/**
 * Small chip-style editor for `additionalAllowedHostnames`-shaped fields.
 * Validates each entry against `namefiNormalizedDomainSchema` before
 * adding; rejects duplicates. Intentionally dependency-light so the
 * admin create/edit dialogs can drop it in without pulling extra UI
 * primitives.
 */
export function HostnamesChipInput({
  value,
  onChange,
  placeholder = 'hostname (e.g. example.com)',
  emptyStateHint,
  disabled = false,
}: HostnamesChipInputProps) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const commit = () => {
    const trimmed = draft.trim().toLowerCase();
    if (!trimmed) {
      setError(null);
      return;
    }
    const parsed = namefiNormalizedDomainSchema.safeParse(trimmed);
    if (!parsed.success) {
      setError('Not a valid normalized domain');
      return;
    }
    if (value.includes(parsed.data)) {
      setError('Already in the list');
      return;
    }
    onChange([...value, parsed.data]);
    setDraft('');
    setError(null);
  };

  const remove = (hostname: string) => {
    onChange(value.filter((h) => h !== hostname));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      event.preventDefault();
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-2">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 w-full min-w-0">
          {value.map((hostname) => (
            <Badge
              key={hostname}
              variant="secondary"
              className="inline-flex max-w-full items-center gap-1 pe-1.5"
              title={hostname}
            >
              <span className="truncate font-mono text-xs max-w-[20rem]">
                {hostname}
              </span>
              <button
                type="button"
                aria-label={`Remove ${hostname}`}
                disabled={disabled}
                onClick={() => remove(hostname)}
                className="inline-flex size-4 shrink-0 items-center justify-center rounded-sm opacity-60 transition-opacity hover:opacity-100 disabled:opacity-40"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-stretch gap-2 w-full min-w-0">
        <Input
          value={draft}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="font-mono text-sm flex-1 min-w-0"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={commit}
          disabled={disabled || draft.trim() === ''}
          className="shrink-0"
        >
          Add
        </Button>
      </div>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
      {!error && value.length === 0 && emptyStateHint ? (
        <div className="text-xs text-muted-foreground">{emptyStateHint}</div>
      ) : null}
    </div>
  );
}
