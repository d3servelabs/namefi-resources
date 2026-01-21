import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';
import { POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES } from '../consts';

const developmentConfig: ConfigInput = {
  TYPE: 'development',
  BACKEND_URL: 'https://backend.astra.namefi.dev',
  RESOURCES_URL: 'https://r.namefi.dev',
  DOCS_URL: 'https://docs.namefi.dev',
  FIRST_PARTY_DEPLOYMENT_URL: 'https://namefi.dev',
  GA_MEASUREMENT_ID: 'G-PHKF9PM32W',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  STRIPE_PUBLISHABLE_KEY:
    'pk_test_51Pqc6fP7AJmUlGkqATatN7ovwZrEo0WjmJTjryazMHsXRIzk1WrMQv1C0SQ8J4LrTnrc2O5P4XxnTmtSKIfdl2Ct00o9GOerUj',
  NAMEFI_FIRST_PARTY_HOSTNAMES: ['namefi.dev'],
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES,
  ADDITIONAL_HOSTNAME_MAP: Object.fromEntries(
    POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES.flatMap((hostname) => [
      [`${hostname}.poweredby.namefi.dev`, hostname],
      [`${hostname}.astra.namefi.dev`, hostname],
    ]),
  ),
  ALLOWED_CHAINS: [chains.sepolia.id, chains.base.id, chains.mainnet.id],
  HUNT_CAMPAIGN_KEYS: ['cv-2025-07-16', 'cta-2025-07-16'],
};

export default developmentConfig;
