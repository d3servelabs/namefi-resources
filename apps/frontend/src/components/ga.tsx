'use client';

import { config } from '@/lib/env';
import { useEffect } from 'react';
import { useOrigin } from '@/components/providers/origin';
import { useConsentManager } from '@c15t/nextjs';
import {
  getGoogleAnalyticsConfig,
  getGoogleConsentState,
} from '@/lib/google-analytics-consent';

export function GoogleAnalyticsCookieConsentGated() {
  const { consents, isLoadingConsentInfo } = useConsentManager();
  const hasMeasurement = consents.measurement;
  const originInfo = useOrigin();

  useEffect(() => {
    if (!config.GA_MEASUREMENT_ID) return;
    if (isLoadingConsentInfo) return;

    window.gtag?.('consent', 'update', getGoogleConsentState(hasMeasurement));
    window.gtag?.('config', config.GA_MEASUREMENT_ID, {
      ...getGoogleAnalyticsConfig({
        originType: originInfo.isFirstPartyOrigin
          ? 'first_party'
          : 'third_party',
        originDomain: originInfo.thirdPartyHostname || 'astra',
        debugMode: config.TYPE === 'development',
      }),
      ...(!hasMeasurement ? { user_id: null } : {}),
      update: true,
    });
  }, [
    hasMeasurement,
    isLoadingConsentInfo,
    originInfo.isFirstPartyOrigin,
    originInfo.thirdPartyHostname,
  ]);

  return null;
}
