import { configSchema, secretsSchema } from './schema';
import { loadSecrets } from '@namefi-astra/env/client';

// TODO(Sami -> Sid): we have 2 configs being exported, one is here and the other is #lib/env/load.ts
export const config = configSchema.parse(
  JSON.parse(process.env.LOADED_CONFIG ?? '{}'),
);

export const secrets = loadSecrets({
  secretsSchema,
  secrets: JSON.parse(process.env.LOADED_SECRETS ?? '{}'),
});
