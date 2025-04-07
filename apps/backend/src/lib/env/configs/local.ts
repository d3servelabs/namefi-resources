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
  ALLOWED_ORIGINS: ['^http://localhost:\\d{4,5}$'],
};

export default localConfig;
