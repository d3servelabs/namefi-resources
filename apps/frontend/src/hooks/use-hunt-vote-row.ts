'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useHuntVote } from './use-hunt-vote';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

export interface HuntVoteRowStatus {
  huntVote: ReturnType<typeof useHuntVote>;
  isBusy: boolean;
  canVote: boolean;
}

/**
 * Hook for managing voting state for a specific domain row
 * Similar to useCartRow and useWishlistRow patterns
 */
export function useHuntVoteRow(
  domain?: NamefiNormalizedDomain,
): HuntVoteRowStatus {
  const huntVote = useHuntVote();
  const { isAuthenticated } = useAuth();

  return useMemo<HuntVoteRowStatus>(() => {
    if (!domain) {
      return {
        huntVote,
        isBusy: false,
        canVote: isAuthenticated,
      };
    }

    const isBusy = huntVote.isDomainBusy(domain);
    const canVote = isAuthenticated;

    return {
      huntVote,
      isBusy,
      canVote,
    };
  }, [domain, huntVote, isAuthenticated]);
}
