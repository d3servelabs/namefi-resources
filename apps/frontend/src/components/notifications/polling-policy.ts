'use client';

/**
 * Polling cadence for the notifications bell + watcher.
 *
 * react-query keeps the interval-based refetch running even while the
 * tab is in the background (we pass `refetchIntervalInBackground: true`
 * at the query site), modulo the browser's own setInterval throttling
 * for inactive tabs. Combined with `staleTime: 0` on the notification
 * queries, this guarantees a fresh count immediately on tab re-focus
 * (via the default `refetchOnWindowFocus`) on top of the periodic
 * refetch.
 *
 * Earlier revisions paused polling after the tab had been hidden for
 * 2 minutes. That interacted poorly with the global
 * `staleTime: 60 * 1000` (set in `providers/trpc.tsx`): once the
 * function returned `false`, the next refocus saw a still-fresh cache
 * entry and skipped the focus refetch, so the count stayed stale until
 * the user manually opened the modal. Always returning the same number
 * sidesteps the issue at negligible network cost.
 */

export const POLL_INTERVAL_MS = 10_000;

/** Function form for parity with the react-query callback signature. */
export function getNotificationsPollInterval(): number {
  return POLL_INTERVAL_MS;
}
