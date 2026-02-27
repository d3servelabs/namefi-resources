import type { ConfigInput } from '../schema';
import { base, mainnet } from 'viem/chains';

const productionConfig: ConfigInput = {
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'cm23ds44v09x0oyiqqa7blr8i',
  TEMPORAL_API_URL: 'us-east-1.aws.api.temporal.io:7233',
  TEMPORAL_NAMESPACE: 'namefi-astra-prod.yz1vc',
  SMTP_SECURE: true,
  SMTP_HOST: 'email-smtp.us-east-1.amazonaws.com',
  APP_URL: 'astra.namefi.io',
  GA_MEASUREMENT_ID: 'G-S8GRYLE2XF',
  NAMEFI_FIRST_PARTY_HOSTNAMES: [
    'astra.namefi.io',
    'poweredby.namefi.io',
    'namefi.io',
  ],
  ALLOWED_CHAINS: [mainnet.id, base.id],
  DEV_NFSC_ENABLED: false,
  DEV_NFSC_SIGNUP_MINT_AMOUNT: 0,
  DEV_NFSC_FAUCET_AMOUNT: 0,
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
  NAMEFI_ASTRA_NAMESERVERS: ['ns3.namefi.io.', 'ns4.namefi.io.'],

  DNSSEC_DNSKEY_PUBLIC_RECORD:
    '0x.city. 86400 IN DNSKEY 257 3 13 rsA8XQ32zr8KIj9iZc8uYvuh9+dozZi581+FiQQoCPw+WnAWumIbXqaOoWWgFQAetARJGTheCAAF4EIb/w6WMA==',
  DNSSEC_DNSKEY_KEY_TAG: 43974,

  STORAGE_BUCKET: 'namefi-astra-prod',
  CLOUD_FRONT_DOMAIN: 'd37hwq656n7huw.cloudfront.net',
  BIGQUERY_AUDIT_SERVICE_NAMES: ['namefi-astra-api-prod'],
  DNS_CACHE_SERVERS: [
    {
      name: 'NS3',
      baseUrl: 'http://ns3.namefi.io:8181',
    },
    {
      name: 'NS4',
      baseUrl: 'http://ns4.namefi.io:8181',
    },
  ],
  ALLOW_LIVE_REGISTRARS: true,
  CENTRALNIC_BALANCE_ENDPOINT:
    'https://registrar-console.centralnic.com/json/balance',
  EMAIL_ANALYTICS_URL: 'https://backend.astra.namefi.io/v1/email/track/open',
  EMAIL_DOMAIN_TRAFFIC_WEEKLY_THRESHOLD: 500,
};

export default productionConfig;
