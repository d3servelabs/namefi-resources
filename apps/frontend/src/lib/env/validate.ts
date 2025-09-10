import '@namefi-astra/env/preload';
import path from 'node:path';
import { loadConfig, loadSecrets } from '@namefi-astra/env';
import { configSchema, secretsSchema } from './schema';

export const config = loadConfig({
  configPath: path.join(import.meta.dirname || __dirname, 'configs'),
  configSchema,
});

export const secrets = loadSecrets({
  secretsSchema,
});
