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
  ALLOWED_ORIGINS: [],
};

export default testConfig;
