'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc';
import type { NotificationRelatedResource } from '@namefi-astra/common/shared-schemas';

import { useNotificationsPollInterval } from './polling-policy';

const BUMP_HOLD_MS = 2500;

type Options = {
  filter?: NotificationRelatedResource;
  /**
   * Override polling cadence. When omitted, defers to
   * `useNotificationsPollInterval` (polls every `POLL_INTERVAL_MS` and
   * pauses after the tab has been hidden for `IDLE_HIDDEN_PAUSE_MS`).
   */
  refetchInterval?: number | false | (() => number | false);
};

export type UseUnreadCountResult = {
  count: number;
  /** True for ~2.5s after the count rises above the previous value. */
  justIncreased: boolean;
  isLoading: boolean;
};

/**
 * Polls the unread-notification count for the current user (optionally
 * scoped to a related resource). Flips `justIncreased` to true for a few
 * seconds whenever the count rises so consumers can play an attention
 * animation. The first successful load never counts as an increase.
 */
export function useUnreadCount({
  filter,
  refetchInterval,
}: Options = {}): UseUnreadCountResult {
  const trpc = useTRPC();
  const pollInterval = useNotificationsPollInterval();
  // The unfiltered count is polled exactly once per browser (across all
  // tabs) by `LeaderCoordinator`, which hydrates this query's cache via
  // `setQueryData`. Disabling the local poll here prevents every bell
  // in every tab from also firing its own network call. Filtered bells
  // (per-resource scope, page-local) aren't multi-tab amplified, so
  // they keep their own per-instance polling.
  const isCoordinated = !filter;
  const queryOptions = trpc.notifications.getUnreadCount.queryOptions(
    filter
      ? {
          relatedResourceType: filter.type,
          relatedResourceIdentifier: filter.identifier,
        }
      : {},
    {
      refetchInterval: isCoordinated
        ? false
        : (refetchInterval ?? pollInterval),
      refetchIntervalInBackground: true,
      // Override the global 60s staleTime so a tab re-focus triggers
      // an immediate refetch (only relevant for the filtered path now;
      // for the coordinated path the leader's tick is the only fetch).
      staleTime: 0,
    },
  );
  const { data, isLoading } = useQuery({
    ...queryOptions,
    enabled: !isCoordinated,
  });
  const count = data?.count ?? 0;

  const [justIncreased, setJustIncreased] = useState(false);
  const previousCountRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const previous = previousCountRef.current;
    previousCountRef.current = count;
    // Skip the very first observation; we don't want the bell to bounce on
    // initial page load just because there are unread items.
    if (previous === null) return;
    if (count > previous) {
      setJustIncreased(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setJustIncreased(false);
        timerRef.current = null;
      }, BUMP_HOLD_MS);
    }
  }, [count]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { count, justIncreased, isLoading };
}
