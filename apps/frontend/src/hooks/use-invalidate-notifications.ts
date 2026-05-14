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
 */
export function useInvalidateNotifications(): () => void {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: trpc.notifications.pathKey(),
    });
  }, [queryClient, trpc.notifications]);
}
