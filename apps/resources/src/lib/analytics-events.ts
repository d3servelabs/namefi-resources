import { capturePostHogEvent } from '@/lib/posthog';

/**
 * Thin analytics helper for the resources app's search feature.
 *
 * Every search event is sent to BOTH destinations so usage shows up wherever the
 * team looks:
 * - Google Analytics 4 via `window.gtag` (loaded `beforeInteractive` in
 *   ga-bootstrap.tsx, so it's available immediately and respects GA consent).
 * - PostHog via the lazy, consent-gated client in lib/posthog.ts.
 *
 * Both calls are best-effort and never throw — analytics must never break search.
 */

export const SearchAnalyticsEvent = {
  /** A query was run and returned ≥1 result. */
  Performed: 'resource_search_performed',
  /** A query was run and returned 0 results. */
  NoResults: 'resource_search_no_results',
  /** The visitor clicked through to a result. */
  ResultClicked: 'resource_search_result_clicked',
} as const;

export type SearchAnalyticsEventName =
  (typeof SearchAnalyticsEvent)[keyof typeof SearchAnalyticsEvent];

type EventProperties = Record<string, unknown>;

function sendGaEvent(name: string, properties: EventProperties): void {
  if (typeof window === 'undefined') return;
  // `gtag` is a no-op stub until the loader runs; calling it early is safe and
  // queues onto the dataLayer.
  window.gtag?.('event', name, properties);
}

/** Fire a search analytics event to GA and PostHog. */
export function trackSearchEvent(
  name: SearchAnalyticsEventName,
  properties: EventProperties,
): void {
  sendGaEvent(name, properties);
  void capturePostHogEvent(name, properties);
}
