import { config } from '@/lib/env';

/**
 * Gating for client performance telemetry (see `./marks`).
 *
 * Two independent switches decide what a session does with a perf measure:
 *
 * 1. The **teammate flag** (`?perf=1`, persisted to localStorage) turns on
 *    verbose console logging AND forces this session to ship its measures to
 *    Datadog, regardless of the sample rate. It works in every environment,
 *    including production, so a teammate can profile a real prod session by
 *    appending `?perf=1` to any URL. Turn it off with `?perf=0`.
 *
 * 2. **Sampling** ships a configurable percentage of *all* sessions
 *    (`config.PERF_SAMPLE_RATE`) to Datadog with no console noise, so we can
 *    watch real-traffic percentiles. The decision is rolled once per tab and
 *    cached in sessionStorage so a sampled session reports every milestone.
 */

export const PERF_FLAG_STORAGE_KEY = 'namefi-perf';
export const PERF_SAMPLED_SESSION_KEY = 'namefi-perf-sampled';
export const PERF_FLAG_URL_PARAM = 'perf';

/** Whether the teammate console/forced-ship flag is set in localStorage. */
export function getPerfFlagFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(PERF_FLAG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Persist (or clear) the teammate flag. */
export function setPerfFlagInStorage(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      window.localStorage.setItem(PERF_FLAG_STORAGE_KEY, '1');
    } else {
      window.localStorage.removeItem(PERF_FLAG_STORAGE_KEY);
      // Re-roll sampling next time so disabling the flag doesn't leave the
      // session permanently force-sampled.
      window.sessionStorage.removeItem(PERF_SAMPLED_SESSION_KEY);
    }
  } catch {
    // Ignore storage errors.
  }
}

/** Console logging is on only for the teammate flag. */
export function isPerfConsoleEnabled(): boolean {
  return getPerfFlagFromStorage();
}

/**
 * Whether this session ships measures to Datadog. The teammate flag forces it
 * on; otherwise a single cached dice roll against `PERF_SAMPLE_RATE` decides,
 * stable for the lifetime of the tab.
 */
export function isPerfSessionSampled(): boolean {
  if (typeof window === 'undefined') return false;
  if (getPerfFlagFromStorage()) return true;
  try {
    const cached = window.sessionStorage.getItem(PERF_SAMPLED_SESSION_KEY);
    if (cached === '1') return true;
    if (cached === '0') return false;

    const rate = config.PERF_SAMPLE_RATE ?? 0;
    const sampled = rate > 0 && Math.random() * 100 < rate;
    window.sessionStorage.setItem(
      PERF_SAMPLED_SESSION_KEY,
      sampled ? '1' : '0',
    );
    return sampled;
  } catch {
    return false;
  }
}
