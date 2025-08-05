'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useHuntVoteOperations, type UseHuntVote } from './use-hunt-vote';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

export interface HuntVoteRowStatus {
  huntVote: UseHuntVote;
  isBusy: boolean;
  canVote: boolean;
}

/**
 * Hook for managing voting state for a specific domain row
 * Similar to useCartRow and useWishlistRow patterns
 */
export function useHuntVoteRow(
  domain?: NamefiNormalizedDomain,
  options?: { onVoteSuccess?: (domainName: NamefiNormalizedDomain) => void },
): HuntVoteRowStatus {
  const huntVoteOperations = useHuntVoteOperations(options);
  const { isAuthenticated } = useAuth();

  const huntVote = useMemo(
    () => ({
      vote: huntVoteOperations.vote,
      unvote: huntVoteOperations.unvote,
      toggleVote: huntVoteOperations.toggleVote,
      isDomainBusy: huntVoteOperations.isDomainBusy,
      isVoting: huntVoteOperations.isVoting,
      isUnvoting: huntVoteOperations.isUnvoting,
      busy: huntVoteOperations.busy,
    }),
    [
      huntVoteOperations.vote,
      huntVoteOperations.unvote,
      huntVoteOperations.toggleVote,
      huntVoteOperations.isDomainBusy,
      huntVoteOperations.isVoting,
      huntVoteOperations.isUnvoting,
      huntVoteOperations.busy,
    ],
  );

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
