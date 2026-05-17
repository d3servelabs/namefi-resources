/** biome-ignore-all lint/style/useNamingConvention: Google Consent Mode uses snake_case keys */
export const GA_CLIENT_ID_HEADER = 'X-GA-Client-Id';
export const GA_SESSION_ID_HEADER = 'X-GA-Session-Id';
export const BROWSER_FINGERPRINT_HEADER = 'X-Browser-Fingerprint';
export const C15T_MEASUREMENT_CONSENT_HEADER = 'X-C15T-Measurement-Consent';

export const C15T_CONSENT_COOKIE_NAME = 'c15t';

const CONSENT_COOKIE_PREFIX = 'c.';
const GA_CLIENT_ID_REGEX = /^[1-9]\d*\.[1-9]\d*$/;
const GA_SESSION_ID_REGEX = /^\d+$/;
const GA_COOKIE_PREFIX_REGEX = /^GA\d+$/;
const GA4_GS2_SESSION_ID_REGEX = /(?:^|[.$])s(\d+)(?:[$.]|$)/;

type C15tConsentCategory =
  | 'necessary'
  | 'functionality'
  | 'experience'
  | 'marketing'
  | 'measurement';

type C15tConsentState = Record<C15tConsentCategory, boolean>;

type ParsedC15tConsentCookie = {
  consents: C15tConsentState;
};

export type C15tMeasurementConsentState = 'granted' | 'denied' | 'unknown';

export type C15tInitialBannerData = {
  showConsentBanner: boolean;
  jurisdiction?: {
    code?: string | null;
  } | null;
};

export type FetchC15tInitialBannerDataOptions = {
  backendUrl: string;
  requestHeaders: Pick<Headers, 'get'>;
  fetcher?: typeof fetch;
  timeoutMs?: number;
  onError?: (error: unknown) => void;
};

type GoogleConsentValue = 'granted' | 'denied';

const C15T_COUNTRY_HEADER_PRIORITY = [
  'x-c15t-country',
  'x-client-geo-location-region',
  'cf-ipcountry',
  'x-vercel-ip-country',
  'x-amz-cf-ipcountry',
  'x-country-code',
] as const;

const C15T_REGION_HEADER_PRIORITY = [
  'x-c15t-region',
  'x-client-geo-location-region-subdivision',
  'x-vercel-ip-country-region',
  'x-region-code',
] as const;

const C15T_SHOW_BANNER_PASSTHROUGH_HEADERS = [
  ...C15T_COUNTRY_HEADER_PRIORITY,
  ...C15T_REGION_HEADER_PRIORITY,
  'accept-language',
  'user-agent',
  'x-forwarded-host',
  'x-forwarded-for',
] as const;

export type GoogleConsentState = {
  analytics_storage: GoogleConsentValue;
  ad_storage: GoogleConsentValue;
  ad_user_data: GoogleConsentValue;
  ad_personalization: GoogleConsentValue;
};

export type GoogleConsentDefaultState = GoogleConsentState & {
  wait_for_update: number;
};

export type GoogleAnalyticsOriginType = 'first_party' | 'third_party';

export type GoogleAnalyticsConfig = {
  allow_google_signals: boolean;
  allow_ad_personalization_signals: boolean;
  origin_type: GoogleAnalyticsOriginType;
  origin_domain: string;
  debug_mode: boolean;
};

const DEFAULT_C15T_CONSENTS: C15tConsentState = {
  necessary: false,
  functionality: false,
  experience: false,
  marketing: false,
  measurement: false,
};
const CONSENT_UPDATE_WAIT_MS = 500;

function isConsentCategory(value: string): value is C15tConsentCategory {
  return value in DEFAULT_C15T_CONSENTS;
}

export function normalizeGaClientId(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (GA_CLIENT_ID_REGEX.test(trimmed)) return trimmed;

  const cookieParts = trimmed.split('.');
  if (
    !GA_COOKIE_PREFIX_REGEX.test(cookieParts[0] ?? '') ||
    cookieParts.length < 4
  ) {
    return null;
  }

  const normalizedClientId = cookieParts.slice(-2).join('.');
  return GA_CLIENT_ID_REGEX.test(normalizedClientId)
    ? normalizedClientId
    : null;
}

export function parseGaClientIdFromCookieValue(
  cookieValue?: string | null,
): string | null {
  return normalizeGaClientId(cookieValue);
}

export function normalizeGaSessionId(
  value?: string | number | null,
): string | null {
  const trimmed = String(value ?? '').trim();
  if (!trimmed || !GA_SESSION_ID_REGEX.test(trimmed)) return null;

  const sessionId = Number(trimmed);
  return Number.isSafeInteger(sessionId) && sessionId > 0 ? trimmed : null;
}

export function parseGaSessionIdFromCookieValue(
  cookieValue?: string | null,
): string | null {
  const trimmed = cookieValue?.trim();
  if (!trimmed) return null;

  const gs2SessionId = trimmed.match(GA4_GS2_SESSION_ID_REGEX)?.[1];
  if (gs2SessionId) {
    return normalizeGaSessionId(gs2SessionId);
  }

  const parts = trimmed.split('.');
  return normalizeGaSessionId(parts[2]);
}

export function parseC15tConsentCookie(
  cookieValue?: string,
): ParsedC15tConsentCookie | null {
  if (!cookieValue) return null;

  const consents = { ...DEFAULT_C15T_CONSENTS };
  let hasConsentEntry = false;

  for (const pair of cookieValue.split(',')) {
    const separatorIndex = pair.indexOf(':');
    if (separatorIndex === -1) continue;

    const rawKey = pair.slice(0, separatorIndex);
    const rawValue = pair.slice(separatorIndex + 1);

    if (!rawKey.startsWith(CONSENT_COOKIE_PREFIX)) continue;

    const consentKey = rawKey.slice(CONSENT_COOKIE_PREFIX.length);
    if (!isConsentCategory(consentKey)) continue;

    consents[consentKey] = rawValue === '1';
    hasConsentEntry = true;
  }

  return hasConsentEntry ? { consents } : null;
}

