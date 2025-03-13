import { configSchema } from './schema';

export const config = configSchema.parse(
  JSON.parse(process.env.LOADED_CONFIG ?? '{}'),
);
