import { cookies, headers } from 'next/headers';
import Script from 'next/script';
import { config } from '@/lib/env';
import { resolveBaseUrl } from '@/lib/site-url';
import {
  buildGoogleAnalyticsBootstrapScript,
  C15T_CONSENT_COOKIE_NAME,
  GA_MEASUREMENT_ID,
  resolveInitialMeasurementConsent,
  type C15tInitialBannerData,
} from '@/lib/google-analytics-consent';

const COUNTRY_PRIORITY = [
  'cf-ipcountry',
  'x-vercel-ip-country',
  'x-amz-cf-ipcountry',
  'x-country-code',
] as const;

const REGION_PRIORITY = [
  'x-vercel-ip-country-region',
  'x-region-code',
] as const;

const FORWARDED_HEADERS = [
  ...COUNTRY_PRIORITY,
  ...REGION_PRIORITY,
  'accept-language',
  'user-agent',
  'x-forwarded-host',
  'x-forwarded-for',
] as const;

function extractRelevantHeaders(requestHeaders: Headers) {
  const relevantHeaders = new Headers();
  let hasRelevantHeader = false;

  for (const header of FORWARDED_HEADERS) {
    const value = requestHeaders.get(header);
    if (value) {
      relevantHeaders.set(header, value);
      hasRelevantHeader = true;
    }
  }

  const countryHeader = COUNTRY_PRIORITY.find((header) =>
    requestHeaders.get(header),
  );
  if (countryHeader) {
    relevantHeaders.set(
      'x-c15t-country',
      requestHeaders.get(countryHeader) as string,
    );
  }

  const regionHeader = REGION_PRIORITY.find((header) =>
    requestHeaders.get(header),
  );
  if (regionHeader) {
    relevantHeaders.set(
      'x-c15t-region',
      requestHeaders.get(regionHeader) as string,
    );
  }

  return hasRelevantHeader ? relevantHeaders : null;
}

async function getInitialBannerData(
  requestHeaders: Headers,
): Promise<C15tInitialBannerData | null> {
  const forwardedHeaders = extractRelevantHeaders(requestHeaders);
  if (!forwardedHeaders) return null;

  try {
    const response = await fetch(
      `${config.BACKEND_URL}/c15t/show-consent-banner`,
      {
        method: 'GET',
        headers: forwardedHeaders,
        cache: 'no-store',
      },
    );

    if (!response.ok) return null;

    return (await response.json()) as C15tInitialBannerData;
  } catch (error) {
    console.error('[ga-bootstrap:consent-banner-fetch]', {
      name: error instanceof Error ? error.name : 'unknown',
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

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
  const initialBannerData = await getInitialBannerData(requestHeaders);
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
