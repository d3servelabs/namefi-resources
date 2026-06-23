import {
  C15T_CONSENT_COOKIE_NAME,
  getC15tMeasurementConsentState,
} from '@namefi-astra/common/google-analytics';
import type { PostHog } from 'posthog-js';

/**
 * Lazy, consent-gated PostHog client for the resources app.
 *
 * Mirrors the frontend's `lib/posthog.ts` philosophy: `posthog-js` is heavy, so
 * it is never imported at module-eval time and never bundled into the app shell.
 * The library is dynamically imported (as its own chunk) only after the visitor
 * has granted c15t measurement consent. Captures are gated on the persisted c15t
 * cookie read fresh at capture time (the same source the server-rendered GA
 * bootstrap reads), so consent is honored in both directions — early or
 * returning-visitor events aren't dropped before the deferred consent island
 * mounts, and a revoked grant immediately stops captures. The island additionally
 * eager-initializes the client on grant via {@link setPostHogConsent} so the
 * first event isn't delayed. Without consent, every capture is a no-op.
 *
 * Configuration is read from `NEXT_PUBLIC_*` env (define-inlined at build), the
 * same approach `google-analytics-consent.ts` uses for the GA measurement id, so
 * this module stays free of the zod config/runtime in the client bundle.
 *
 * The instance is intentionally minimal: no autocapture, no automatic pageviews,
 * no session recording. The only producer today is the resources `SearchBar`,
 * which captures explicit search events.
 */

const POSTHOG_PROJECT_TOKEN =
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? '';
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
const IS_DEBUG_ENV = process.env.ENVIRONMENT === 'local';

let posthogPromise: Promise<PostHog | null> | null = null;

/**
 * Resolve measurement consent synchronously from the persisted c15t cookie — the
 * same source of truth the server-rendered GA bootstrap reads, and the gate for
 * every capture. Read fresh on each call so it honors a later revocation and lets
 * early / returning-visitor events through before the deferred consent island
 * mounts.
 */
function hasPersistedMeasurementConsent(): boolean {
  if (typeof document === 'undefined') return false;
  const prefix = `${C15T_CONSENT_COOKIE_NAME}=`;
  const entry = document.cookie
    .split('; ')
    .find((row) => row.startsWith(prefix));
  if (!entry) return false;
  const cookieValue = decodeURIComponent(entry.slice(prefix.length));
  return getC15tMeasurementConsentState(cookieValue) === 'granted';
}

/** Whether a PostHog project token is configured for this environment. */
export function isPostHogConfigured(): boolean {
  return Boolean(POSTHOG_PROJECT_TOKEN);
}

async function initPostHog(): Promise<PostHog | null> {
  if (typeof window === 'undefined' || !POSTHOG_PROJECT_TOKEN) return null;

  const { default: posthog } = await import('posthog-js');

  posthog.init(POSTHOG_PROJECT_TOKEN, {
    api_host: POSTHOG_HOST,
    // Minimal footprint: only the events we capture explicitly are sent.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    // Avoid creating person profiles for anonymous visitors.
    person_profiles: 'identified_only',
    debug: IS_DEBUG_ENV,
  });

  return posthog;
}

function loadPostHog(): Promise<PostHog | null> {
  if (!posthogPromise) {
    posthogPromise = initPostHog();
  }
  return posthogPromise;
}

/**
 * Eagerly initialize PostHog when the consent island reports a grant, so the
 * first captured event isn't delayed by the dynamic import. Captures themselves
 * are gated on the persisted c15t cookie (see {@link capturePostHogEvent}), the
 * consent source of truth in both directions — so a revocation needs nothing
 * here: later captures read the now-denied cookie and no-op.
 */
export function setPostHogConsent(granted: boolean): void {
  if (granted && POSTHOG_PROJECT_TOKEN) {
    void loadPostHog();
  }
}

/**
 * Capture a PostHog event, loading the client on first use. No-op unless a token
 * is configured and the persisted c15t cookie currently grants measurement
 * consent — re-checked after the async import so a mid-flight revocation is
 * honored and an in-flight event is never sent against a withdrawn consent.
 */
export async function capturePostHogEvent(
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  if (!POSTHOG_PROJECT_TOKEN || !hasPersistedMeasurementConsent()) return;
  const posthog = await loadPostHog();
  if (!hasPersistedMeasurementConsent()) return;
  posthog?.capture(event, properties);
}
