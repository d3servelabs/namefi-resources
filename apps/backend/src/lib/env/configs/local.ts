import type { Config } from '../schema';

const localConfig: Config = {
  PORT: 3000,
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  TEMPORAL_API_URL: 'localhost:7233',
  TEMPORAL_NAMESPACE: 'default',
  SMTP_PORT: 465,
  SMTP_HOST: 'localhost',
  SMTP_SECURE: false,
  APP_URL: 'localhost:3001',
  ALLOWED_ORIGINS: ['^http(s)?://.*\\.localhost:\\d{4,5}$'],
  /**
   * When testing with domains other than `localhost`, privy will fail because it will require https
   * to be able to test use `bun with-env dev -- --experimental-https` on the frontend
   */
  NAMEFI_FIRST_PARTY_ORIGINS: [
    'localhost',
    'namefi.localhost',
    'astra.localhost',
  ],
  ADDITIONAL_POWERED_BY_NAMEFI_THIRD_PARTY_DOMAINS: ['0xcity.localhost'],
};

export default localConfig;
