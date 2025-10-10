import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';

const developmentConfig: ConfigInput = {
  TYPE: 'development',
  BACKEND_URL: 'https://backend.astra.namefi.dev',
  FIRST_PARTY_DEPLOYMENT_URL: 'https://namefi.dev',
  GA_MEASUREMENT_ID: 'G-PHKF9PM32W',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  STRIPE_PUBLISHABLE_KEY:
    'pk_test_51Pqc6fP7AJmUlGkqATatN7ovwZrEo0WjmJTjryazMHsXRIzk1WrMQv1C0SQ8J4LrTnrc2O5P4XxnTmtSKIfdl2Ct00o9GOerUj',
  NAMEFI_FIRST_PARTY_HOSTNAMES: ['namefi.dev'],
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES: [
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
  ADDITIONAL_HOSTNAME_MAP: {
    '0x.city.astra.namefi.dev': '0x.city',
    'taylor.cv.astra.namefi.dev': 'taylor.cv',
    'ali.cv.astra.namefi.dev': 'ali.cv',
    'li.cv.astra.namefi.dev': 'li.cv',
    'muller.cv.astra.namefi.dev': 'muller.cv',
    'kumar.cv.astra.namefi.dev': 'kumar.cv',
    'victor.cv.astra.namefi.dev': 'victor.cv',
    'starts.today.astra.namefi.dev': 'starts.today',
    'ends.today.astra.namefi.dev': 'ends.today',
    'promos.today.astra.namefi.dev': 'promos.today',
    'available.today.astra.namefi.dev': 'available.today',
    'discounts.today.astra.namefi.dev': 'discounts.today',
  },
  ALLOWED_CHAINS: [chains.sepolia.id, chains.base.id, chains.mainnet.id],
  HUNT_CAMPAIGN_KEYS: ['cv-2025-07-16', 'cta-2025-07-16'],
};

export default developmentConfig;
