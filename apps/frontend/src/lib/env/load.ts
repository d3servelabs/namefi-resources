import path from 'node:path';
import { loadConfig } from '@namefi-astra/env';
import { configSchema } from './schema';

// TODO(Sami -> Sid): we have 2 configs being exported, one is here and the other is #lib/env/index.ts
export const config = loadConfig({
  configPath: path.join(__dirname, 'configs'),
  configSchema,
});
