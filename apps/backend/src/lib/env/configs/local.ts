import type { ConfigInput } from '../schema';

const localConfig: ConfigInput = {
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  TEMPORAL_API_URL: 'localhost:7233',
  TEMPORAL_NAMESPACE: 'default',
  SMTP_HOST: 'localhost',
  SMTP_SECURE: false,
  APP_URL: 'localhost:3001',
  /**
   * When testing with domains other than `localhost`, privy will fail because it will require https
   * to be able to test use `bun with-env dev -- --experimental-https` on the frontend
   */
  ALLOW_HTTP: true,
  NAMEFI_FIRST_PARTY_ORIGINS: [
    'localhost',
    'namefi.localhost',
    'astra.localhost',
  ],
  ADDITIONAL_POWERED_BY_NAMEFI_THIRD_PARTY_ORIGINS: [
    '0xcity.localhost',
    'defibuild.localhost',
  ],
};

export default localConfig;
