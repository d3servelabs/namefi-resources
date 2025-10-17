import { configSchema } from './schema';

const rawConfig = process.env.LOADED_CONFIG;

if (!rawConfig) {
  throw new Error(
    'LOADED_CONFIG is not defined. Ensure next.config.ts injects the serialized config.',
  );
}

export const config = configSchema.parse(JSON.parse(rawConfig));
