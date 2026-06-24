import { CHAINS } from '@namefi-astra/utils/chains';
import { parseAllowedChainsConfigValue } from '@namefi-astra/utils/allowed-chains';
import type { ConfigInput } from '../schema';
import { POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES } from '../consts';

function normaliseHttpsUrl(value: string): string {
  const trimmed = value.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, 'https://');
  }

  return `https://${trimmed}`;
}

const previewDeploymentUrl = (() => {
  const explicitDeploymentUrl =
    process.env.FIRST_PARTY_DEPLOYMENT_URL ??
    process.env.NEXT_PUBLIC_FIRST_PARTY_DEPLOYMENT_URL;
  if (explicitDeploymentUrl) {
    return normaliseHttpsUrl(explicitDeploymentUrl);
  }

  const systemDeploymentHost =
    process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL;
  if (systemDeploymentHost) {
    return normaliseHttpsUrl(systemDeploymentHost);
  }

  return 'https://namefi.dev';
})();

const previewFirstPartyHostnames = (() => {
  if (process.env.NAMEFI_FIRST_PARTY_HOSTNAMES) {
    return process.env.NAMEFI_FIRST_PARTY_HOSTNAMES.split(',')
      .map((hostname) => hostname.trim())
      .filter(Boolean);
  }

  return Array.from(
    new Set([new URL(previewDeploymentUrl).hostname, 'namefi.dev']),
  );
})();

const previewConfig: ConfigInput = {
  TYPE: 'preview',
  BACKEND_URL: process.env.BACKEND_URL || 'https://backend.astra.namefi.dev',
  RESOURCES_URL: process.env.RESOURCES_URL || 'https://r.namefi.dev',
  DOCS_URL: process.env.DOCS_URL || 'https://docs.namefi.dev',
  FIRST_PARTY_DEPLOYMENT_URL: previewDeploymentUrl,
  GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID || 'G-PHKF9PM32W',
  // "Namefi Dev" PostHog project (sourced from Infisical at build time).
  POSTHOG_PROJECT_TOKEN: process.env.POSTHOG_PROJECT_TOKEN,
  POSTHOG_HOST: process.env.POSTHOG_HOST,
  PRIVY_APP_ID: process.env.PRIVY_APP_ID || 'cm2lx4u5a03x3rtgp4keapmrb',
  STRIPE_PUBLISHABLE_KEY:
    process.env.STRIPE_PUBLISHABLE_KEY ||
    'pk_test_51Pqc6fP7AJmUlGkqATatN7ovwZrEo0WjmJTjryazMHsXRIzk1WrMQv1C0SQ8J4LrTnrc2O5P4XxnTmtSKIfdl2Ct00o9GOerUj',
  NAMEFI_FIRST_PARTY_HOSTNAMES: previewFirstPartyHostnames,
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES,
  ADDITIONAL_HOSTNAME_MAP: Object.fromEntries(
    POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES.flatMap((hostname) => [
      [`${hostname}.localhost`, hostname],
    ]),
  ),
  ALLOWED_CHAINS: parseAllowedChainsConfigValue(process.env.ALLOWED_CHAINS, [
    CHAINS.sepolia.id,
  ]),
  HUNT_CAMPAIGN_KEYS: (process.env.HUNT_CAMPAIGN_KEYS
    ? process.env.HUNT_CAMPAIGN_KEYS.split(',')
    : ['cv-2025-07-16', 'cta-2025-07-16']
  ).map((campaign) => campaign.trim()),
  DATADOG_LOGS_SESSION_SAMPLE_RATE: 100,
  PERF_SAMPLE_RATE: 100,
  LAUNCHDARKLY_CLIENT_SIDE_ID: '6a155e4748c03f0a9f351d57',
  DOMAINS_SUGGESTIONS_TLDS_SET: 'test-tlds',
};

export default previewConfig;
