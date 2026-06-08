'use client';

import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import type { DomainRow } from '../types';

const PENDING_LABELS: Record<string, string> = {
  MINTING: 'Minting…',
  CHANGING_EXPIRATION: 'Updating expiration…',
  CHANGING_LOCK: 'Updating lock…',
};

/**
 * Small "in-flight NFT operation" indicator shown next to a domain while a
 * deferred on-chain op (mint / expiration change / lock change) is still
 * settling. Driven by the optimistic overlay surfaced on
 * `users.getCurrentUserDomains` (`nftState` / `pendingNftStates`). Renders
 * nothing when the domain is IDLE.
 */
export function NftPendingBadge({
  nftState,
  pendingNftStates,
}: {
  nftState: DomainRow['nftState'];
  pendingNftStates?: DomainRow['pendingNftStates'];
}) {
  if (!nftState || nftState === 'IDLE') return null;

  const label = PENDING_LABELS[nftState] ?? 'Pending…';
  // When several ops are in flight at once, surface them all in the tooltip.
  const title =
    pendingNftStates && pendingNftStates.length > 1
      ? pendingNftStates.map((s) => PENDING_LABELS[s] ?? s).join(', ')
      : label;

  return (
    <Badge
      variant="outline"
      title={title}
      className="whitespace-nowrap border-amber-500/40 bg-amber-400/10 text-amber-300"
    >
      <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
      {label}
    </Badge>
  );
}
