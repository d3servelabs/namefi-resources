export {
  buildC15tShowConsentBannerHeaders,
  C15T_CONSENT_COOKIE_NAME,
  fetchC15tInitialBannerData,
  getGoogleAnalyticsConfig,
  getGoogleConsentDefaultState,
  getGoogleConsentState,
  isC15tInitialBannerData,
  parseC15tConsentCookie,
  resolveInitialMeasurementConsent,
  type C15tInitialBannerData,
  type GoogleAnalyticsConfig,
  type GoogleConsentDefaultState,
  type GoogleConsentState,
  type FetchC15tInitialBannerDataOptions,
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
}): string {
  return buildSharedGoogleAnalyticsBootstrapScript({
    ...args,
    exposeMeasurementConsent: true,
  });
}
