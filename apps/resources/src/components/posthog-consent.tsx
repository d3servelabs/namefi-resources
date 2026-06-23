'use client';

import { useConsentManager } from '@c15t/nextjs';
import { useEffect } from 'react';
import { isPostHogConfigured, setPostHogConsent } from '@/lib/posthog';

// Bridges c15t measurement consent to the lazy PostHog client (lib/posthog.ts),
// mirroring GoogleAnalyticsCookieConsentGated. Mounted inside the deferred
// consent island so PostHog only initializes after a consent decision and never
// touches the first-paint critical path. Captures made before consent resolves
// are no-ops; GA still records them via its server-seeded bootstrap.
export function PostHogCookieConsentGated() {
  const { consents, isLoadingConsentInfo } = useConsentManager();
  const hasMeasurement = consents.measurement;

  useEffect(() => {
    if (!isPostHogConfigured()) return;
    if (isLoadingConsentInfo) return;
    setPostHogConsent(Boolean(hasMeasurement));
  }, [hasMeasurement, isLoadingConsentInfo]);

  return null;
}
