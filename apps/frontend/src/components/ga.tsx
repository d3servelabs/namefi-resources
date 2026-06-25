'use client';

import { config } from '@/lib/env';
import { useEffect, useState } from 'react';
import { useOrigin } from '@/components/providers/origin';
import { useNamefiConsent } from '@/components/providers/consent/namefi-consent';
import {
  getGoogleAnalyticsConfig,
  getGoogleConsentState,
} from '@/lib/google-analytics-consent';
import dynamic from 'next/dynamic';

const GoogleAnalyticsAuthenticatedUserSync = dynamic(
  () =>
    import('@/components/ga-auth-sync').then(
      (mod) => mod.GoogleAnalyticsAuthenticatedUserSync,
    ),
  { ssr: false },
);

export function GoogleAnalyticsCookieConsentGated() {
  const { consents, isLoadingConsentInfo } = useNamefiConsent();
  const hasMeasurement = consents.measurement;
  const originInfo = useOrigin();

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

export function GoogleAnalyticsAuthenticatedUserGated() {
  const { consents, isLoadingConsentInfo } = useNamefiConsent();
  const [shouldMountUserSync, setShouldMountUserSync] = useState(false);

  // Keep the sync mounted after first grant so logout or consent revocation can
  // explicitly clear GA's page-level user_id state.
  useEffect(() => {
    if (!config.GA_MEASUREMENT_ID) return;
    if (isLoadingConsentInfo) return;
    if (consents.measurement) {
      setShouldMountUserSync(true);
    }
  }, [consents.measurement, isLoadingConsentInfo]);

  if (!shouldMountUserSync) return null;

  return <GoogleAnalyticsAuthenticatedUserSync />;
}
