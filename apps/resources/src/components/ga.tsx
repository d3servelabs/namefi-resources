'use client';

import {
  GA_MEASUREMENT_ID,
  getGoogleAnalyticsConfig,
  getGoogleConsentState,
} from '@/lib/google-analytics-consent';
import { useEffect } from 'react';
import { useConsentManager } from '@c15t/nextjs';

// Read the environment from the define-inlined `process.env.ENVIRONMENT` rather
// than the zod-validated `config` from '@/lib/env'. Importing '@/lib/env' in a
// client component pulled the entire zod schema + zod runtime into the client
// bundle just to read config.TYPE. `process.env.ENVIRONMENT` carries the same
// value (it selects which config is loaded) at zero client-side cost.
const IS_DEBUG_ENV =
  process.env.ENVIRONMENT === 'development' ||
  process.env.ENVIRONMENT === 'local';

export function GoogleAnalyticsCookieConsentGated() {
  const { consents, isLoadingConsentInfo } = useConsentManager();
  const hasMeasurement = consents.measurement;

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    if (isLoadingConsentInfo) return;

    const domain =
      typeof window !== 'undefined' && window.location.hostname
        ? window.location.hostname
        : 'namefi.io';
    window.gtag?.('consent', 'update', getGoogleConsentState(hasMeasurement));
    window.gtag?.('config', GA_MEASUREMENT_ID, {
      ...getGoogleAnalyticsConfig({
        originDomain: domain,
        debugMode: IS_DEBUG_ENV,
      }),
      update: true,
    });
  }, [hasMeasurement, isLoadingConsentInfo]);

  return null;
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
