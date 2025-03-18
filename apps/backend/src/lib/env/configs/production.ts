import type { Config } from '../schema';

const developmentConfig: Config = {
  PORT: 3000,
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  TEMPORAL_API_URL: 'https://api.temporal.io',
  TEMPORAL_NAMESPACE: 'default',
};

export default developmentConfig;
