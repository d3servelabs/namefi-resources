'use client';

import { format } from 'date-fns';
import { Copy } from 'lucide-react';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { AutoTruncateTextV2 } from '../auto-truncate-text-v2';
import { UserWalletAvatar } from '../user-avatar';

// Shared types + cell logic so the desktop table columns and the mobile card
// render identical values from the same source (switch layout, reuse logic).

export type DomainToBurn = {
  domain: string;
  chainId: number;
  ownerAddress: string;
  nftExpirationDate: Date;
  daysSinceExpiration: number;
  registrar?: string;
  [key: string]: unknown;
};

export type EnrichedDomainToBurn = DomainToBurn & {
  autoRenewEnabled: boolean | null;
  userEmail: string | null;
};

/** Human-readable chain name for a numeric chain id. */
export function getChainName(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'Ethereum';
    case 8453:
      return 'Base';
    case 11155111:
      return 'Sepolia';
    default:
      return `Chain ${chainId}`;
  }
}

/** Domain name, truncated for narrow viewports. */
export function DomainNameValue({ domain }: { domain: string }) {
  return (
    <AutoTruncateTextV2
      minCharactersToDisplay={30}
      initialCharactersCountToDisplay={30}
    >
      {domain}
    </AutoTruncateTextV2>
  );
}

/** Chain pill — shared by the desktop column and the card. */
export function ChainBadge({ chainId }: { chainId: number }) {
  return <Badge variant="outline">{getChainName(chainId)}</Badge>;
}

/**
 * Owner wallet: avatar + truncated mono address + copy-to-clipboard button.
 * `onCopy` keeps the original `Promise<void>` return type so callers passing an
 * async clipboard handler (or an AsyncButton) stay type-correct.
 */
export function OwnerCell({
  ownerAddress,
  onCopy,
}: {
  ownerAddress: string;
  onCopy: (address: string) => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-2 px-1 py-1 bg-muted rounded-xl max-w-full">
      <UserWalletAvatar address={ownerAddress} className="size-6" />
      <div className="flex-1 min-w-0">
        <AutoTruncateTextV2
          initialCharactersCountToDisplay={16}
          minCharactersToDisplay={16}
          className="font-mono text-xs"
        >
          {ownerAddress}
        </AutoTruncateTextV2>
      </div>
      <button
        type="button"
        onClick={() => onCopy(ownerAddress)}
        className="p-1 hover:bg-background rounded transition-colors flex-shrink-0"
        title="Copy address"
        data-testid={`admin.bulk-burn.domains.row.${ownerAddress}.copy-address-button`}
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
}

/** Auto-renew state pill: N/A when unknown, green when enabled, secondary off. */
export function AutoRenewBadge({ value }: { value: boolean | null }) {
  if (value == null) {
    return <span className="text-sm text-muted-foreground">N/A</span>;
  }
  return value ? (
    <Badge variant="default" className="bg-green-600">
      Enabled
    </Badge>
  ) : (
    <Badge variant="secondary">Disabled</Badge>
  );
}

/** Truncated user email, or an em-dash placeholder when absent. */
export function UserEmailValue({ email }: { email: string | null }) {
  if (!email) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }
  return (
    <AutoTruncateTextV2
      minCharactersToDisplay={20}
      initialCharactersCountToDisplay={20}
      className="text-sm"
    >
      {email}
    </AutoTruncateTextV2>
  );
}

/** NFT expiry rendered as an ISO date. */
export function NftExpiryValue({
  nftExpirationDate,
}: {
  nftExpirationDate: Date;
}) {
  return (
    <span className="text-sm">
      {format(new Date(nftExpirationDate), 'yyyy-MM-dd')}
    </span>
  );
}

/** Days-since-expiration pill. */
export function DaysExpiredBadge({ days }: { days: number }) {
  return <Badge variant="secondary">{days} days</Badge>;
}

/** Registrar name, or N/A when unknown. */
export function RegistrarValue({ registrar }: { registrar?: string }) {
  return (
    <span className="text-sm text-muted-foreground">{registrar || 'N/A'}</span>
  );
}
