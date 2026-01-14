'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useHuntVote, type HuntVoteOptions } from './use-hunt-vote';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { defaultShareConfig } from './use-twitter-share';

export interface HuntVoteRowOptions extends HuntVoteOptions {
  domain?: NamefiNormalizedDomain;
}

/**
 * Hook for managing voting state for a specific domain row
 * Similar to useCartRow and useWishlistRow patterns
 */
export function useHuntVoteRow({ domain, ...options }: HuntVoteRowOptions) {
  const huntVote = useHuntVote({
    ...options,
    shareConfig: {
      ...defaultShareConfig,
      ...options.shareConfig,
    },
  });
  const { isAuthenticated } = useAuth();

  const huntVoteRow = useMemo(
    () => ({
      upvote: huntVote.upvote,
      unvote: huntVote.unvote,
      toggleVote: huntVote.toggleVote,
      isVotePending: huntVote.isVotePending,
      busy: huntVote.busy,
      choiceDialog: huntVote.choiceDialog,
      shareDialog: huntVote.shareDialog,
    }),
    [
      huntVote.upvote,
      huntVote.unvote,
      huntVote.toggleVote,
      huntVote.isVotePending,
      huntVote.busy,
      huntVote.choiceDialog,
      huntVote.shareDialog,
    ],
  );

  return useMemo(() => {
    const canVote = isAuthenticated;
    const toggleVote = async (currentlyVoted: boolean) => {
      if (!domain) {
        throw new Error('Domain should be provided');
      }
      await huntVoteRow.toggleVote(domain, currentlyVoted);
    };
    const upvote = () => {
      if (!domain) {
        throw new Error('Domain should be provided');
      }
      huntVoteRow.upvote(domain);
    };
    const unvote = () => {
      if (!domain) {
        throw new Error('Domain should be provided');
      }
      huntVoteRow.unvote(domain);
    };

    const isVotePending = domain ? huntVoteRow.isVotePending(domain) : false;

    if (!domain) {
      return {
        ...huntVoteRow,
        upvote,
        unvote,
        toggleVote,
        isVotePending,
        canVote,
      };
    }
    return {
      ...huntVoteRow,
      upvote,
      unvote,
      toggleVote,
      isVotePending,
      canVote,
    };
  }, [domain, huntVoteRow, isAuthenticated]);
}
