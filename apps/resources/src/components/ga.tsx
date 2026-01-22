'use client';

import { useEffect } from 'react';
import { useConsentManager } from '@c15t/nextjs';

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ??
  process.env.GA_MEASUREMENT_ID ??
  '';

export function GoogleAnalyticsCookieConsentGated() {
  const { has } = useConsentManager();
  const hasMeasurement = has('measurement');

  const isDevelopment =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ||
    process.env.ENVIRONMENT === 'development' ||
    process.env.NODE_ENV !== 'production';

  useEffect(() => {
    if (!hasMeasurement || !GA_MEASUREMENT_ID) return;
    const domain =
      typeof window !== 'undefined' && window.location.hostname
        ? window.location.hostname
        : 'astra';
    window.gtag?.('config', GA_MEASUREMENT_ID, {
      origin_type: 'first_party',
      origin_domain: domain,
      update: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      debug_mode: isDevelopment,
    });
  }, [hasMeasurement, isDevelopment]);

  return null;
}

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}
