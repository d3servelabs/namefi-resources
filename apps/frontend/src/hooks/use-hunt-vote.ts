'use client';

import { useCallback, useMemo, useReducer } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { useTRPC, type AppRouterInput } from '@/lib/trpc';
import { toast } from 'sonner';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { useHuntVoteChoice } from './use-hunt-vote-choice';
import {
  defaultShareConfig,
  useHuntShareDialog,
  type ShareConfig,
} from './use-hunt-vote-share';

export const huntVoteDomainKey = (
  userId: string,
  domain: NamefiNormalizedDomain,
) => `vote:${userId}:${domain}`;

export type VoteInput = AppRouterInput['hunt']['upvote'];

/* -------------------------------------------------------------------------- */
/*                             BUSY STATE HOOK                               */
/* -------------------------------------------------------------------------- */

export function useHuntVoteBusy() {
  type BusyKey = string;
  type BusyAction =
    | { type: 'mark'; key: BusyKey }
    | { type: 'clear'; key: BusyKey }
    | { type: 'clearAll' };

  const [busySet, dispatch] = useReducer(
    (state: Set<BusyKey>, action: BusyAction): Set<BusyKey> => {
      switch (action.type) {
        case 'mark':
          return new Set([...state, action.key]);
        case 'clear': {
          const newSet = new Set(state);
          newSet.delete(action.key);
          return newSet;
        }
        case 'clearAll':
          return new Set();
        default:
          return state;
      }
    },
    new Set<BusyKey>(),
  );

  const isBusy = useCallback((key: BusyKey) => busySet.has(key), [busySet]);

  const markBusy = useCallback((key: BusyKey) => {
    dispatch({ type: 'mark', key });
  }, []);

  const clearBusy = useCallback((key: BusyKey) => {
    dispatch({ type: 'clear', key });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'clearAll' });
  }, []);

  return useMemo(
    () => ({
      isBusy,
      markBusy,
      clearBusy,
      clearAll,
      busy: busySet,
    }),
    [isBusy, markBusy, clearBusy, clearAll, busySet],
  );
}

/* -------------------------------------------------------------------------- */
/*                           OPERATIONS HOOK                                 */
/* -------------------------------------------------------------------------- */

export function useHuntVoteOperations(options?: {
  onVoteSuccess?: (domainName: NamefiNormalizedDomain) => void;
}) {
  const trpc = useTRPC();
  const { isAuthenticated, user } = useAuth();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const queryClient = useQueryClient();
  const busy = useHuntVoteBusy();

  const userId = user?.id ?? 'guest';

  const voteRetryPolicy = (failCount: number, err: any) => {
    const status = err?.data?.httpStatus;
    return (status === undefined || status >= 500) && failCount < 3;
  };

  const upvoteMutation = useMutation({
    ...trpc.hunt.upvote.mutationOptions({ retry: voteRetryPolicy }),
    onMutate: async (variables: VoteInput) => {
      const { domainName } = variables;
      const busyKey = huntVoteDomainKey(
        userId,
        domainName as NamefiNormalizedDomain,
      );

      busy.markBusy(busyKey);
      return { domainName, busyKey };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        busy.clearBusy(context.busyKey);
      }
      toast.error('Failed to vote. Please try again.');
    },
    onSuccess: (_data, variables, context) => {
      if (context) {
        busy.clearBusy(context.busyKey);
      }
      toast.success('Thanks for your vote!');
      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.Vote,
        properties: {
          domainName: variables.domainName,
          action: 'add',
        },
      });

      // Call onVoteSuccess callback if provided
      options?.onVoteSuccess?.(variables.domainName as NamefiNormalizedDomain);
    },
    onSettled: (_data, _error, _variables) => {
      // Invalidate and refetch specific queries to ensure data consistency
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getTrendingDomains.queryKey(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getTrendingDomainsPublic.queryKey(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getCampaign.queryKey(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getCampaignPublic.queryKey(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getMySubmittedDomains.queryKey(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getMyUpvotedDomains.queryKey(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getDomainDetail.queryKey({
          domainName: _variables.domainName,
        }),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getDomainDetailPublic.queryKey({
          domainName: _variables.domainName,
        }),
        refetchType: 'active',
      });
    },
  });

  const unvoteMutation = useMutation({
    ...trpc.hunt.unvote.mutationOptions({ retry: voteRetryPolicy }),
    onMutate: async (variables: VoteInput) => {
      const { domainName } = variables;
      const busyKey = huntVoteDomainKey(
        userId,
        domainName as NamefiNormalizedDomain,
      );

      busy.markBusy(busyKey);
      return { domainName, busyKey };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        busy.clearBusy(context.busyKey);
      }
      toast.error('Failed to cancel vote. Please try again.');
    },
    onSuccess: (_data, variables, context) => {
      if (context) {
        busy.clearBusy(context.busyKey);
      }
      toast.success('Vote cancelled.');
      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.Vote,
        properties: {
          domainName: variables.domainName,
          action: 'remove',
        },
      });
    },
    onSettled: (_data, _error, _variables) => {
      // Invalidate and refetch specific queries to ensure data consistency
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getTrendingDomains.queryKey(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getTrendingDomainsPublic.queryKey(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getCampaign.queryKey(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getCampaignPublic.queryKey(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getMySubmittedDomains.queryKey(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getMyUpvotedDomains.queryKey(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getDomainDetail.queryKey({
          domainName: _variables.domainName,
        }),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getDomainDetailPublic.queryKey({
          domainName: _variables.domainName,
        }),
        refetchType: 'active',
      });
    },
  });

  // Internal function to execute vote (only called when authenticated)
  const executeVote = useCallback(
    async (domainName: NamefiNormalizedDomain): Promise<void> => {
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to vote');
      }

      const busyKey = huntVoteDomainKey(userId, domainName);
      if (busy.isBusy(busyKey)) {
        return; // Already processing
      }

      try {
        await upvoteMutation.mutateAsync({ domainName });
      } catch (error) {
        // Error handling is done in the mutation callbacks
        throw error;
      }
    },
    [isAuthenticated, userId, busy, upvoteMutation],
  );

  const vote = useCallback(
    async (domainName: NamefiNormalizedDomain): Promise<void> => {
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to vote');
      }
      // Normal authenticated flow
      return executeVote(domainName);
    },
    [isAuthenticated, executeVote],
  );

  // Internal function to execute unvote (only called when authenticated)
  const executeUnvote = useCallback(
    async (domainName: NamefiNormalizedDomain): Promise<void> => {
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to vote');
      }

      const busyKey = huntVoteDomainKey(userId, domainName);
      if (busy.isBusy(busyKey)) {
        return; // Already processing
      }

      try {
        await unvoteMutation.mutateAsync({ domainName });
      } catch (error) {
        // Error handling is done in the mutation callbacks
        throw error;
      }
    },
    [isAuthenticated, userId, busy, unvoteMutation],
  );

  const unvote = useCallback(
    async (domainName: NamefiNormalizedDomain): Promise<void> => {
      if (!isAuthenticated) {
        throw new Error(
          'Cannot unvote when not authenticated - user must have voted first',
        );
      }
      // Normal authenticated flow
      return executeUnvote(domainName);
    },
    [isAuthenticated, executeUnvote],
  );

  const toggleVote = useCallback(
    async (
      domainName: NamefiNormalizedDomain,
      currentlyVoted: boolean,
    ): Promise<void> => {
      if (currentlyVoted) {
        return unvote(domainName);
      }
      return vote(domainName);
    },
    [vote, unvote],
  );

  const isVotePending = useCallback(
    (domainName: NamefiNormalizedDomain) => {
      const busyKey = huntVoteDomainKey(userId, domainName);
      return busy.isBusy(busyKey);
    },
    [busy, userId],
  );

  const isVoting = useMemo(
    () => upvoteMutation.isPending,
    [upvoteMutation.isPending],
  );

  const isUnvoting = useMemo(
    () => unvoteMutation.isPending,
    [unvoteMutation.isPending],
  );

  return {
    vote,
    unvote,
    toggleVote,
    isVotePending,
    isVoting,
    isUnvoting,
    busy,
    upvoteMutation,
    unvoteMutation,
  };
}

