import type { ConfigInput } from '../schema';

const testConfig: ConfigInput = {
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'test-privy-app-id',
  TEMPORAL_API_URL: 'http://test-temporal-api-url:7233',
  TEMPORAL_NAMESPACE: 'test-temporal-namespace',
  APP_URL: '',
  SMTP_HOST: '',
  SMTP_PORT: 25,
  SMTP_SECURE: false,
};

export default testConfig;
