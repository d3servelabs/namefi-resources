'use client';

import type { ReactNode } from 'react';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import {
  AutoRenewBadge,
  ChainCell,
  DateStateBadge,
  DomainNameCell,
  DomainStatusBadge,
  formatDateOnly,
  NftActionsCell,
  type NftManagementRow,
  NftStatusBadge,
  OwnerAddressCell,
  PrimaryEmailValue,
  PrivyUserIdValue,
  RegistrarValue,
  rowHasActions,
  UserIdValue,
  YesNo,
} from './nft-management-cells';

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

interface NftManagementCardProps {
  row: NftManagementRow;
  isBurning: boolean;
  isBurnWorkflowActive: boolean;
  isFixPending: boolean;
  onBurn: (normalizedDomainName: string, chainId: number) => Promise<void>;
  onFix: (normalizedDomainName: string, chainId: number) => Promise<void>;
}

/**
 * Mobile card representation of a single NFT-management row. Reuses the same cell
 * components the desktop table columns use (`ChainCell`, `OwnerAddressCell`,
 * `AutoRenewBadge`, status badges, `NftActionsCell`, …) so the values and actions
 * stay identical — only the layout differs: a compact iOS-style grouped list with
 * the label on the left and the value/control aligned to the right.
 */
export function NftManagementCard({
  row,
  isBurning,
  isBurnWorkflowActive,
  isFixPending,
  onBurn,
  onFix,
}: NftManagementCardProps) {
  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="flex items-start justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <DomainNameCell row={row} />
        </div>
        <div className="shrink-0">
          <ChainCell chainId={row.chainId} />
        </div>
      </div>

      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Owner Address">
          <div className="w-full max-w-[220px]">
            <OwnerAddressCell row={row} />
          </div>
        </CardRow>

        <CardRow label="Auto Renew">
          <AutoRenewBadge autoRenewEnabled={row.autoRenewEnabled} />
        </CardRow>

        <CardRow label="Domain Status">
          <DomainStatusBadge domainStatus={row.domainStatus} />
        </CardRow>

        <CardRow label="NFT Status">
          <NftStatusBadge nftStatus={row.nftStatus} />
        </CardRow>

        <CardRow label="NFT Expiration">
          {formatDateOnly(row.nftExpirationTime)}
        </CardRow>

        <CardRow label="Domain Expiration">
          {formatDateOnly(row.domainExpirationTime)}
        </CardRow>

        <CardRow label="Date State">
          <DateStateBadge dateState={row.dateState} />
        </CardRow>

        <CardRow label="Registrar">
          <RegistrarValue registrarKey={row.registrarKey} />
        </CardRow>

        <CardRow label="Display Name">{row.displayName ?? '-'}</CardRow>

        <CardRow label="Primary Email">
          <PrimaryEmailValue primaryEmail={row.primaryEmail} />
        </CardRow>

        <CardRow label="User ID">
          <UserIdValue userId={row.userId} />
        </CardRow>

        <CardRow label="Privy User ID">
          <PrivyUserIdValue privyUserId={row.privyUserId} />
        </CardRow>

        <CardRow label="Powered by Namefi">
          <YesNo value={row.isPoweredByNamefiDomain} />
        </CardRow>

        <CardRow label="Can Burn">
          <YesNo value={row.canBurn} />
        </CardRow>

        <CardRow label="Missing Data">
          <YesNo value={row.hasMissingData} />
        </CardRow>

        <CardRow label="Strict Date Mismatch">
          <YesNo value={row.hasDateMismatch} />
        </CardRow>

        <CardRow label="Needs Expiration Review">
          <YesNo value={row.needsExpirationReview} />
        </CardRow>

        <CardRow label="Expired">
          <YesNo value={row.isExpired} />
        </CardRow>

        <CardRow label="Last Indexed">
          {formatDateOnly(row.lastIndexedAt)}
        </CardRow>

        <CardRow label="As Of Block">
          {row.asOfBlockNumber?.toString() ?? '-'}
        </CardRow>
      </dl>

      {rowHasActions(row) ? (
        <div className="border-t border-border/50 px-3.5 py-3">
          <NftActionsCell
            row={row}
            isBurning={isBurning}
            isBurnWorkflowActive={isBurnWorkflowActive}
            isFixPending={isFixPending}
            onBurn={onBurn}
            onFix={onFix}
          />
        </div>
      ) : null}
    </Card>
  );
}
