import type { Config } from '../schema';

const testConfig: Config = {
  PORT: 3000,
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'test-privy-app-id',
  TEMPORAL_API_URL: 'http://test-temporal-api-url:7233',
  TEMPORAL_NAMESPACE: 'test-temporal-namespace',
  APP_URL: '',
  SMTP_HOST: '',
  SMTP_PORT: 25,
  SMTP_SECURE: false,
  NAMEFI_FIRST_PARTY_ORIGINS: [],
  ADDITIONAL_POWERED_BY_NAMEFI_THIRD_PARTY_DOMAINS: [],
  ALLOW_HTTP: false,
};

export default testConfig;
