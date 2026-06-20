'use client';

import type { ReactNode } from 'react';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import type { Row } from '@tanstack/react-table';
import {
  PriceCell,
  RegistrarCell,
  TldNameCell,
  type TldPricingRow,
} from './cells';

interface TldPricingCardProps {
  row: Row<TldPricingRow>;
  /** Mirrors the admin-only Registrar column — only shown to admins. */
  showRegistrar: boolean;
}

/**
 * One detail row of the card: label pinned to the start, value to the end — the
 * iOS grouped-list convention used by DomainCard. Reads cleaner on a phone than
 * the horizontally-scrolling pricing table.
 */
function CardRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
      <dt className="shrink-0 text-[13px] text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center justify-end text-right text-sm">
        {children}
      </dd>
    </div>
  );
}

/**
 * Mobile card representation of a single TLD pricing row. Composes the same cell
 * components the desktop table uses (TldNameCell, PriceCell, RegistrarCell) so
 * the pricing/format logic stays identical — only the layout differs: the `.tld`
 * chip heads the card, with each price as a labeled grouped-list row beneath.
 */
export function TldPricingCard({ row, showRegistrar }: TldPricingCardProps) {
  const registrarKey = row.getValue('registrarKey') as string | null;

  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="flex items-center px-3 py-2.5">
        <TldNameCell tld={row.getValue('tld')} />
      </div>
      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Registration">
          <PriceCell
            value={row.getValue('registrationPriceUsdPerYear')}
            row={row}
          />
        </CardRow>
        <CardRow label="Renewal">
          <PriceCell value={row.getValue('renewalPriceUsdPerYear')} row={row} />
        </CardRow>
        <CardRow label="Transfer">
          <PriceCell
            value={row.getValue('transferPriceUsdPerYear')}
            row={row}
          />
        </CardRow>
        {showRegistrar ? (
          <CardRow label="Registrar">
            <RegistrarCell registrarKey={registrarKey} />
          </CardRow>
        ) : null}
      </dl>
    </Card>
  );
}
