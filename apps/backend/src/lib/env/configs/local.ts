import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';
import { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';

// Dynamic port support: use environment variables if set by dev runner
const backendPort = Number(process.env.PORT) || 3000;
const temporalServerPort = process.env.TEMPORAL_SERVER_PORT || '7233';
const temporalWorkerPort = process.env.TEMPORAL_WORKER_PORT || '3001';

const localConfig: ConfigInput = {
  PORT: backendPort,
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  TEMPORAL_API_URL:
    process.env.TEMPORAL_API_URL || `localhost:${temporalServerPort}`,
  TEMPORAL_NAMESPACE: 'default',
  TEMPORAL_WORKER_PORT: Number(temporalWorkerPort),
  SMTP_PORT: 2025,
  SMTP_HOST: 'smtp.mail.namefi.dev',
  SMTP_SECURE: false,
  APP_URL: 'localhost:3001',
  GA_MEASUREMENT_ID: 'G-PHKF9PM32W',
  /**
   * When testing with domains other than `localhost`, privy will fail because it will require https
   * to be able to test use `bun with-env dev -- --experimental-https` on the frontend
   */
  ALLOW_HTTP: true,
  NAMEFI_FIRST_PARTY_HOSTNAMES: [
    'localhost',
    'namefi.localhost',
    'astra.localhost',
  ],
  ALLOWED_CHAINS: [chains.sepolia.id],
  DEV_NFSC_ENABLED: true,
  DEV_NFSC_SIGNUP_MINT_AMOUNT: 100,
  DEV_NFSC_FAUCET_AMOUNT: 20,
  DEV_NFSC_FAUCET_COOLDOWN_HOURS: 6,
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
  ALLOW_ALL_ORIGINS: true,
  DYNADOT_BASE_URL: 'https://dynadot.namefi.dev/api3.json',

  DNSSEC_DNSKEY_PUBLIC_RECORD:
    'example.com. 3600 IN DNSKEY 257 3 13 g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==',
  DNSSEC_DNSKEY_KEY_TAG: 22005,
  MAX_AI_GENERATIONS_PER_USER_PER_MONTH: 200,
  AUTO_CREATE_TEMPORAL_SEARCH_ATTRIBUTES: true,
  REQUIRE_TEMPORAL_SEARCH_ATTRIBUTES_VALIDATION: false,

  BIGQUERY_AUDIT_SERVICE_NAMES: ['namefi-astra-api-local'],
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
};

export default localConfig;
