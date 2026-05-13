import type { ConfigInput } from '../schema';
import { CHAINS } from '@namefi-astra/utils/chains';
import { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';

const productionConfig: ConfigInput = {
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'cm23ds44v09x0oyiqqa7blr8i',
  TEMPORAL_API_URL: 'us-east-1.aws.api.temporal.io:7233',
  TEMPORAL_NAMESPACE: 'namefi-astra-prod.yz1vc',
  SMTP_SECURE: true,
  SMTP_HOST: 'email-smtp.us-east-1.amazonaws.com',
  APP_URL: 'astra.namefi.io',
  MLS_PUBLIC_SALES_LISTINGS_URL:
    'https://outbound.labs.namefi.io/api/public/sales/listings',
  GA_MEASUREMENT_ID: 'G-S8GRYLE2XF',
  NAMEFI_FIRST_PARTY_HOSTNAMES: [
    'astra.namefi.io',
    'poweredby.namefi.io',
    'namefi.io',
  ],
  ALLOWED_CHAINS: {
    DNS_SERVING_ALLOWED_NFT_CHAINS: [
      CHAINS.mainnet.id,
      CHAINS.base.id,
      CHAINS.robinhoodTestnet.id,
    ],
    NFT_ALLOWED_CHAINS: [CHAINS.mainnet.id, CHAINS.base.id],
    NFSC_BALANCE_ALLOWED_CHAINS: [CHAINS.mainnet.id, CHAINS.base.id],
    BY_PARENT_DOMAIN: {
      '0x.city': {
        NFT_ALLOWED_CHAINS: [
          CHAINS.mainnet.id,
          CHAINS.base.id,
          CHAINS.robinhoodTestnet.id,
        ],
        NFSC_BALANCE_ALLOWED_CHAINS: [CHAINS.mainnet.id, CHAINS.base.id],
      },
    },
  },
  DEV_NFSC_ENABLED: false,
  DEV_NFSC_SIGNUP_MINT_AMOUNT: 0,
  DEV_NFSC_FAUCET_AMOUNT: 0,
  DEV_NFSC_FAUCET_COOLDOWN_HOURS: 6,
  MAX_AI_GENERATIONS_PER_USER_PER_MONTH: 25,
  AI_GENERATION_CREDIT_COSTS: {
    default: 1,
    logo: {
      default: 1,
      models: {
        'gpt-image-2': 2,
        'gemini-3-pro-image-preview': 2,
      },
    },
    marketing: {
      default: 1,
      models: {
        'gpt-image-2': 2,
        'gemini-3-pro-image-preview': 2,
      },
    },
    animation: {
      default: 3,
      models: {
        'veo-3.1-generate-preview': 8,
        'veo-3.1-fast-generate-preview': 4,
        'bytedance/seedance-2.0': 3,
        'bytedance/seedance-2.0-fast': 2,
        'bytedance/seedance-v1.0-pro': 3,
        'bytedance/seedance-v1.5-pro': 3,
      },
      modes: {
        'sheet-guided': {
          default: 7,
          models: {
            'bytedance/seedance-2.0': 7,
            'bytedance/seedance-2.0-fast': 6,
            'bytedance/seedance-v1.0-pro': 6,
            'bytedance/seedance-v1.5-pro': 6,
          },
        },
      },
    },
  },
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
  CENTRALNIC_KEY: Registrars.CentralNic,
  EMAIL_ANALYTICS_URL: 'https://api.namefi.dev/v1/email/analytics/open',
  EMAIL_DOMAIN_TRAFFIC_WEEKLY_THRESHOLD: 500,
  MPP_ENABLED: 'true',
  MPP_STRIPE_NETWORK_ID: 'internal',
  MPP_TEMPO_RECIPIENT: '0xEe15C2735eD48C80f50fe666b45fE9ec699daEE5',
  MPP_TEMPO_TESTNET: 'false',
  X402_ENABLED: 'true',
  X402_NETWORK: 'eip155:8453',
  X402_SIGNER_ADDRESS: '0xEe15C2735eD48C80f50fe666b45fE9ec699daEE5',
  X402_FACILITATOR_URL: 'https://api.cdp.coinbase.com/platform/v2/x402',
  // Listmonk email service
  LISTMONK_URL: 'https://marketing.namefi.io',
};

export default productionConfig;
