import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';

const localConfig: ConfigInput = {
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  TEMPORAL_API_URL: 'localhost:7233',
  TEMPORAL_NAMESPACE: 'default',
  TEMPORAL_WORKER_PORT: 3001,
  SMTP_PORT: 2025,
  SMTP_HOST: 'smtp.mail.namefi.dev',
  SMTP_SECURE: false,
  APP_URL: 'localhost:3001',
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
  ADDITIONAL_HOSTNAME_MAP: {
    '0x.city.localhost': '0x.city',
    'taylor.cv.localhost': 'taylor.cv',
    'ali.cv.localhost': 'ali.cv',
    'li.cv.localhost': 'li.cv',
    'muller.cv.localhost': 'muller.cv',
    'kumar.cv.localhost': 'kumar.cv',
    'victor.cv.localhost': 'victor.cv',
    'starts.today.localhost': 'starts.today',
    'ends.today.localhost': 'ends.today',
    'promos.today.localhost': 'promos.today',
    'available.today.localhost': 'available.today',
    'discounts.today.localhost': 'discounts.today',
  },
  ALLOWED_CHAINS: [chains.sepolia.id],
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
};

export default localConfig;
