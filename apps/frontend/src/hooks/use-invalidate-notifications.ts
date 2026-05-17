'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTRPC } from '@/lib/trpc';

/**
 * Returns a stable callback that invalidates every notifications query —
 * the bell's unread count and the modal's list. Call it the moment the
 * frontend observes a workflow settle (order / DNSSEC / nameservers /
 * deferred custom-DS) so the bell reflects the just-written notification
 * immediately instead of waiting for the next poll tick.
 *
 * Side-effect: bumps the cross-tab `pollNonce` in the shared RxDB doc
 * so the leader tab refetches `getUnreadCount` immediately even if the
 * caller is a follower (whose local `useQuery` is `enabled: false` and
 * would otherwise no-op the invalidation). The bump is fire-and-forget;
 * a transient RxDB failure just degrades to "wait for the next 10s
 * leader tick", which is the pre-coordinator behaviour anyway.
 */
export function useInvalidateNotifications(): () => void {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: trpc.notifications.pathKey(),
    });
    void import('@/components/notifications/leader/shared-db')
      .then(({ bumpPollNonce }) => bumpPollNonce())
      .catch(() => {
        // Best-effort: any failure (RxDB load error, storage quota, etc.)
        // falls back to the leader's regular poll tick.
      });
  }, [queryClient, trpc.notifications]);
}
