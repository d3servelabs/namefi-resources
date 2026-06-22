'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { useTranslations } from 'next-intl';

import type { DnssecPanelMode } from './use-dnssec-mode-preference';

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
  const t = useTranslations('dnsManagement');
  const SimpleHint = t('dnssecPanel.modeToggle.simpleHint');
  const AdvancedHint = t('dnssecPanel.modeToggle.advancedHint');
  return (
    <TooltipProvider>
      <fieldset className="m-0 inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900/40 p-0.5">
        <legend className="sr-only">
          {t('dnssecPanel.modeToggle.legend')}
        </legend>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant={mode === 'simple' ? 'default' : 'ghost'}
                size="sm"
                aria-pressed={mode === 'simple'}
                data-testid="dnsManagement.dnssec-panel.mode-toggle.simple"
                className="h-7 px-3 text-xs"
                onClick={() => onChange('simple')}
              >
                {t('dnssecPanel.modeToggle.simple')}
              </Button>
            }
          />
          <TooltipContent>{SimpleHint}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant={mode === 'advanced' ? 'default' : 'ghost'}
                size="sm"
                aria-pressed={mode === 'advanced'}
                data-testid="dnsManagement.dnssec-panel.mode-toggle.advanced"
                className="h-7 px-3 text-xs"
                onClick={() => onChange('advanced')}
              >
                {t('dnssecPanel.modeToggle.advanced')}
              </Button>
            }
          />
          <TooltipContent>{AdvancedHint}</TooltipContent>
        </Tooltip>
      </fieldset>
    </TooltipProvider>
  );
}
