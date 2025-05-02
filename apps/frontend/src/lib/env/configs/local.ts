import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';

const localConfig: ConfigInput = {
  BACKEND_URL: 'http://localhost:3000',
  GA_MEASUREMENT_ID: 'G-PHKF9PM32W',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  STRIPE_PUBLISHABLE_KEY:
    'pk_test_51Pqc6fP7AJmUlGkqATatN7ovwZrEo0WjmJTjryazMHsXRIzk1WrMQv1C0SQ8J4LrTnrc2O5P4XxnTmtSKIfdl2Ct00o9GOerUj',
  NAMEFI_FIRST_PARTY_HOSTNAMES: [
    'localhost',
    'namefi.localhost',
    'astra.localhost',
  ],
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES: ['0x.city', 'defi.build'],
  ADDITIONAL_HOSTNAME_MAP: {
    '0xcity.localhost': '0x.city',
    'defibuild.localhost': 'defi.build',
  },
  USER_CENTRICS_SETTINGS_ID: '5UJHpI8CWth59m',
  USER_CENTRICS_GOOGLE_ANALYTICS_SERVICE_ID: 'HkocEodjb7',
  ALLOWED_CHAINS: [chains.sepolia.id],
};

export default localConfig;
