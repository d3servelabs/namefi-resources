import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';
import { POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES } from '../consts';

type PreviewConfig = {
  [Key in keyof ConfigInput]: any;
};

const previewConfig: PreviewConfig = {
  TYPE: 'preview',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  RESOURCES_URL: process.env.RESOURCES_URL || 'https://localhost:3002',
  DOCS_URL: process.env.DOCS_URL || 'https://localhost:3003',
  FIRST_PARTY_DEPLOYMENT_URL:
    process.env.FIRST_PARTY_DEPLOYMENT_URL || 'http://localhost:5050',
  GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID || 'G-PHKF9PM32W',
  PRIVY_APP_ID: process.env.PRIVY_APP_ID || 'cm2lx4u5a03x3rtgp4keapmrb',
  STRIPE_PUBLISHABLE_KEY:
    process.env.STRIPE_PUBLISHABLE_KEY ||
    'pk_test_51Pqc6fP7AJmUlGkqATatN7ovwZrEo0WjmJTjryazMHsXRIzk1WrMQv1C0SQ8J4LrTnrc2O5P4XxnTmtSKIfdl2Ct00o9GOerUj',
  NAMEFI_FIRST_PARTY_HOSTNAMES: (process.env.NAMEFI_FIRST_PARTY_HOSTNAMES
    ? process.env.NAMEFI_FIRST_PARTY_HOSTNAMES.split(',')
    : ['localhost', 'namefi.localhost', 'astra.localhost']
  ).map((hostname) => hostname.trim()),
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES,
  ADDITIONAL_HOSTNAME_MAP: Object.fromEntries(
    POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES.flatMap((hostname) => [
      [`${hostname}.localhost`, hostname],
    ]),
  ),
  ALLOWED_CHAINS: (process.env.ALLOWED_CHAINS
    ? process.env.ALLOWED_CHAINS.split(',').map((value) => Number(value))
    : [chains.sepolia.id]
  ).filter((chainId) => !Number.isNaN(chainId)),
  HUNT_CAMPAIGN_KEYS: (process.env.HUNT_CAMPAIGN_KEYS
    ? process.env.HUNT_CAMPAIGN_KEYS.split(',')
    : ['cv-2025-07-16', 'cta-2025-07-16']
  ).map((campaign) => campaign.trim()),
};

export default previewConfig;
