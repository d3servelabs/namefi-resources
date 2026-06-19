'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import type { DomainRow } from '../types';

/** Maps an `nftState` enum value to its `nftPendingBadge` translation key. */
const PENDING_LABEL_KEYS: Record<string, string> = {
  MINTING: 'nftPendingBadge.minting',
  CHANGING_EXPIRATION: 'nftPendingBadge.changingExpiration',
  CHANGING_LOCK: 'nftPendingBadge.changingLock',
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
  const t = useTranslations('domains');
  // next-intl's typed keys can't verify data-driven keys; this alias keeps
  // the static t() calls type-checked while allowing the dynamic ones.
  const tDynamic = t as (key: string) => string;

  if (!nftState || nftState === 'IDLE') return null;

  const label = PENDING_LABEL_KEYS[nftState]
    ? tDynamic(PENDING_LABEL_KEYS[nftState])
    : t('nftPendingBadge.pending');
  // When several ops are in flight at once, surface them all in the tooltip.
  // Unknown states fall back to their raw enum value (matching prior behavior).
  const title =
    pendingNftStates && pendingNftStates.length > 1
      ? pendingNftStates
          .map((s) =>
            PENDING_LABEL_KEYS[s] ? tDynamic(PENDING_LABEL_KEYS[s]) : s,
          )
          .join(', ')
      : label;

  return (
    <Badge
      variant="outline"
      title={title}
      className="whitespace-nowrap border-amber-500/40 bg-amber-400/10 text-amber-300"
    >
      <span className="me-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
      {label}
    </Badge>
  );
}
