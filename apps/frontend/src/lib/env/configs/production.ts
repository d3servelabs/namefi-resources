import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';

const productionConfig: ConfigInput = {
  TYPE: 'production',
  BACKEND_URL: 'https://api.astra.namefi.io',
  FIRST_PARTY_DEPLOYMENT_URL: 'https://astra.namefi.io',
  GA_MEASUREMENT_ID: 'G-S8GRYLE2XF',
  PRIVY_APP_ID: 'cm23ds44v09x0oyiqqa7blr8i',
  STRIPE_PUBLISHABLE_KEY:
    'pk_live_51Pqc6fP7AJmUlGkq2dbLhK6JAASyzHwYSmlfdHYobkUlJiqeqAkuKykPEb0wTc57n7sqR2QJjI9TDz65Y7zn69I900f95GY1Al',
  NAMEFI_FIRST_PARTY_HOSTNAMES: ['astra.namefi.io'],
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
  HUNT_CAMPAIGN_KEYS: ['cv-2025-07-16', 'cta-2025-07-16'],
};

export default productionConfig;
