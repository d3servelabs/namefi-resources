import type { Config } from '../schema';

const developmentConfig: Config = {
  PORT: 3000,
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  TEMPORAL_API_URL: 'us-east-1.aws.api.temporal.io:7233',
  TEMPORAL_NAMESPACE: 'namefi-astra-dev.yz1vc',
  SMTP_PORT: 465,
  SMTP_HOST: 'localhost',
  SMTP_SECURE: false,
  APP_URL: 'localhost:3001',
  ALLOWED_ORIGINS: ['^https://astra\\.namefi\\.dev$'],
  NAMEFI_FIRST_PARTY_ORIGINS: ['astra.namefi.dev'],
  ADDITIONAL_POWERED_BY_NAMEFI_THIRD_PARTY_DOMAINS: ['0x.city'],
};

export default developmentConfig;
