'use client';

import { config } from '@/lib/env';
import {
  GA_MEASUREMENT_ID,
  getGoogleAnalyticsConfig,
  getGoogleConsentState,
} from '@/lib/google-analytics-consent';
import { useEffect } from 'react';
import { useConsentManager } from '@c15t/nextjs';

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
        debugMode: config.TYPE === 'development' || config.TYPE === 'local',
      }),
      update: true,
    });
  }, [hasMeasurement, isLoadingConsentInfo]);

  return null;
}

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}
