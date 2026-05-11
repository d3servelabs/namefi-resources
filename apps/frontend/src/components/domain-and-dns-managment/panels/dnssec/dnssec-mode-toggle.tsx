'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';

import type { DnssecPanelMode } from './use-dnssec-mode-preference';

const SIMPLE_HINT = 'One-click Enable for the common case.';
const ADVANCED_HINT =
  'Full control: paste DNSKEY/DS, validate, and manage multiple keys.';

export type DnssecModeToggleProps = {
  mode: DnssecPanelMode;
  onChange: (next: DnssecPanelMode) => void;
};

/**
 * Compact two-button segmented control rendered in the DNSSEC panel's
 * top-right corner when the domain is on third-party authoritative NS.
 * Switches the body of the panel between Simple (one-click Enable) and
 * Advanced (the existing manual / auto-detect form + table).
 */
export function DnssecModeToggle({ mode, onChange }: DnssecModeToggleProps) {
  return (
    <TooltipProvider>
      <fieldset className="m-0 inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900/40 p-0.5">
        <legend className="sr-only">DNSSEC panel mode</legend>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant={mode === 'simple' ? 'default' : 'ghost'}
                size="sm"
                aria-pressed={mode === 'simple'}
                className="h-7 px-3 text-xs"
                onClick={() => onChange('simple')}
              >
                Simple
              </Button>
            }
          />
          <TooltipContent>{SIMPLE_HINT}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant={mode === 'advanced' ? 'default' : 'ghost'}
                size="sm"
                aria-pressed={mode === 'advanced'}
                className="h-7 px-3 text-xs"
                onClick={() => onChange('advanced')}
              >
                Advanced
              </Button>
            }
          />
          <TooltipContent>{ADVANCED_HINT}</TooltipContent>
        </Tooltip>
      </fieldset>
    </TooltipProvider>
  );
}
