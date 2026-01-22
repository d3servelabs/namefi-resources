'use client';

import { config } from '@/lib/env';
import { useEffect } from 'react';
import { useOrigin } from '@/components/providers/origin';
import { useConsentManager } from '@c15t/nextjs';

export function GoogleAnalyticsCookieConsentGated() {
  const { has } = useConsentManager();
  const hasMeasurement = has('measurement');
  const originInfo = useOrigin();

  useEffect(() => {
    if (!hasMeasurement || !config.GA_MEASUREMENT_ID) return;
    window.gtag?.('config', config.GA_MEASUREMENT_ID, {
      origin_type: originInfo.isFirstPartyOrigin
        ? 'first_party'
        : 'third_party',
      origin_domain: originInfo.thirdPartyHostname || 'astra',
      update: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      debug_mode: config.TYPE === 'development',
    });
  }, [
    hasMeasurement,
    originInfo.isFirstPartyOrigin,
    originInfo.thirdPartyHostname,
  ]);

  return null;
}
