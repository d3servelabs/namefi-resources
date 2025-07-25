import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';

const developmentConfig: ConfigInput = {
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  TEMPORAL_API_URL: 'us-east-1.aws.api.temporal.io:7233',
  TEMPORAL_NAMESPACE: 'namefi-astra-dev.yz1vc',
  SMTP_PORT: 2025,
  SMTP_HOST: 'smtp.mail.namefi.dev',
  SMTP_SECURE: false,
  APP_URL: 'localhost:3001',
  NAMEFI_FIRST_PARTY_HOSTNAMES: ['astra.namefi.dev', 'poweredby.namefi.dev'],
  ADDITIONAL_HOSTNAME_MAP: {
    '0xcity.astra.namefi.dev': '0x.city',
    '0x.city.astra.namefi.dev': '0x.city',
    'taylorcv.astra.namefi.dev': 'taylor.cv',
    'taylor.cv.astra.namefi.dev': 'taylor.cv',
    'alicv.astra.namefi.dev': 'ali.cv',
    'ali.cv.astra.namefi.dev': 'ali.cv',
    'licv.astra.namefi.dev': 'li.cv',
    'li.cv.astra.namefi.dev': 'li.cv',
    'mullercv.astra.namefi.dev': 'muller.cv',
    'muller.cv.astra.namefi.dev': 'muller.cv',
    'kumarcv.astra.namefi.dev': 'kumar.cv',
    'kumar.cv.astra.namefi.dev': 'kumar.cv',
  },
  ALLOW_ALL_ORIGINS: true,
  ALLOWED_CHAINS: [chains.sepolia.id, chains.base.id, chains.mainnet.id],
  EMAIL_ADDRESS_TO_OWNED_HOSTNAMES_MAP: {
    'dev-team@d3serve.xyz': [
      '0x.city',
      'taylor.cv',
      'ali.cv',
      'li.cv',
      'muller.cv',
      'kumar.cv',
    ],
  },
  DNSSEC_DNSKEY_PUBLIC_RECORD:
    'example.com. 3600 IN DNSKEY 257 3 13 g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==',
  DNSSEC_DNSKEY_KEY_TAG: 22005,
  MAX_AI_GENERATIONS_PER_USER_PER_MONTH: 100,
};

export default developmentConfig;
