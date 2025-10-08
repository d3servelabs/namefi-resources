import { createRequire } from 'node:module';
import { config as loadBaseEnv } from 'dotenv';
import type { z } from 'zod';
import { baseConfigSchema } from './schema';

loadBaseEnv({ override: true });

export interface LoadConfigOptions<Schema extends z.ZodTypeAny> {
  configPath: string;
  configSchema: Schema;
}

// config is part of the codebase itself, unlike environment variables
export const loadConfig = <Schema extends z.ZodTypeAny>(
  options: LoadConfigOptions<Schema>,
): z.output<Schema> => {
  const validatedBaseConfig = baseConfigSchema.parse(process.env);
  const envConfigPath = `${options.configPath}/${validatedBaseConfig.ENVIRONMENT}`;
  let envConfig: unknown;
  try {
    ({ default: envConfig } = require(envConfigPath));
  } catch (_) {
    const moduleRequire = createRequire(import.meta.url);
    ({ default: envConfig } = moduleRequire(envConfigPath));
  }
  return options.configSchema.parse(envConfig);
};

export { loadSecrets, type LoadSecretsOptions } from './client';
export {
  fetchAndMergeInfisicalSecrets,
  loadInfisicalSecretsIfConfigured,
} from './infisical';
