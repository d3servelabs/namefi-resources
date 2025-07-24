import { loadSecrets } from '@namefi-astra/env';
import { configSchema, secretsSchema } from './schema';
import developmentConfig from './configs/development';
import localConfig from './configs/local';
import productionConfig from './configs/production';
import testConfig from './configs/test';

const ENVIRONMENT = process.env.ENVIRONMENT || 'production';
console.log('ENVIRONMENT', ENVIRONMENT);
export const config = configSchema.parse(
  {
    development: developmentConfig,
    local: localConfig,
    production: productionConfig,
    test: testConfig,
  }[ENVIRONMENT],
);

export const secrets = loadSecrets({
  secretsSchema,
});
