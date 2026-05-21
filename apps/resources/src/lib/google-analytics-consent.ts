import {
  buildGoogleAnalyticsBootstrapScript as buildSharedGoogleAnalyticsBootstrapScript,
  getGoogleAnalyticsConfig as getSharedGoogleAnalyticsConfig,
  type GoogleAnalyticsConfig as SharedGoogleAnalyticsConfig,
} from '@namefi-astra/common/google-analytics';

export {
  buildC15tInitHeaders,
  fetchC15tInitData,
  C15T_CONSENT_COOKIE_NAME,
  getC15tMeasurementConsentState,
  getGoogleConsentDefaultState,
  getGoogleConsentState,
  isC15tInitData,
  parseC15tConsentCookie,
  resolveInitialMeasurementConsent,
  type C15tInitData,
  type FetchC15tInitDataOptions,
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
  c15tPrefetchBackendUrl?: string;
}): string {
  return buildSharedGoogleAnalyticsBootstrapScript({
    ...args,
    originType: 'first_party',
  });
}
