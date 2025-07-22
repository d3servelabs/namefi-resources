import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';

const productionConfig: ConfigInput = {
  TYPE: 'production',
  BACKEND_URL: 'https://backend.astra.namefi.io',
  FIRST_PARTY_DEPLOYMENT_URL: 'https://astra.namefi.io',
  GA_MEASUREMENT_ID: 'G-S8GRYLE2XF',
  PRIVY_APP_ID: 'cm23ds44v09x0oyiqqa7blr8i',
  STRIPE_PUBLISHABLE_KEY:
    'pk_live_51Pqc6fP7AJmUlGkq2dbLhK6JAASyzHwYSmlfdHYobkUlJiqeqAkuKykPEb0wTc57n7sqR2QJjI9TDz65Y7zn69I900f95GY1Al',
  NAMEFI_FIRST_PARTY_HOSTNAMES: ['astra.namefi.io'],
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES: ['0x.city', 'taylor.cv'],
  ADDITIONAL_HOSTNAME_MAP: {
    '0xcity.astra.namefi.io': '0x.city',
    'taylorcv.astra.namefi.io': 'taylor.cv',
  },
  USER_CENTRICS_SETTINGS_ID: '5UJHpI8CWth59m',
  USER_CENTRICS_GOOGLE_ANALYTICS_SERVICE_ID: 'HkocEodjb7',
  ALLOWED_CHAINS: [chains.mainnet.id, chains.base.id],
  HUNT_CAMPAIGN_KEYS: ['cv-2025-07-16', 'cta-2025-07-16'],
};

export default productionConfig;
