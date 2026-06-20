import type { PostHog } from 'posthog-js';
import { config } from '@/lib/env';

/**
 * Lazy, consent-gated PostHog client.
 *
 * `posthog-js` is a heavy dependency, so it is never imported at module-eval
 * time and never bundled into the app shell. Callers invoke {@link loadPostHog}
 * (or {@link capturePostHogEvent}) only after the user has granted c15t
 * measurement consent; the dynamic import then pulls the library in as a
 * separate chunk and initializes a single shared instance.
 *
 * The instance is configured for a minimal footprint: no autocapture and no
 * automatic pageviews. Today the only producer is the contextual "stuck"
 * feedback widget, which captures explicit events. Broader analytics
 * (pageviews, autocapture, session replay) are deliberately deferred — see
 * d3servelabs/namefi-astra#4634.
 */

let posthogPromise: Promise<PostHog | null> | null = null;

/** Whether a PostHog project token is configured for this environment. */
export function isPostHogConfigured(): boolean {
  return Boolean(config.POSTHOG_PROJECT_TOKEN);
}

async function initPostHog(): Promise<PostHog | null> {
  if (typeof window === 'undefined') return null;

  const token = config.POSTHOG_PROJECT_TOKEN;
  if (!token) return null;

  const { default: posthog } = await import('posthog-js');

  posthog.init(token, {
    api_host: config.POSTHOG_HOST,
    // Minimal footprint: only the events we capture explicitly are sent.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    // Avoid creating person profiles for anonymous visitors.
    person_profiles: 'identified_only',
    debug: config.TYPE === 'local',
  });

  return posthog;
}

/**
 * Initialize PostHog once and return the shared instance (or `null` when no
 * token is configured or when running on the server). Safe to call repeatedly —
 * initialization happens at most once.
 *
 * Only call this after measurement consent has been granted.
 */
function loadPostHog(): Promise<PostHog | null> {
  if (!posthogPromise) {
    posthogPromise = initPostHog();
  }
  return posthogPromise;
}

/** Capture a PostHog event, loading the client on first use. No-op without a token. */
export async function capturePostHogEvent(
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const posthog = await loadPostHog();
  posthog?.capture(event, properties);
}
