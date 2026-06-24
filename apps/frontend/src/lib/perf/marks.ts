import { logDatadogPerf } from '@/lib/datadog/logs';
import { isPerfConsoleEnabled, isPerfSessionSampled } from './flag';

/**
 * Lightweight client performance instrumentation.
 *
 * Records named milestones for the interactions we care about (app hydration,
 * sidebar activation, sign-in) as `PerformanceMeasure`s — so they show up in
 * the DevTools Performance timeline — and routes each one to:
 *   - the console, when the `?perf=1` teammate flag is set, and
 *   - Datadog (`perf.measure` info logs with a numeric `duration_ms` facet),
 *     when the session is sampled (`PERF_SAMPLE_RATE`) or force-flagged.
 *
 * Everything is no-op on the server and wrapped in try/catch — telemetry must
 * never break a user flow, and the gating reads are cheap (localStorage /
 * sessionStorage), so calling these from hot paths is safe.
 *
 * Two timing styles:
 *   - `recordPerfNow(metric)` — duration measured from navigation start, for
 *     page-load milestones (e.g. `app.hydrate`, `sidebar.activate`).
 *   - `startPerfSpan(key)` + `recordPerfSince(key, metric)` — duration from a
 *     remembered start, for interactions. One start can anchor several
 *     milestones (e.g. sign-in click -> modal, click -> authenticated).
 */

const spanStarts = new Map<string, number>();
// Backstop against leaks: a span whose terminal milestone never fires (an
// abandoned/superseded/load-failed login) would otherwise linger forever.
// Map preserves insertion order, so evict the oldest once we hit the cap.
const MAX_TRACKED_SPANS = 64;

// Page-load milestones (app.hydrate, sidebar.*) are emitted from effects whose
// provider/component can remount (e.g. on an auth-state change). A module-level
// guard survives React remounts, so each is reported at most once per page
// load — a remount can't inject an inflated duplicate that would skew aggregates.
const emittedOnceMetrics = new Set<string>();

function nowMs(): number | null {
  // Client-only by contract (see file header). Node also exposes `performance`,
  // so guard on `window` too — matching the storage guards in ./flag — to truly
  // no-op during SSR even if a future caller runs this in a render path.
  if (typeof window === 'undefined' || typeof performance === 'undefined') {
    return null;
  }
  return performance.now();
}

/** Remember the start time of a named span (e.g. on a click). */
export function startPerfSpan(key: string): void {
  const t = nowMs();
  if (t === null) return;
  if (spanStarts.size >= MAX_TRACKED_SPANS && !spanStarts.has(key)) {
    const oldest = spanStarts.keys().next().value;
    if (oldest !== undefined) spanStarts.delete(oldest);
  }
  spanStarts.set(key, t);
  try {
    performance.mark(`perf:${key}:start`);
  } catch {
    // User Timing unavailable — the in-memory start above is enough.
  }
}

/**
 * Discard a span's remembered start. Call after a span's terminal milestone so
 * per-instance keys (e.g. `signin:<requestId>`) don't accumulate in the map.
 */
export function clearPerfSpan(key: string): void {
  spanStarts.delete(key);
}

/**
 * Record a measure from a previously started span, keeping the start so it can
 * anchor later milestones too. No-op (returns undefined) if the span was never
 * started in this session.
 */
export function recordPerfSince(
  startKey: string,
  metric: string,
  extra?: Record<string, unknown>,
): number | undefined {
  const end = nowMs();
  const start = spanStarts.get(startKey);
  if (end === null || start === undefined) return undefined;
  const duration = end - start;
  emit(metric, duration, end, start, extra);
  return duration;
}

/** Record a measure relative to navigation start (page-load milestones). */
export function recordPerfNow(
  metric: string,
  extra?: Record<string, unknown>,
): number | undefined {
  const end = nowMs();
  if (end === null) return undefined;
  emit(metric, end, end, 0, extra);
  return end;
}

/**
 * Like {@link recordPerfNow} but emits a given metric at most ONCE per page
 * load. Use for load milestones (app.hydrate, sidebar.*) whose effect can re-run
 * after a remount — only the first (real) measurement is reported; later
 * remounts are ignored so they don't pollute the aggregates with inflated values.
 */
export function recordPerfOnce(
  metric: string,
  extra?: Record<string, unknown>,
): number | undefined {
  if (emittedOnceMetrics.has(metric)) return undefined;
  const result = recordPerfNow(metric, extra);
  // Only consume the once-slot if it actually emitted (not an SSR/no-op call),
  // so a no-op first call can't permanently block the real client emission.
  if (result !== undefined) emittedOnceMetrics.add(metric);
  return result;
}

function emit(
  metric: string,
  durationMs: number,
  endMs: number,
  startMs: number,
  extra: Record<string, unknown> | undefined,
): void {
  const duration = Math.round(durationMs);
  const at = Math.round(endMs);

  // Make the span visible in the DevTools Performance timeline.
  try {
    performance.measure(metric, { start: startMs, end: endMs });
  } catch {
    // Ignore — older browsers without User Timing L3 options.
  }

  if (isPerfConsoleEnabled()) {
    // biome-ignore lint/suspicious/noConsole: the ?perf=1 teammate flag exists precisely to print these timings.
    console.debug(
      `%c[perf]%c ${metric} %c${duration}ms%c (@${at}ms)`,
      'color:#1cd17d;font-weight:600',
      'color:inherit',
      'color:#eab308;font-weight:600',
      'color:#71717a',
      extra ?? '',
    );
  }

  if (isPerfSessionSampled()) {
    logDatadogPerf('perf.measure', {
      // Spread caller extras first so they can never clobber the canonical
      // facets the Datadog dashboards/queries depend on.
      ...extra,
      metric,
      duration_ms: duration,
      at_ms: at,
    });
  }
}
