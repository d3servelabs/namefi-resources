'use client';

import type { ReactNode } from 'react';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import {
  AutoRenewBadge,
  ChainBadge,
  DaysExpiredBadge,
  DomainNameValue,
  type EnrichedDomainToBurn,
  NftExpiryValue,
  OwnerCell,
  RegistrarValue,
  UserEmailValue,
} from './bulk-burn-management-cells';

/**
 * One detail row of the card: label pinned to the start, value to the end — the
 * iOS grouped-list (Settings) convention, matching `my-domains/domain-card.tsx`
 * and `parked-domains/parked-domain-card.tsx`.
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

interface BulkBurnCardProps {
  row: EnrichedDomainToBurn;
  isSelected: boolean;
  /** Disabled when the workflow isn't waiting for approval. */
  selectDisabled: boolean;
  onSelectedChange: (domain: string) => void;
  onCopyWallet: (address: string) => Promise<void>;
}

/**
 * Mobile card representation of a single bulk-burn row. Reuses the exact same
 * cell components the desktop table columns use (`DomainNameValue`,
 * `ChainBadge`, `OwnerCell`, `AutoRenewBadge`, `UserEmailValue`,
 * `NftExpiryValue`, `DaysExpiredBadge`, `RegistrarValue`) so values stay
 * identical — only the layout differs: a compact iOS-style grouped list with
 * the label on the left and the value aligned to the right.
 */
export function BulkBurnCard({
  row,
  isSelected,
  selectDisabled,
  onSelectedChange,
  onCopyWallet,
}: BulkBurnCardProps) {
  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="flex items-start gap-2 px-3 py-2.5">
        <Checkbox
          checked={isSelected}
          disabled={selectDisabled}
          onCheckedChange={() => onSelectedChange(row.domain)}
          aria-label={`Select ${row.domain}`}
          className="mt-1 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <DomainNameValue domain={row.domain} />
        </div>
        <div className="shrink-0">
          <ChainBadge chainId={row.chainId} />
        </div>
      </div>

      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Owner">
          <OwnerCell ownerAddress={row.ownerAddress} onCopy={onCopyWallet} />
        </CardRow>

        <CardRow label="Auto Renew">
          <AutoRenewBadge value={row.autoRenewEnabled} />
        </CardRow>

        <CardRow label="User Email">
          <UserEmailValue email={row.userEmail} />
        </CardRow>

        <CardRow label="NFT Expiry">
          <NftExpiryValue nftExpirationDate={row.nftExpirationDate} />
        </CardRow>

        <CardRow label="Days Expired">
          <DaysExpiredBadge days={row.daysSinceExpiration} />
        </CardRow>

        <CardRow label="Registrar">
          <RegistrarValue registrar={row.registrar} />
        </CardRow>
      </dl>
    </Card>
  );
}
