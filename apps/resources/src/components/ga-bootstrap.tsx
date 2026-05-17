import { cookies, headers } from 'next/headers';
import Script from 'next/script';
import { config } from '@/lib/env';
import { resolveBaseUrl } from '@/lib/site-url';
import {
  buildGoogleAnalyticsBootstrapScript,
  C15T_CONSENT_COOKIE_NAME,
  fetchC15tInitialBannerData,
  GA_MEASUREMENT_ID,
  resolveInitialMeasurementConsent,
} from '@/lib/google-analytics-consent';

function resolveOriginDomain(requestHeaders: Headers) {
  const forwardedHost = requestHeaders.get('x-forwarded-host');
  if (forwardedHost) {
    return forwardedHost.split(',')[0]?.trim() || forwardedHost;
  }

  const host = requestHeaders.get('host');
  if (host) {
    return host.split(',')[0]?.trim() || host;
  }

  return new URL(resolveBaseUrl()).hostname;
}

export async function GoogleAnalyticsBootstrap() {
  if (!GA_MEASUREMENT_ID) return null;

  const [requestHeaders, cookieStore] = await Promise.all([
    headers(),
    cookies(),
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
    measurementId: GA_MEASUREMENT_ID,
    measurementGranted,
    originDomain: resolveOriginDomain(requestHeaders),
    debugMode: config.TYPE === 'development' || config.TYPE === 'local',
  });

  return (
    <>
      <Script id="ga-consent-bootstrap" strategy="beforeInteractive">
        {bootstrapScript}
      </Script>
      <Script
        id="ga-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="beforeInteractive"
      />
    </>
  );
}
