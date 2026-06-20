'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';
import { checksumWalletAddressSchema } from '@namefi-astra/utils/namefi-flavor';
import { getChain } from '@namefi-astra/utils/chains';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { NetworkLogo } from '@/components/network-logo';
import { UserWalletAvatar } from '@/components/user-avatar';

/**
 * Shared formatters + cell components for the admin export-tracking table.
 *
 * These are the single source of truth for how each value renders, so the
 * desktop table columns AND the mobile ExportTrackingCard stay in sync —
 * switch the layout, reuse the logic (one path, no fork).
 */

/** Best-effort EIP-55 checksum; falls back to the raw string on parse failure. */
export const attemptGetChecksummedAddress = (address: string): string => {
  const parsed = checksumWalletAddressSchema.safeParse(address);
  return parsed.success ? parsed.data : address;
};

/** Human-readable date or an em-dash placeholder for null/undefined. */
export const formatDateTime = (
  value: Date | string | null | undefined,
): string => (value ? new Date(value).toLocaleString() : '-');

type LatestEvidence = {
  checkedAt?: string;
  evidenceSource?: 'DIRECT_REGISTRAR' | 'RDAP' | 'WHOIS' | 'NONE';
  accountCheck?: {
    inOurAccount?: boolean;
    confirmed?: boolean;
  };
  rdapTransferEvent?: {
    detected?: boolean;
    eventAction?: string;
    eventDate?: string;
  };
  decisionAction?: string;
  decisionReason?: string;
} | null;

export const formatEvidenceAccountSummary = (
  accountCheck: NonNullable<LatestEvidence>['accountCheck'],
): string =>
  accountCheck
    ? `${accountCheck.inOurAccount ? 'In account' : 'Out of account'} (${
        accountCheck.confirmed ? 'confirmed' : 'unconfirmed'
      })`
    : 'Unknown';

export const formatEvidenceRdapSummary = (
  rdapEvent: NonNullable<LatestEvidence>['rdapTransferEvent'],
): string =>
  rdapEvent?.detected
    ? rdapEvent.eventDate
      ? `Detected (${new Date(rdapEvent.eventDate).toLocaleString()})`
      : 'Detected'
    : 'Not detected';

/** Monospace owner address chip with avatar + copy-to-clipboard button. */
export function OwnerAddressCell({ ownerAddress }: { ownerAddress: string }) {
  const checksummed = attemptGetChecksummedAddress(ownerAddress);
  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(checksummed);
      toast.success('Copied address successfully');
    } catch {
      toast.error('Failed to copy address');
    }
  };

  return (
    <div className="flex items-center gap-2 px-1 py-1 bg-muted rounded-xl max-w-full">
      <UserWalletAvatar address={checksummed} className="size-6" />
      <div className="flex-1 min-w-0">
        <AutoTruncateTextV2
          initialCharactersCountToDisplay={16}
          minCharactersToDisplay={10}
          className="font-mono text-xs"
        >
          {checksummed}
        </AutoTruncateTextV2>
      </div>
      <button
        type="button"
        onClick={handleCopyWallet}
        className="p-1 hover:bg-background rounded transition-colors flex-shrink-0"
        title="Copy address"
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
}

/** Network logo + resolved chain name (falls back to `Chain <id>`). */
export function ChainCell({ chainId }: { chainId: number }) {
  const chain = getChain(chainId);
  return (
    <div className="flex items-center gap-2">
      <NetworkLogo network={chainId} className="w-5 h-5" />
      <span className="text-xs text-muted-foreground">
        {chain?.name ?? `Chain ${chainId}`}
      </span>
    </div>
  );
}

/** Latest-evidence summary block + a "View JSON" popover with the raw object. */
export function LatestEvidenceCell({
  latestEvidence,
}: {
  latestEvidence: LatestEvidence;
}) {
  if (!latestEvidence) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  const accountSummary = formatEvidenceAccountSummary(
    latestEvidence.accountCheck,
  );
  const rdapSummary = formatEvidenceRdapSummary(
    latestEvidence.rdapTransferEvent,
  );

  return (
    <div className="space-y-0.5 text-xs max-w-[300px]">
      <div>
        <span className="text-muted-foreground">Account:</span>{' '}
        <span>{accountSummary}</span>
      </div>
      <div>
        <span className="text-muted-foreground">RDAP transfer:</span>{' '}
        <span>{rdapSummary}</span>
      </div>
      {latestEvidence.checkedAt && (
        <div className="text-muted-foreground">
          Checked: {new Date(latestEvidence.checkedAt).toLocaleString()}
        </div>
      )}
      {latestEvidence.evidenceSource && (
        <div className="text-muted-foreground">
          Source: {latestEvidence.evidenceSource}
        </div>
      )}
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs -ms-2"
            />
          }
        >
          View JSON
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[440px] max-sm:w-[calc(100vw-2rem)] p-3"
        >
          <div className="space-y-2">
            <div className="text-xs font-medium">Latest Evidence</div>
            <pre className="max-h-80 overflow-auto rounded-md bg-muted p-2 text-[11px] leading-relaxed">
              {JSON.stringify(latestEvidence, null, 2)}
            </pre>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
