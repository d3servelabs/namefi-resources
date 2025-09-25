import '@namefi-astra/env/preload';
import path from 'node:path';
import { loadConfig } from '@namefi-astra/env';
import { configSchema } from './schema';

export const config = loadConfig({
  configPath: path.join(import.meta.dirname || __dirname, 'configs'),
  configSchema,
});
