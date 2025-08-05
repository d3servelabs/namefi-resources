'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useLogin } from '@/hooks/use-auth';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { useTRPC, type AppRouterInput } from '@/lib/trpc';
import { toast } from 'sonner';

import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

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

  function busyReducer(state: Set<BusyKey>, action: BusyAction): Set<BusyKey> {
    switch (action.type) {
      case 'mark': {
        const next = new Set(state);
        next.add(action.key);
        return next;
      }
      case 'clear': {
        const next = new Set(state);
        next.delete(action.key);
        return next;
      }
      case 'clearAll':
        return new Set();
    }
  }

  const [busyIds, dispatchBusy] = useReducer(busyReducer, new Set<BusyKey>());

  useEffect(() => () => dispatchBusy({ type: 'clearAll' }), []);

  const markBusy = useCallback(
    (key: BusyKey) => dispatchBusy({ type: 'mark', key }),
    [],
  );
  const clearBusy = useCallback(
    (key: BusyKey) => dispatchBusy({ type: 'clear', key }),
    [],
  );
  const isBusy = useCallback((key: BusyKey) => busyIds.has(key), [busyIds]);

  return { busyIds, markBusy, clearBusy, isBusy };
}

/* -------------------------------------------------------------------------- */
/*                           HUNT VOTE OPERATIONS                            */
/* -------------------------------------------------------------------------- */

export function useHuntVoteOperations(options?: {
  onVoteSuccess?: (domainName: NamefiNormalizedDomain) => void;
}) {
  const trpc = useTRPC();
  const { isAuthenticated, user } = useAuth();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const queryClient = useQueryClient();
  const busy = useHuntVoteBusy();

  // Simple in-memory pending vote (cleared on page refresh/navigation)
  // Only 'vote' actions can be pending since unvote requires prior authentication
  const pendingVoteRef = useRef<{
    domainName: NamefiNormalizedDomain;
  } | null>(null);

  const { login } = useLogin({
    onComplete: async () => {
      // Invalidate all hunt-related queries to refresh with authenticated user data
      // This ensures we get the user's actual voting state, not the guest state
      await queryClient.invalidateQueries({
        queryKey: trpc.hunt.getTrendingDomains.queryKey(),
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.hunt.getCampaign.queryKey(),
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.hunt.getDomainDetail.queryKey(),
        refetchType: 'active',
      });

      // Execute pending vote after successful login and data refresh
      if (pendingVoteRef.current) {
        const { domainName: pendingDomain } = pendingVoteRef.current;
        pendingVoteRef.current = null; // Clear immediately

        try {
          await executeVote(pendingDomain);
          toast.success('Vote cast successfully!');
        } catch (_error) {}
      }
    },
    onError: (error: string) => {
      if (error === 'user_exited_auth_flow') {
        // user did not want to login
        pendingVoteRef.current = null;
      }
    },
  });

  const userId = user?.id ?? 'guest';

  // Helper to update domain data across all relevant queries
  const updateDomainInCaches = useCallback(
    (
      domainName: NamefiNormalizedDomain,
      updates: { userHasUpvoted: boolean; upvoteCount: number },
    ) => {
      // Update trending domains (paginated)
      queryClient.setQueriesData(
        { queryKey: trpc.hunt.getTrendingDomains.queryKey() },
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items:
                page.items?.map((item: any) =>
                  item.domainName === domainName
                    ? { ...item, ...updates }
                    : item,
                ) || page.items,
            })),
          };
        },
      );

      // Update trending domains public (paginated)
      queryClient.setQueriesData(
        { queryKey: trpc.hunt.getTrendingDomainsPublic.queryKey() },
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items:
                page.items?.map((item: any) =>
                  item.domainName === domainName
                    ? { ...item, ...updates }
                    : item,
                ) || page.items,
            })),
          };
        },
      );

      // Update campaign data (has rankings array)
      queryClient.setQueriesData(
        { queryKey: trpc.hunt.getCampaign.queryKey() },
        (oldData: any) => {
          if (!oldData?.rankings) return oldData;
          return {
            ...oldData,
            rankings: oldData.rankings.map((item: any) =>
              item.domainName === domainName ? { ...item, ...updates } : item,
            ),
          };
        },
      );

      // Update campaign public data (has rankings array)
      queryClient.setQueriesData(
        { queryKey: trpc.hunt.getCampaignPublic.queryKey() },
        (oldData: any) => {
          if (!oldData?.rankings) return oldData;
          return {
            ...oldData,
            rankings: oldData.rankings.map((item: any) =>
              item.domainName === domainName ? { ...item, ...updates } : item,
            ),
          };
        },
      );

      // Update my submitted domains (array)
      queryClient.setQueriesData(
        { queryKey: trpc.hunt.getMySubmittedDomains.queryKey() },
        (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.map((item: any) =>
            item.domainName === domainName ? { ...item, ...updates } : item,
          );
        },
      );

      // Update my upvoted domains (array)
      queryClient.setQueriesData(
        { queryKey: trpc.hunt.getMyUpvotedDomains.queryKey() },
        (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.map((item: any) =>
            item.domainName === domainName ? { ...item, ...updates } : item,
          );
        },
      );

      // Update domain detail (single object)
      queryClient.setQueriesData(
        { queryKey: trpc.hunt.getDomainDetail.queryKey({ domainName }) },
        (oldData: any) => {
          if (!oldData || oldData.domainName !== domainName) return oldData;
          return { ...oldData, ...updates };
        },
      );

      // Update domain detail public (single object)
      queryClient.setQueriesData(
        { queryKey: trpc.hunt.getDomainDetailPublic.queryKey({ domainName }) },
        (oldData: any) => {
          if (!oldData || oldData.domainName !== domainName) return oldData;
          return { ...oldData, ...updates };
        },
      );

      // Invalidate my upvoted domains to ensure consistency
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getMyUpvotedDomains.queryKey(),
        refetchType: 'inactive',
      });
    },
    [queryClient, trpc.hunt],
  );

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
        // Remember what they wanted to vote on (no optimistic update)
        pendingVoteRef.current = { domainName };

        login(); // Uses callbacks configured in the hook
        return;
      }

      // Normal authenticated flow with optimistic update
      return executeVote(domainName);
    },
    [isAuthenticated, executeVote, login],
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

      // Normal authenticated flow with optimistic update
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

  const isDomainBusy = useCallback(
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
    isDomainBusy,
    isVoting,
    isUnvoting,
    busy,
    upvoteMutation,
    unvoteMutation,
  };
}

/* -------------------------------------------------------------------------- */
/*                               FACADE HOOK                                 */
/* -------------------------------------------------------------------------- */

export function useHuntVote() {
  const operations = useHuntVoteOperations();

  return {
    vote: operations.vote,
    unvote: operations.unvote,
    toggleVote: operations.toggleVote,
    isDomainBusy: operations.isDomainBusy,
    isVoting: operations.isVoting,
    isUnvoting: operations.isUnvoting,
    busy: operations.busy,
  };
}

export type UseHuntVote = ReturnType<typeof useHuntVote>;
