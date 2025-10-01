import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';

const productionConfig: ConfigInput = {
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'cm23ds44v09x0oyiqqa7blr8i',
  TEMPORAL_API_URL: 'us-east-1.aws.api.temporal.io:7233',
  TEMPORAL_NAMESPACE: 'namefi-astra-prod.yz1vc',
  SMTP_SECURE: true,
  SMTP_HOST: 'email-smtp.us-east-1.amazonaws.com',
  APP_URL: 'astra.namefi.io',
  NAMEFI_FIRST_PARTY_HOSTNAMES: ['astra.namefi.io', 'poweredby.namefi.io'],
  ADDITIONAL_HOSTNAME_MAP: {
    '0x.city.astra.namefi.io': '0x.city',
    'taylor.cv.astra.namefi.io': 'taylor.cv',
    'ali.cv.astra.namefi.io': 'ali.cv',
    'li.cv.astra.namefi.io': 'li.cv',
    'muller.cv.astra.namefi.io': 'muller.cv',
    'kumar.cv.astra.namefi.io': 'kumar.cv',
    'victor.cv.astra.namefi.io': 'victor.cv',
    'starts.today.astra.namefi.io': 'starts.today',
    'ends.today.astra.namefi.io': 'ends.today',
    'promos.today.astra.namefi.io': 'promos.today',
    'available.today.astra.namefi.io': 'available.today',
    'discounts.today.astra.namefi.io': 'discounts.today',
  },
  ALLOWED_CHAINS: [chains.mainnet.id, chains.base.id],
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
};

export default productionConfig;
