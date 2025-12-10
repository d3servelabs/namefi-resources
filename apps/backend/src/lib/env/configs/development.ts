import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';
import { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';

const developmentConfig: ConfigInput = {
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  TEMPORAL_API_URL: 'us-east-1.aws.api.temporal.io:7233',
  TEMPORAL_NAMESPACE: 'namefi-astra-dev.yz1vc',
  SMTP_PORT: 2025,
  SMTP_HOST: 'smtp.mail.namefi.dev',
  SMTP_SECURE: false,
  APP_URL: 'localhost:3001',
  NAMEFI_FIRST_PARTY_HOSTNAMES: [
    'astra.namefi.dev',
    'poweredby.namefi.dev',
    'namefi.dev',
  ],
  ALLOW_ALL_ORIGINS: false,
  ALLOWED_CHAINS: [chains.sepolia.id, chains.base.id],
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
  DNSSEC_DNSKEY_PUBLIC_RECORD:
    'example.com. 3600 IN DNSKEY 257 3 13 g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==',
  DNSSEC_DNSKEY_KEY_TAG: 22005,
  MAX_AI_GENERATIONS_PER_USER_PER_MONTH: 100,
  BIGQUERY_AUDIT_SERVICE_NAMES: ['namefi-astra-api-dev'],

  CENTRALNIC_KEY: Registrars.CentralNic_OTE_01,
};

export default developmentConfig;
