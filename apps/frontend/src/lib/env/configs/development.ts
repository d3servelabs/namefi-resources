import { CHAINS as chains } from '@namefi-astra/utils/chains';
import type { ConfigInput } from '../schema';
import { POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES } from '../consts';

const developmentConfig: ConfigInput = {
  TYPE: 'development',
  BACKEND_URL: 'https://backend.astra.namefi.dev',
  RESOURCES_URL: 'https://r.namefi.dev',
  DOCS_URL: 'https://docs.namefi.dev',
  FIRST_PARTY_DEPLOYMENT_URL: 'https://namefi.dev',
  GA_MEASUREMENT_ID: 'G-PHKF9PM32W',
  // "Namefi Dev" PostHog project (sourced from Infisical at build time).
  POSTHOG_PROJECT_TOKEN: process.env.POSTHOG_PROJECT_TOKEN,
  POSTHOG_HOST: process.env.POSTHOG_HOST,
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  STRIPE_PUBLISHABLE_KEY:
    'pk_test_51Pqc6fP7AJmUlGkqATatN7ovwZrEo0WjmJTjryazMHsXRIzk1WrMQv1C0SQ8J4LrTnrc2O5P4XxnTmtSKIfdl2Ct00o9GOerUj',
  NAMEFI_FIRST_PARTY_HOSTNAMES: ['namefi.dev'],
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES,
  ADDITIONAL_HOSTNAME_MAP: Object.fromEntries(
    POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES.flatMap((hostname) => [
      [`${hostname}.poweredby.namefi.dev`, hostname],
      [`${hostname}.astra.namefi.dev`, hostname],
    ]),
  ),
  ALLOWED_CHAINS: [chains.sepolia.id, chains.base.id, chains.mainnet.id],
  HUNT_CAMPAIGN_KEYS: ['cv-2025-07-16', 'cta-2025-07-16'],
  DATADOG_LOGS_SESSION_SAMPLE_RATE: 100,
  LAUNCHDARKLY_CLIENT_SIDE_ID: '6a156ee2449acb0a75e3ae79',
  DOMAINS_SUGGESTIONS_TLDS_SET: 'test-tlds',
};

export default developmentConfig;