export function getC15tMeasurementConsentState(
  cookieValue?: string,
): C15tMeasurementConsentState {
  const parsed = parseC15tConsentCookie(cookieValue);
  if (!parsed) return 'unknown';
  return parsed.consents.measurement ? 'granted' : 'denied';
}

export function parseC15tMeasurementConsentHeader(
  headerValue?: string | null,
): C15tMeasurementConsentState {
  const normalized = headerValue?.trim().toLowerCase();
  if (normalized === 'granted' || normalized === 'denied') {
    return normalized;
  }
  return 'unknown';
}

export function mergeC15tMeasurementConsentStates(
  ...states: C15tMeasurementConsentState[]
): C15tMeasurementConsentState {
  if (states.includes('denied')) return 'denied';
  if (states.includes('granted')) return 'granted';
  return 'unknown';
}

export function buildC15tShowConsentBannerHeaders(
  requestHeaders: Pick<Headers, 'get'>,
): Headers | null {
  const relevantHeaders = new Headers();
  let hasRelevantHeader = false;

  for (const header of C15T_SHOW_BANNER_PASSTHROUGH_HEADERS) {
    const value = requestHeaders.get(header);
    if (value) {
      relevantHeaders.set(header, value);
      hasRelevantHeader = true;
    }
  }

  const countryHeader = C15T_COUNTRY_HEADER_PRIORITY.find((header) =>
    requestHeaders.get(header),
  );
  if (countryHeader) {
    relevantHeaders.set(
      'x-c15t-country',
      requestHeaders.get(countryHeader) as string,
    );
  }

  const regionHeader = C15T_REGION_HEADER_PRIORITY.find((header) =>
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

export function isC15tInitialBannerData(
  value: unknown,
): value is C15tInitialBannerData {
  if (!value || typeof value !== 'object') return false;
  const response = value as {
    showConsentBanner?: unknown;
    jurisdiction?: { code?: unknown } | null;
  };

  return (
    typeof response.showConsentBanner === 'boolean' &&
    (response.jurisdiction == null ||
      typeof response.jurisdiction.code === 'string' ||
      response.jurisdiction.code == null)
  );
}

export async function fetchC15tInitialBannerData({
  backendUrl,
  requestHeaders,
  fetcher = fetch,
  timeoutMs = 1500,
  onError,
}: FetchC15tInitialBannerDataOptions): Promise<C15tInitialBannerData | null> {
  const forwardedHeaders = buildC15tShowConsentBannerHeaders(requestHeaders);
  if (!forwardedHeaders) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(`${backendUrl}/c15t/show-consent-banner`, {
      method: 'GET',
      headers: forwardedHeaders,
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const initialBannerData: unknown = await response.json();
    return isC15tInitialBannerData(initialBannerData)
      ? initialBannerData
      : null;
  } catch (error) {
    onError?.(error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function resolveInitialMeasurementConsent(args: {
  consentCookieValue?: string;
  initialBannerData?: C15tInitialBannerData | null;
}): boolean {
  const storedConsent = getC15tMeasurementConsentState(args.consentCookieValue);
  if (storedConsent !== 'unknown') {
    return storedConsent === 'granted';
  }

  return (
    args.initialBannerData?.jurisdiction?.code === 'NONE' &&
    args.initialBannerData.showConsentBanner === false
  );
}

export function getGoogleConsentState(
  measurementGranted: boolean,
): GoogleConsentState {
  return {
    analytics_storage: measurementGranted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  };
}

export function getGoogleConsentDefaultState(
  measurementGranted: boolean,
): GoogleConsentDefaultState {
  return {
    ...getGoogleConsentState(measurementGranted),
    wait_for_update: CONSENT_UPDATE_WAIT_MS,
  };
}

export function getGoogleAnalyticsConfig(args: {
  originType: GoogleAnalyticsOriginType;
  originDomain: string;
  debugMode: boolean;
}): GoogleAnalyticsConfig {
  return {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    origin_type: args.originType,
    origin_domain: args.originDomain,
    debug_mode: args.debugMode,
  };
}

function escapeInlineScriptJson(value: string): string {
  return value
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function buildGoogleAnalyticsBootstrapScript(args: {
  measurementId: string;
  measurementGranted: boolean;
  originType: GoogleAnalyticsOriginType;
  originDomain: string;
  debugMode: boolean;
  exposeMeasurementConsent?: boolean;
}): string {
  const consentState = escapeInlineScriptJson(
    JSON.stringify(getGoogleConsentDefaultState(args.measurementGranted)),
  );
  const configState = escapeInlineScriptJson(
    JSON.stringify(
      getGoogleAnalyticsConfig({
        originType: args.originType,
        originDomain: args.originDomain,
        debugMode: args.debugMode,
      }),
    ),
  );

  return [
    'window.dataLayer = window.dataLayer || [];',
    args.exposeMeasurementConsent
      ? `window.namefiMeasurementConsent = ${JSON.stringify(args.measurementGranted)};`
      : undefined,
    'window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments);};',
    `window.gtag('consent', 'default', ${consentState});`,
    "window.gtag('js', new Date());",
    `window.gtag('config', ${JSON.stringify(args.measurementId)}, ${configState});`,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');
}
