import {
  buildGoogleAnalyticsBootstrapScript as buildSharedGoogleAnalyticsBootstrapScript,
  getGoogleAnalyticsConfig as getSharedGoogleAnalyticsConfig,
  type GoogleAnalyticsConfig as SharedGoogleAnalyticsConfig,
} from '@namefi-astra/common/google-analytics';

export {
  buildC15tShowConsentBannerHeaders,
  fetchC15tInitialBannerData,
  C15T_CONSENT_COOKIE_NAME,
  getGoogleConsentDefaultState,
  getGoogleConsentState,
  isC15tInitialBannerData,
  parseC15tConsentCookie,
  resolveInitialMeasurementConsent,
  type C15tInitialBannerData,
  type FetchC15tInitialBannerDataOptions,
  type GoogleConsentDefaultState,
  type GoogleConsentState,
} from '@namefi-astra/common/google-analytics';

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ??
  process.env.GA_MEASUREMENT_ID ??
  '';

export type GoogleAnalyticsConfig = SharedGoogleAnalyticsConfig & {
  origin_type: 'first_party';
};

export function getGoogleAnalyticsConfig(args: {
  originDomain: string;
  debugMode: boolean;
}): GoogleAnalyticsConfig {
  return getSharedGoogleAnalyticsConfig({
    originType: 'first_party',
    originDomain: args.originDomain,
    debugMode: args.debugMode,
  }) as GoogleAnalyticsConfig;
}

export function buildGoogleAnalyticsBootstrapScript(args: {
  measurementId: string;
  measurementGranted: boolean;
  originDomain: string;
  debugMode: boolean;
}): string {
  return buildSharedGoogleAnalyticsBootstrapScript({
    ...args,
    originType: 'first_party',
  });
}