export interface HuntVoteOptions {
  shareConfig?: ShareConfig;
}

/* -------------------------------------------------------------------------- */
/*                               FACADE HOOK                                 */
/* -------------------------------------------------------------------------- */
export function useHuntVote(
  options: HuntVoteOptions = { shareConfig: defaultShareConfig },
) {
  const { isAuthenticated } = useAuth();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const shareDialog = useHuntShareDialog(options?.shareConfig);
  const choiceDialog = useHuntVoteChoice({
    onShare: shareDialog.openDialog,
    onLoginSuccess: async (domain) => {
      await vote(domain);
    },
  });
  const operations = useHuntVoteOperations({
    onVoteSuccess: shareDialog.onVoteSuccess,
  });

  // Facade vote function that handles authentication internally
  const vote = useCallback(
    async (domain: NamefiNormalizedDomain): Promise<void> => {
      if (!isAuthenticated) {
        // Track unauthenticated attempt for analytics
        logEventWithInteractionLoggers({
          name: InteractionLoggingEventName.Vote,
          properties: {
            domainName: domain,
            action: 'attempt_unauthenticated',
          },
        });

        // Show choice dialog internally - no external callbacks needed!
        choiceDialog.showChoiceDialog(domain);
        return;
      }

      // User is authenticated - execute vote normally
      await operations.vote(domain);
    },
    [
      isAuthenticated,
      operations.vote,
      logEventWithInteractionLoggers,
      choiceDialog,
    ],
  );

  const toggleVote = useCallback(
    async (
      domain: NamefiNormalizedDomain,
      currentlyVoted: boolean,
    ): Promise<void> => {
      if (currentlyVoted) {
        await operations.unvote(domain);
      } else {
        await vote(domain);
      }
    },
    [vote, operations.unvote],
  );

  return {
    upvote: vote,
    unvote: operations.unvote,
    toggleVote,
    isVotePending: operations.isVotePending,
    isVoting: operations.isVoting,
    isUnvoting: operations.isUnvoting,
    busy: operations.busy,
    choiceDialog: {
      isOpen: choiceDialog.isOpen,
      currentDomain: choiceDialog.currentDomain,
      onClose: choiceDialog.onClose,
      onChooseLogin: choiceDialog.onChooseLogin,
      onChooseShare: choiceDialog.onChooseShare,
    },
    shareDialog: {
      isOpen: shareDialog.isOpen,
      currentDomain: shareDialog.currentDomain,
      shareUrl: shareDialog.shareUrl,
      hasShared: shareDialog.hasShared,
      isCheckingStatus: shareDialog.isCheckingStatus,
      isSubmitting: shareDialog.isSubmitting,
      onClose: shareDialog.closeDialog,
      onSubmit: shareDialog.submitShare,
      onVoteSuccess: shareDialog.onVoteSuccess,
      openDialog: shareDialog.openDialog,
      campaignKey: shareDialog.campaignKey,
    },
  };
}

export type UseHuntVote = ReturnType<typeof useHuntVote>;
