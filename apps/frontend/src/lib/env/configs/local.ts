import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';

const localConfig: ConfigInput = {
  TYPE: 'local',
  BACKEND_URL: 'http://localhost:3000',
  FIRST_PARTY_DEPLOYMENT_URL: 'https://localhost:5050',
  GA_MEASUREMENT_ID: 'G-PHKF9PM32W',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  STRIPE_PUBLISHABLE_KEY:
    'pk_test_51Pqc6fP7AJmUlGkqATatN7ovwZrEo0WjmJTjryazMHsXRIzk1WrMQv1C0SQ8J4LrTnrc2O5P4XxnTmtSKIfdl2Ct00o9GOerUj',
  NAMEFI_FIRST_PARTY_HOSTNAMES: [
    'localhost',
    'namefi.localhost',
    'astra.localhost',
  ],
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES: [
    '0x.city',
    'taylor.cv',
    'ali.cv',
    'li.cv',
    'muller.cv',
    'kumar.cv',
    'starts.today',
    'ends.today',
    'promos.today',
    'available.today',
    'discounts.today',
  ],
  ADDITIONAL_HOSTNAME_MAP: {
    '0x.city.localhost': '0x.city',
    'taylor.cv.localhost': 'taylor.cv',
    'ali.cv.localhost': 'ali.cv',
    'li.cv.localhost': 'li.cv',
    'muller.cv.localhost': 'muller.cv',
    'kumar.cv.localhost': 'kumar.cv',
    'starts.today.localhost': 'starts.today',
    'ends.today.localhost': 'ends.today',
    'promos.today.localhost': 'promos.today',
    'available.today.localhost': 'available.today',
    'discounts.today.localhost': 'discounts.today',
  },
  USER_CENTRICS_SETTINGS_ID: '5UJHpI8CWth59m',
  USER_CENTRICS_GOOGLE_ANALYTICS_SERVICE_ID: 'HkocEodjb7',
  ALLOWED_CHAINS: [chains.sepolia.id],
  HUNT_CAMPAIGN_KEYS: ['cv-2025-07-16', 'cta-2025-07-16'],
};

export default localConfig;
