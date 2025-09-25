import { configSchema, clientSideEnvSchema } from './schema';
import { loadSecrets } from '@namefi-astra/env/client';

// TODO(Sami -> Sid): we have 2 configs being exported, one is here and the other is #lib/env/load.ts
export const config = configSchema.parse(
  JSON.parse(process.env.LOADED_CONFIG ?? '{}'),
);

export const clientSideEnv = loadSecrets({
  secretsSchema: clientSideEnvSchema,
  secrets: JSON.parse(process.env.LOADED_CLIENT_SIDE_ENV ?? '{}'),
});
