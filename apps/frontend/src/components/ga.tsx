'use client';

import { config } from '@/lib/env';
import { useEffect } from 'react';
import { useOrigin } from '@/components/providers/origin';
import { useConsentManager } from '@c15t/nextjs';
import { useAuth } from '@/hooks/use-auth';
import {
  getGoogleAnalyticsConfig,
  getGoogleConsentState,
} from '@/lib/google-analytics-consent';

export function GoogleAnalyticsCookieConsentGated() {
  const { consents, isLoadingConsentInfo } = useConsentManager();
  const hasMeasurement = consents.measurement;
  const originInfo = useOrigin();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const gaUserId =
    hasMeasurement && !isAuthLoading && isAuthenticated ? user?.id : null;

  useEffect(() => {
    if (!config.GA_MEASUREMENT_ID) return;
    if (isLoadingConsentInfo) return;

    (
      window as typeof window & { namefiMeasurementConsent?: boolean }
    ).namefiMeasurementConsent = hasMeasurement;
    window.gtag?.('consent', 'update', getGoogleConsentState(hasMeasurement));
    window.gtag?.('config', config.GA_MEASUREMENT_ID, {
      ...getGoogleAnalyticsConfig({
        originType: originInfo.isFirstPartyOrigin
          ? 'first_party'
          : 'third_party',
        originDomain: originInfo.thirdPartyHostname || 'astra',
        debugMode: config.TYPE === 'development',
      }),
      user_id: gaUserId,
      update: true,
    });
  }, [
    gaUserId,
    hasMeasurement,
    isLoadingConsentInfo,
    originInfo.isFirstPartyOrigin,
    originInfo.thirdPartyHostname,
  ]);

  return null;
}
