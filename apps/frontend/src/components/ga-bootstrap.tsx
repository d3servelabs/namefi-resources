import { cookies, headers } from 'next/headers';
import Script from 'next/script';
import { config } from '@/lib/env';
import { getOriginRuntime } from '@/lib/origin/utils.server';
import {
  buildGoogleAnalyticsBootstrapScript,
  C15T_CONSENT_COOKIE_NAME,
  fetchC15tInitialBannerData,
  resolveInitialMeasurementConsent,
} from '@/lib/google-analytics-consent';

export async function GoogleAnalyticsBootstrap() {
  if (!config.GA_MEASUREMENT_ID) return null;

  const [requestHeaders, cookieStore, originInfo] = await Promise.all([
    headers(),
    cookies(),
    getOriginRuntime(),
  ]);
  const initialBannerData = await fetchC15tInitialBannerData({
    backendUrl: config.BACKEND_URL,
    requestHeaders,
    onError(error) {
      console.error('[ga-bootstrap:consent-banner-fetch]', {
        name: error instanceof Error ? error.name : 'unknown',
        message: error instanceof Error ? error.message : String(error),
      });
    },
  });
  const measurementGranted = resolveInitialMeasurementConsent({
    consentCookieValue: cookieStore.get(C15T_CONSENT_COOKIE_NAME)?.value,
    initialBannerData,
  });
  const bootstrapScript = buildGoogleAnalyticsBootstrapScript({
    measurementId: config.GA_MEASUREMENT_ID,
    measurementGranted,
    originType: originInfo.isFirstPartyOrigin ? 'first_party' : 'third_party',
    originDomain: originInfo.thirdPartyHostname || 'astra',
    debugMode: config.TYPE === 'development',
  });

  return (
    <>
      <Script id="ga-consent-bootstrap" strategy="beforeInteractive">
        {bootstrapScript}
      </Script>
      <Script
        id="ga-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${config.GA_MEASUREMENT_ID}`}
        strategy="beforeInteractive"
      />
    </>
  );
}
