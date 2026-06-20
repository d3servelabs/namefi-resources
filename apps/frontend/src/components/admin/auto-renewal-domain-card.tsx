'use client';

import type { ReactNode } from 'react';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import {
  ChargeCell,
  type DomainRow,
  ErrorActionCell,
  OwnerEmailCell,
  OwnerIdCell,
  PaymentsCell,
  RegistrarCell,
  StatusCell,
  TxHashCell,
  WalletCell,
} from './auto-renewal-management-cells';

/**
 * One detail row of the card: label pinned to the start, value to the end — the
 * iOS grouped-list (Settings) convention, matching `my-domains/domain-card.tsx`,
 * `parked-domains/parked-domain-card.tsx` and `admin/nft-management-card.tsx`.
 */
function CardRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3.5 py-2.5">
      <dt className="shrink-0 pt-0.5 text-[13px] text-muted-foreground">
        {label}
      </dt>
      <dd className="flex min-w-0 flex-col items-end gap-0.5 text-right">
        {children}
      </dd>
    </div>
  );
}

/**
 * Mobile card representation of a single auto-renewal domain (leaf) row. Reuses
 * the same cell components the desktop table columns use (`StatusCell`,
 * `ChargeCell`, `PaymentsCell`, `ErrorActionCell`, `TxHashCell`, …) so the
 * values/links/actions stay identical — only the layout differs: a compact
 * iOS-style grouped list with the label on the left and the value on the right.
 */
export function AutoRenewalDomainCard({ row }: { row: DomainRow }) {
  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="flex items-start justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1 font-mono text-xs break-all">
          {row.domain}
        </div>
        <div className="shrink-0">
          <StatusCell status={row.status} />
        </div>
      </div>

      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Wallet">
          <WalletCell row={row} />
        </CardRow>

        <CardRow label="Owner Email">
          <OwnerEmailCell row={row} />
        </CardRow>

        <CardRow label="Owner ID">
          <OwnerIdCell row={row} />
        </CardRow>

        <CardRow label="Registrar">
          <RegistrarCell registrar={row.registrar} />
        </CardRow>

        <CardRow label="Charge (USD)">
          <ChargeCell chargeAmountUsd={row.chargeAmountUsd} />
        </CardRow>

        <CardRow label="Payment">
          <PaymentsCell row={row} />
        </CardRow>

        <CardRow label="Error / Action">
          <ErrorActionCell row={row} />
        </CardRow>

        <CardRow label="Tx Hash">
          <TxHashCell row={row} />
        </CardRow>
      </dl>
    </Card>
  );
}
