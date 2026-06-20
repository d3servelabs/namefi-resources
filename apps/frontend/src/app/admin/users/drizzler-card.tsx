'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { AdminUserExpandedDetails } from '@/components/admin/user-details';
import {
  AllWalletsCell,
  AssetCountCell,
  DisplayNameCell,
  EmailCell,
  formatTimestamp,
  LastSignInCell,
  PrimaryWalletCell,
  PrivyIdCell,
  TwitterCell,
  UserActionsCell,
  UserIdCell,
  type UserRow,
} from './drizzler-cells';

/**
 * One detail row of the card: label pinned to the start, value to the end — the
 * iOS grouped-list (Settings) convention, matching my-domains/domain-card.tsx.
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

interface DrizzlerCardProps {
  row: UserRow;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onImpersonate: (userId: string) => Promise<void>;
}

/**
 * Mobile card representation of a single admin-users row. Composes the SAME
 * shared cell components the desktop table columns use (`UserIdCell`,
 * `DisplayNameCell`, `EmailCell`, `PrivyIdCell`, `PrimaryWalletCell`,
 * `AllWalletsCell`, `LastSignInCell`, `TwitterCell`, `AssetCountCell`,
 * `UserActionsCell`) so the values + behavior stay identical — only the layout
 * differs: a compact iOS-style grouped list instead of a wide,
 * horizontally-scrolling table row. Expanding reveals the same NFT/wallet
 * sub-row the desktop expander shows.
 */
export function DrizzlerCard({
  row,
  isExpanded,
  onToggleExpanded,
  onImpersonate,
}: DrizzlerCardProps) {
  const canExpand = row.nftCount > 0 || row.wallets.length > 0;

  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="flex items-start gap-2 px-3 py-2.5">
        {canExpand ? (
          <button
            type="button"
            onClick={onToggleExpanded}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            className="mt-0.5 shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4 rtl:-scale-x-100" />
            )}
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <DisplayNameCell displayName={row.displayName} />
        </div>
        <div className="shrink-0">
          <AssetCountCell nftCount={row.nftCount} />
        </div>
      </div>

      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="ID">
          <UserIdCell id={row.id} />
        </CardRow>

        <CardRow label="Email">
          <EmailCell row={row} />
        </CardRow>

        <CardRow label="Privy ID">
          <PrivyIdCell privyUserId={row.privyUserId} />
        </CardRow>

        <CardRow label="Primary Wallet">
          <PrimaryWalletCell row={row} />
        </CardRow>

        <CardRow label="All Wallets">
          <AllWalletsCell row={row} />
        </CardRow>

        <CardRow label="Created">
          <span className="text-sm">{formatTimestamp(row.createdAt)}</span>
        </CardRow>

        <CardRow label="Updated">
          <span className="text-sm">{formatTimestamp(row.updatedAt)}</span>
        </CardRow>

        <CardRow label="Last Sign In">
          <LastSignInCell lastSignInAt={row.lastSignInAt} />
        </CardRow>

        <CardRow label="Twitter">
          <TwitterCell username={row.twitterUsername} />
        </CardRow>

        <CardRow label="Admin">
          <span className="text-sm">{row.isAdmin ? 'Yes' : 'No'}</span>
        </CardRow>

        <CardRow label="Action">
          <UserActionsCell row={row} onImpersonate={onImpersonate} />
        </CardRow>
      </dl>

      {isExpanded && canExpand ? (
        <div className="border-t border-border/50 px-3.5 py-3">
          <AdminUserExpandedDetails userId={row.id} />
        </div>
      ) : null}
    </Card>
  );
}
