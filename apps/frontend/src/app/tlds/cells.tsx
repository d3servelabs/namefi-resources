'use client';

import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import type { Row } from '@tanstack/react-table';
import { both, complement, isNil, isNotNil } from 'ramda';
import type { AppRouterOutput } from '@/lib/trpc';

export type TldPricingRow =
  AppRouterOutput['registry']['getTldPricingTable']['tldPricing'][number];

/**
 * Pretty-prints the backend registrar key. Shared by the desktop table column
 * and the mobile card so the displayed registrar label stays identical.
 */
export function formatRegistrarKey(key: string | null) {
  if (!key) {
    return 'N/A';
  }
  if (key === 'dynadot') {
    return 'Dynadot GDG';
  }
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/** The `.tld` code chip shown in the TLD column / card header. */
export function TldNameCell({ tld }: { tld: string }) {
  return (
    <code className="font-medium uppercase ring-1 ring-inset ring-ring/50 rounded-md px-2 py-1">{`.${tld}`}</code>
  );
}

/** The registrar badge shown in the admin-only Registrar column / card row. */
export function RegistrarCell({
  registrarKey,
}: {
  registrarKey: string | null;
}) {
  return <Badge variant="secondary">{formatRegistrarKey(registrarKey)}</Badge>;
}

/**
 * Renders one USD/year price. When *all three* prices on the row are missing it
 * collapses to a single "Variable Price" hint (the price depends on the exact
 * domain name); otherwise it shows the formatted amount or "N/A". Shared by the
 * desktop price columns and the mobile card so the pricing logic lives once.
 */
export function PriceCell({
  value,
  row,
}: {
  value: number | null;
  row: Row<TldPricingRow>;
}) {
  const all = [
    row.getValue('registrationPriceUsdPerYear'),
    row.getValue('renewalPriceUsdPerYear'),
    row.getValue('transferPriceUsdPerYear'),
  ].filter(both(complement(Number.isNaN), isNotNil));

  if (all.length === 0) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <span className="text-muted-foreground">Variable Price</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>The price is variable and depends on the domain name</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  if (isNil(value) || Number.isNaN(value)) {
    return <span className="text-muted-foreground">N/A</span>;
  }
  return (
    <span className="text-muted-foreground">
      <span className="font-medium font-mono text-foreground">
        {value.toFixed(2)}$
      </span>{' '}
      / year
    </span>
  );
}
