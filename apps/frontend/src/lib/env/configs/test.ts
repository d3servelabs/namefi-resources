import { CHAINS as chains } from '@namefi-astra/utils/chains';
import type { ConfigInput } from '../schema';

const testConfig: ConfigInput = {
  TYPE: 'local',
  BACKEND_URL: 'http://localhost:3000',
  RESOURCES_URL: 'https://localhost:3002',
  DOCS_URL: 'https://docs.namefi.dev',
  FIRST_PARTY_DEPLOYMENT_URL: 'https://localhost:5050',
  GA_MEASUREMENT_ID: 'G-XXXXXXXXXX',
  PRIVY_APP_ID: 'XXXXXXXXXX',
  STRIPE_PUBLISHABLE_KEY:
    'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  NAMEFI_FIRST_PARTY_HOSTNAMES: [
    'localhost',
    'namefi.localhost',
    'astra.localhost',
  ],
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES: [],
  ADDITIONAL_HOSTNAME_MAP: {},
  ALLOWED_CHAINS: [chains.sepolia.id],
  HUNT_CAMPAIGN_KEYS: ['XXXXXXXXXX'],
  DATADOG_LOGS_SESSION_SAMPLE_RATE: 0,
  LAUNCHDARKLY_CLIENT_SIDE_ID: '6a155e4748c03f0a9f351d57',
};

export default testConfig;
