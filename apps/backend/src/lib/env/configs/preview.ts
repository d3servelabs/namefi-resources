import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';
import { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';

type PreviewConfig = {
  [Key in keyof ConfigInput]: any;
};

/**
 * Configurable from env with defaults, needed for preview deployments
 */
const previewConfig: PreviewConfig = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  PRIVY_APP_ID: process.env.PRIVY_APP_ID || 'cm2lx4u5a03x3rtgp4keapmrb',
  TEMPORAL_API_URL: process.env.TEMPORAL_API_URL || 'temporal:7233',
  TEMPORAL_NAMESPACE: process.env.TEMPORAL_NAMESPACE || 'default',
  TEMPORAL_WORKER_PORT: process.env.TEMPORAL_WORKER_PORT
    ? Number(process.env.TEMPORAL_WORKER_PORT)
    : 3001,
  SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 2025,
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.mail.namefi.dev',
  SMTP_SECURE: process.env.SMTP_SECURE?.toLowerCase() === 'true',
  APP_URL: process.env.APP_URL || 'localhost:3001',
  GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID || 'G-PHKF9PM32W',
  ALLOW_HTTP: process.env.ALLOW_HTTP?.toLowerCase() === 'true',
  NAMEFI_FIRST_PARTY_HOSTNAMES: (process.env.NAMEFI_FIRST_PARTY_HOSTNAMES
    ? process.env.NAMEFI_FIRST_PARTY_HOSTNAMES.split(',')
    : ['localhost', 'namefi.localhost', 'astra.localhost']
  ).map((hostname) => hostname.trim()),
  ALLOWED_CHAINS: (process.env.ALLOWED_CHAINS
    ? process.env.ALLOWED_CHAINS.split(',').map((value) => Number(value))
    : [chains.sepolia.id]
  ).filter((chainId) => !Number.isNaN(chainId)),
  DEV_NFSC_ENABLED: process.env.DEV_NFSC_ENABLED
    ? process.env.DEV_NFSC_ENABLED.toLowerCase() === 'true'
    : true,
  DEV_NFSC_SIGNUP_MINT_AMOUNT: process.env.DEV_NFSC_SIGNUP_MINT_AMOUNT
    ? Number(process.env.DEV_NFSC_SIGNUP_MINT_AMOUNT)
    : 100,
  DEV_NFSC_FAUCET_AMOUNT: process.env.DEV_NFSC_FAUCET_AMOUNT
    ? Number(process.env.DEV_NFSC_FAUCET_AMOUNT)
    : 20,
  DEV_NFSC_FAUCET_COOLDOWN_HOURS: process.env.DEV_NFSC_FAUCET_COOLDOWN_HOURS
    ? Number(process.env.DEV_NFSC_FAUCET_COOLDOWN_HOURS)
    : 6,
  EMAIL_DOMAIN_TRAFFIC_WEEKLY_THRESHOLD: process.env
    .EMAIL_DOMAIN_TRAFFIC_WEEKLY_THRESHOLD
    ? Number(process.env.EMAIL_DOMAIN_TRAFFIC_WEEKLY_THRESHOLD)
    : 100,
  EMAIL_DREAM_DOMAIN_AWAITS_ORDER_LOOKBACK_DAYS: process.env
    .EMAIL_DREAM_DOMAIN_AWAITS_ORDER_LOOKBACK_DAYS
    ? Number(process.env.EMAIL_DREAM_DOMAIN_AWAITS_ORDER_LOOKBACK_DAYS)
    : 14,

  EMAIL_ADDRESS_TO_OWNED_HOSTNAMES_MAP: {
    'dev-team@d3serve.xyz': [
      '0x.city',
      'taylor.cv',
      'ali.cv',
      'li.cv',
      'muller.cv',
      'kumar.cv',
      'victor.cv',
      'starts.today',
      'ends.today',
      'promos.today',
      'available.today',
      'discounts.today',
    ],
  },
  ALLOW_ALL_ORIGINS: process.env.ALLOW_ALL_ORIGINS
    ? process.env.ALLOW_ALL_ORIGINS?.toLowerCase() === 'true'
    : true,
  DYNADOT_BASE_URL:
    process.env.DYNADOT_BASE_URL || 'https://dynadot.namefi.dev/api3.json',

  DNSSEC_DNSKEY_PUBLIC_RECORD:
    'example.com. 3600 IN DNSKEY 257 3 13 g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==',
  DNSSEC_DNSKEY_KEY_TAG: 22005,
  MAX_AI_GENERATIONS_PER_USER_PER_MONTH: 200,
  AUTO_CREATE_TEMPORAL_SEARCH_ATTRIBUTES: true,
  REQUIRE_TEMPORAL_SEARCH_ATTRIBUTES_VALIDATION: false,

  BIGQUERY_AUDIT_SERVICE_NAMES: ['namefi-astra-api-preview'],
  CENTRALNIC_KEY: Registrars.CentralNic_OTE_01,
  DNS_CACHE_SERVERS: [
    {
      name: 'NS3',
      baseUrl: 'http://ns3.namefi.dev:8181',
    },
    {
      name: 'NS4',
      baseUrl: 'http://ns4.namefi.dev:8181',
    },
  ],
  SKIP_AUTH_USER_ID: '202832e8-304f-4f4a-81c9-df32fd1e5364',
};

export default previewConfig;
