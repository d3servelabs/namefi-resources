import { CHAINS as chains } from '@namefi-astra/utils/chains';
import type { ConfigInput } from '../schema';
import { POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES } from '../consts';

// Dynamic port support: use explicit environment variables if set by dev runner.
// Next's dev server owns PORT, so do not use it as the backend default here.
const backendPort = process.env.BACKEND_PORT || '3000';
const frontendPort = process.env.FRONTEND_PORT || '5050';

const localConfig: ConfigInput = {
  TYPE: 'local',
  BACKEND_URL: process.env.BACKEND_URL || `http://localhost:${backendPort}`,
  RESOURCES_URL: 'https://localhost:3002',
  FIRST_PARTY_DEPLOYMENT_URL: `https://localhost:${frontendPort}`,
  DOCS_URL: 'https://localhost:3003',
  GA_MEASUREMENT_ID: 'G-PHKF9PM32W',
  // "Namefi Dev" PostHog project (sourced from Infisical at build time).
  POSTHOG_PROJECT_TOKEN: process.env.POSTHOG_PROJECT_TOKEN,
  POSTHOG_HOST: process.env.POSTHOG_HOST,
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  STRIPE_PUBLISHABLE_KEY:
    'pk_test_51Pqc6fP7AJmUlGkqATatN7ovwZrEo0WjmJTjryazMHsXRIzk1WrMQv1C0SQ8J4LrTnrc2O5P4XxnTmtSKIfdl2Ct00o9GOerUj',
  NAMEFI_FIRST_PARTY_HOSTNAMES: [
    'localhost',
    'namefi.localhost',
    'astra.localhost',
  ],
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES,
  ADDITIONAL_HOSTNAME_MAP: Object.fromEntries(
    POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES.flatMap((hostname) => [
      [`${hostname}.localhost`, hostname],
    ]),
  ),
  ALLOWED_CHAINS: [chains.sepolia.id],
  HUNT_CAMPAIGN_KEYS: ['cv-2025-07-16', 'cta-2025-07-16'],
  DATADOG_LOGS_SESSION_SAMPLE_RATE: 0,
  LAUNCHDARKLY_CLIENT_SIDE_ID: '6a156f0ee7a0a90a6a1d799c',
  DOMAINS_SUGGESTIONS_TLDS_SET: 'test-tlds',
};

export default localConfig;
