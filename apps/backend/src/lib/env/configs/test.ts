import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';

const testConfig: ConfigInput = {
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'test-privy-app-id',
  TEMPORAL_API_URL: 'http://test-temporal-api-url:7233',
  TEMPORAL_NAMESPACE: 'test-temporal-namespace',
  APP_URL: '',
  SMTP_HOST: '',
  SMTP_PORT: 25,
  SMTP_SECURE: false,
  ALLOWED_CHAINS: [chains.sepolia.id],
  EMAIL_ADDRESS_TO_OWNED_HOSTNAMES_MAP: {
    'test-0x-city-owner@d3serve.xyz': ['0x.city'],
  },
  DYNADOT_BASE_URL: 'https://dynadot.namefi.dev/api3.json',

  DNSSEC_DNSKEY_PUBLIC_RECORD:
    'example.com. 3600 IN DNSKEY 257 3 13 g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==',
  DNSSEC_DNSKEY_KEY_TAG: 22005,
};

export default testConfig;
