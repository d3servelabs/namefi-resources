import type { Config } from '../schema';

const stagingConfig: Config = {
  PORT: 3000,
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  TEMPORAL_API_URL: 'us-east-1.aws.api.temporal.io:7233',
  TEMPORAL_NAMESPACE: 'namefi-astra-dev.yz1vc',
  SMTP_PORT: 465,
  SMTP_SECURE: true,
  SMTP_HOST: 'email-smtp.us-east-1.amazonaws.com',
  APP_URL: 'astra.namefi.dev',
  ALLOWED_ORIGINS: [
    // any domain or subdomain for namefi.io namefi.dev namefi.run
    '^https://astra\\.namefi\\.(io|dev|run)$',
  ],
};

export default stagingConfig;
