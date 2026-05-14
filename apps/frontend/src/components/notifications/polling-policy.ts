'use client';

import { useEffect, useState } from 'react';

/**
 * Polling cadence for the notifications bell + watcher.
 *
 * The hook below owns a `visibilitychange` listener so the
 * attach/detach happens with the consuming component's lifecycle — no
 * module-level side effects, no listeners left dangling after a hot
 * reload or unmount.
 *
 * Behaviour:
 *   - foreground or recently-hidden tab → poll every `POLL_INTERVAL_MS`
 *   - tab hidden for ≥ `IDLE_HIDDEN_PAUSE_MS` → return `false`, react-
 *     query stops the interval
 *   - on tab refocus → flip back to `POLL_INTERVAL_MS`; combined with
 *     `staleTime: 0` (set at the query site) react-query also refetches
 *     immediately via `refetchOnWindowFocus`
 */

export const POLL_INTERVAL_MS = 10_000;
export const IDLE_HIDDEN_PAUSE_MS = 10 * 60_000;

/**
 * Returns the desired `refetchInterval` value for a notification
 * polling query. Re-renders the consumer whenever the value flips,
 * so passing the return directly into react-query's options works
 * correctly.
 */
export function useNotificationsPollInterval(): number | false {
  const [pollInterval, setPollInterval] = useState<number | false>(
    POLL_INTERVAL_MS,
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    let pauseTimer: ReturnType<typeof setTimeout> | null = null;
    const cancelPauseTimer = () => {
      if (pauseTimer) {
        clearTimeout(pauseTimer);
        pauseTimer = null;
      }
    };
    const reschedule = () => {
      cancelPauseTimer();
      if (document.hidden) {
        pauseTimer = setTimeout(() => {
          setPollInterval(false);
        }, IDLE_HIDDEN_PAUSE_MS);
      } else {
        setPollInterval(POLL_INTERVAL_MS);
      }
    };

    // Honour the current visibility on mount (the tab could already be
    // hidden when the hook first runs).
    reschedule();
    document.addEventListener('visibilitychange', reschedule);
    return () => {
      document.removeEventListener('visibilitychange', reschedule);
      cancelPauseTimer();
    };
  }, []);

  return pollInterval;
}
