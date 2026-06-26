'use client';

import { useEffect, useState } from 'react';
import { Grid2X2, Rows3 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';

export type ViewMode = 'grid' | 'list';

export type ViewModeLabels = {
  label: string;
  grid: string;
  list: string;
};

const VIEW_MODES = [
  { value: 'grid' as const, icon: Grid2X2 },
  { value: 'list' as const, icon: Rows3 },
];

function isViewMode(value: string | null): value is ViewMode {
  return value === 'grid' || value === 'list';
}

export function usePersistedViewMode(storageKey: string): {
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
} {
  const [viewMode, setViewModeState] = useState<ViewMode>('grid');

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(storageKey);
      if (isViewMode(storedValue)) {
        setViewModeState(storedValue);
      }
    } catch {
      // Storage can be unavailable in hardened/private browser contexts.
    }
  }, [storageKey]);

  const setViewMode = (value: ViewMode) => {
    setViewModeState(value);
    try {
      window.localStorage.setItem(storageKey, value);
    } catch {
      // Keep the immediate UI state even if persistence is unavailable.
    }
  };

  return { viewMode, setViewMode };
}

export function ViewModeToggle({
  value,
  onChange,
  labels,
  className,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  labels: ViewModeLabels;
  className?: string;
}) {
  return (
    <fieldset
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-1',
        className,
      )}
    >
      <legend className="sr-only">{labels.label}</legend>
      {VIEW_MODES.map((mode) => {
        const Icon = mode.icon;
        const active = mode.value === value;
        const label = labels[mode.value];

        return (
          <Tooltip key={mode.value}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label={label}
                  aria-pressed={active}
                  onClick={() => onChange(mode.value)}
                  className={cn(
                    'inline-flex size-9 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70',
                    active &&
                      'bg-brand-primary text-background hover:text-background',
                  )}
                />
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="sr-only">{label}</span>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </fieldset>
  );
}
