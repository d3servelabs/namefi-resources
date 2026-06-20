'use client';

import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { CHAINS } from '@namefi-astra/utils/chains';
import { getNftExplorerUrl } from '@namefi-astra/utils/nft-hash';
import type { AppRouterOutput } from '@/lib/trpc';

export type PreviouslyOwnedDomainRow =
  AppRouterOutput['users']['getCurrentUserBurnedDomains'][number];

// Shared cell logic so the desktop table columns and the mobile card render
// identical values from the same source (switch layout, reuse logic).

/** Formats a removal date the way both the table and card show it. */
export function formatRemovalDate(removedAt: Date | string): string {
  return new Date(removedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Resolves the human-readable removal reason (plus any clarifying sub-text) for a
 * row. Used by the desktop "Reason" column and the mobile card alike.
 */
export function getRemovalReasonDisplay(row: PreviouslyOwnedDomainRow): {
  label: string;
  extraText: string | null;
} {
  let label = row.removalReason;
  let extraText: string | null = null;

  switch (row.removalType) {
    case 'domain_exported':
      if (row.chainId === CHAINS.sepolia.id) {
        label = 'Domain Exported (Fake)';
        extraText = 'Actual Reason: Removed From Test Chain';
      }
      break;
    case 'domain_expired':
      if (row.expirationTimeAtRemoval) {
        extraText = `Expired At: ${format(row.expirationTimeAtRemoval, 'MMM do yyyy, hh:mm aa')}`;
      }
      break;
  }

  return { label, extraText };
}

/** The receiving wallet, or `null` when the row was not a wallet transfer. */
export function getReceivingWallet(
  row: PreviouslyOwnedDomainRow,
): string | null {
  if (row.removalType !== 'transferred_to_another_wallet' || !row.toAddress) {
    return null;
  }
  return row.toAddress;
}

/** Renders the "View NFT" link (or nothing) — shared by table + card. */
export function ViewNftAction({ row }: { row: PreviouslyOwnedDomainRow }) {
  const domainName = row.normalizedDomainName;
  const explorerUrl = getNftExplorerUrl(
    row.chainId ?? null,
    row.tokenId ?? null,
  );
  if (!explorerUrl) {
    return null;
  }
  return (
    <Button
      render={(props) => (
        <a
          {...props}
          href={explorerUrl}
          aria-label={`View NFT for ${domainName}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {props.children}
        </a>
      )}
      nativeButton={false}
      variant="outline"
      size="sm"
    >
      <ExternalLink className="w-4 h-4 me-1" /> View NFT
    </Button>
  );
}
