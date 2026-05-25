import { CHAINS as chains } from '@namefi-astra/utils/chains';
import type { ConfigInput } from '../schema';
import { POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES } from '../consts';

const productionConfig: ConfigInput = {
  TYPE: 'production',
  BACKEND_URL: process.env.BACKEND_URL || 'https://backend.astra.namefi.io',
  MLS_PUBLIC_SALES_LISTINGS_URL:
    'https://outbound.labs.namefi.io/api/public/sales/listings',
  RESOURCES_URL: 'https://r.namefi.io',
  DOCS_URL: 'https://docs.namefi.io',
  FIRST_PARTY_DEPLOYMENT_URL: 'https://namefi.io',
  GA_MEASUREMENT_ID: 'G-S8GRYLE2XF',
  PRIVY_APP_ID: 'cm23ds44v09x0oyiqqa7blr8i',
  STRIPE_PUBLISHABLE_KEY:
    'pk_live_51Pqc6fP7AJmUlGkq2dbLhK6JAASyzHwYSmlfdHYobkUlJiqeqAkuKykPEb0wTc57n7sqR2QJjI9TDz65Y7zn69I900f95GY1Al',
  NAMEFI_FIRST_PARTY_HOSTNAMES: ['namefi.io'],
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES,
  ADDITIONAL_HOSTNAME_MAP: Object.fromEntries(
    POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES.flatMap((hostname) => [
      [`${hostname}.poweredby.namefi.io`, hostname],
      [`${hostname}.astra.namefi.io`, hostname],
    ]),
  ),
  ALLOWED_CHAINS: [chains.mainnet.id, chains.base.id],
  HUNT_CAMPAIGN_KEYS: ['cv-2025-07-16', 'cta-2025-07-16'],
  DATADOG_LOGS_SESSION_SAMPLE_RATE: 100,
};

export default productionConfig;
