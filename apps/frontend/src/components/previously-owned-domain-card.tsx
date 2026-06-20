'use client';

import type { ReactNode } from 'react';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { AddressWithChain } from '@/components/address-with-chain';
import {
  formatRemovalDate,
  getReceivingWallet,
  getRemovalReasonDisplay,
  type PreviouslyOwnedDomainRow,
  ViewNftAction,
} from '@/components/previously-owned-domain-cells';

/**
 * One detail row of the card: label pinned to the start, value to the end — the
 * iOS grouped-list (Settings) convention, matching `my-domains/domain-card.tsx`.
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
 * Mobile card representation of a single previously-owned/burned domain row.
 * Reuses the same cell helpers the desktop table columns use, so the values
 * (removal date, reason, receiving wallet, View NFT link) stay identical — only
 * the layout differs: a compact iOS-style grouped list with the label on the
 * left and the value aligned to the right.
 */
export function PreviouslyOwnedDomainCard({
  domain,
}: {
  domain: PreviouslyOwnedDomainRow;
}) {
  const { label: reasonLabel, extraText: reasonExtraText } =
    getRemovalReasonDisplay(domain);
  const receivingWallet = getReceivingWallet(domain);

  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="flex items-start justify-between gap-2 px-3.5 py-3">
        <span className="min-w-0 break-words font-medium">
          {domain.normalizedDomainName}
        </span>
        <div className="shrink-0">
          <ViewNftAction row={domain} />
        </div>
      </div>

      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Account">
          <AddressWithChain
            address={domain.fromAddress ?? null}
            chainId={domain.chainId ?? null}
            showShortAddress
          />
        </CardRow>

        <CardRow label="Removal Date">
          <span className="text-sm">{formatRemovalDate(domain.removedAt)}</span>
        </CardRow>

        <CardRow label="Reason">
          <span className="text-sm text-foreground">{reasonLabel}</span>
          {reasonExtraText ? (
            <span className="text-xs text-muted-foreground">
              {reasonExtraText}
            </span>
          ) : null}
        </CardRow>

        <CardRow label="Receiving Wallet">
          {receivingWallet ? (
            <AddressWithChain
              address={receivingWallet}
              chainId={domain.chainId ?? null}
              showShortAddress
            />
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </CardRow>
      </dl>
    </Card>
  );
}
