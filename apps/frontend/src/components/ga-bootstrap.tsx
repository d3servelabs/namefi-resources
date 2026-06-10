import { cookies, headers } from 'next/headers';
import Script from 'next/script';
import { config } from '@/lib/env';
import { getOriginRuntime } from '@/lib/origin/utils.server';
import {
  buildGoogleAnalyticsBootstrapScript,
  C15T_CONSENT_COOKIE_NAME,
  getC15tMeasurementConsentState,
  resolveInitialMeasurementConsent,
} from '@/lib/google-analytics-consent';

const C15T_BROWSER_BACKEND_URL = '/api/c15t';

export async function GoogleAnalyticsBootstrap() {
  if (!config.GA_MEASUREMENT_ID) return null;

  const [cookieStore, requestHeaders, originInfo] = await Promise.all([
    cookies(),
    headers(),
    getOriginRuntime(),
  ]);
  const consentCookieValue = cookieStore.get(C15T_CONSENT_COOKIE_NAME)?.value;
  const measurementConsentState =
    getC15tMeasurementConsentState(consentCookieValue);
  const measurementGranted = resolveInitialMeasurementConsent({
    consentCookieValue,
    requestHasGlobalPrivacyControl: requestHeaders.get('sec-gpc') === '1',
  });
  // First-page GA bootstrap avoids awaiting hosted policy data: doing that here
  // would put every route back on the request-render critical path this PR
  // removes. We still honor request-level GPC, while browser prefetch can grant
  // GA for opt-out/no-banner jurisdictions without blocking server rendering.
  const bootstrapScript = buildGoogleAnalyticsBootstrapScript({
    measurementId: config.GA_MEASUREMENT_ID,
    measurementGranted,
    originType: originInfo.isFirstPartyOrigin ? 'first_party' : 'third_party',
    originDomain: originInfo.thirdPartyHostname || 'astra',
    debugMode: config.TYPE === 'development',
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
        src={`https://www.googletagmanager.com/gtag/js?id=${config.GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}
