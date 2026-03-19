export const C15T_CONSENT_COOKIE_NAME = 'c15t';

const CONSENT_COOKIE_PREFIX = 'c.';

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

export type C15tInitialBannerData = {
  showConsentBanner: boolean;
  jurisdiction?: {
    code?: string | null;
  } | null;
};

type GoogleConsentValue = 'granted' | 'denied';

export type GoogleConsentState = {
  analytics_storage: GoogleConsentValue;
  ad_storage: GoogleConsentValue;
  ad_user_data: GoogleConsentValue;
  ad_personalization: GoogleConsentValue;
};

export type GoogleAnalyticsConfig = {
  allow_google_signals: boolean;
  allow_ad_personalization_signals: boolean;
  origin_type: 'first_party' | 'third_party';
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

function isConsentCategory(value: string): value is C15tConsentCategory {
  return value in DEFAULT_C15T_CONSENTS;
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

export function resolveInitialMeasurementConsent(args: {
  consentCookieValue?: string;
  initialBannerData?: C15tInitialBannerData | null;
}): boolean {
  const storedConsent = parseC15tConsentCookie(args.consentCookieValue);
  if (storedConsent) {
    return storedConsent.consents.measurement;
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

export function getGoogleAnalyticsConfig(args: {
  originType: 'first_party' | 'third_party';
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

export function buildGoogleAnalyticsBootstrapScript(args: {
  measurementId: string;
  measurementGranted: boolean;
  originType: 'first_party' | 'third_party';
  originDomain: string;
  debugMode: boolean;
}): string {
  const consentState = JSON.stringify(
    getGoogleConsentState(args.measurementGranted),
  );
  const configState = JSON.stringify(
    getGoogleAnalyticsConfig({
      originType: args.originType,
      originDomain: args.originDomain,
      debugMode: args.debugMode,
    }),
  );

  return [
    'window.dataLayer = window.dataLayer || [];',
    'window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments);};',
    `window.gtag('consent', 'default', ${consentState});`,
    "window.gtag('js', new Date());",
    `window.gtag('config', ${JSON.stringify(args.measurementId)}, ${configState});`,
  ].join('\n');
}
