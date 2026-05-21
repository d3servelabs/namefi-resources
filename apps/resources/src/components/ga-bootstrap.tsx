import { cookies, headers } from 'next/headers';
import Script from 'next/script';
import { config } from '@/lib/env';
import { C15T_BROWSER_BACKEND_URL } from '@/lib/c15t';
import { resolveBaseUrl } from '@/lib/site-url';
import {
  buildGoogleAnalyticsBootstrapScript,
  C15T_CONSENT_COOKIE_NAME,
  GA_MEASUREMENT_ID,
  getC15tMeasurementConsentState,
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
  const consentCookieValue = cookieStore.get(C15T_CONSENT_COOKIE_NAME)?.value;
  const measurementConsentState =
    getC15tMeasurementConsentState(consentCookieValue);
  const measurementGranted = resolveInitialMeasurementConsent({
    consentCookieValue,
  });
  // First-page GA bootstrap is intentionally policy-blind: awaiting /c15t/init
  // here would put every route back on the request-render critical path this PR
  // removes. Browser prefetch consumes hosted policy data and can grant GA for
  // opt-out/no-banner jurisdictions without blocking server rendering.
  const bootstrapScript = buildGoogleAnalyticsBootstrapScript({
    measurementId: GA_MEASUREMENT_ID,
    measurementGranted,
    originDomain: resolveOriginDomain(requestHeaders),
    debugMode: config.TYPE === 'development' || config.TYPE === 'local',
    c15tPrefetchBackendUrl:
      measurementConsentState === 'unknown'
        ? C15T_BROWSER_BACKEND_URL
        : undefined,
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
