import { configSchema } from './schema';

// TODO(Sami -> Sid): we have 2 configs being exported, one is here and the other is #lib/env/load.ts
export const config = configSchema.parse(
  JSON.parse(process.env.LOADED_CONFIG ?? '{}'),
);
