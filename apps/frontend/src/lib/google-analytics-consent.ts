export {
  buildC15tInitHeaders,
  C15T_CONSENT_COOKIE_NAME,
  fetchC15tInitData,
  getC15tMeasurementConsentState,
  getGoogleAnalyticsConfig,
  getGoogleConsentDefaultState,
  getGoogleConsentState,
  isC15tInitData,
  parseC15tConsentCookie,
  resolveInitialMeasurementConsent,
  type C15tInitData,
  type GoogleAnalyticsConfig,
  type GoogleConsentDefaultState,
  type GoogleConsentState,
  type FetchC15tInitDataOptions,
} from '@namefi-astra/common/google-analytics';

import {
  buildGoogleAnalyticsBootstrapScript as buildSharedGoogleAnalyticsBootstrapScript,
  type GoogleAnalyticsOriginType,
} from '@namefi-astra/common/google-analytics';

export function buildGoogleAnalyticsBootstrapScript(args: {
  measurementId: string;
  measurementGranted: boolean;
  originType: GoogleAnalyticsOriginType;
  originDomain: string;
  debugMode: boolean;
  c15tPrefetchBackendUrl?: string;
}): string {
  return buildSharedGoogleAnalyticsBootstrapScript({
    ...args,
    exposeMeasurementConsent: true,
  });
}
