import { loadSecrets } from '@namefi-astra/env';
import { configSchema, secretsSchema } from './schema';
import developmentConfig from './configs/development';
import localConfig from './configs/local';
import productionConfig from './configs/production';
import testConfig from './configs/test';

export const config = configSchema.parse(
  {
    development: developmentConfig,
    local: localConfig,
    production: productionConfig,
    test: testConfig,
  }[process.env.ENVIRONMENT || 'test'],
);

export const secrets = loadSecrets({
  secretsSchema,
});
