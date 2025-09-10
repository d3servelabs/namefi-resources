import { createRequire } from 'node:module';
import { config as loadBaseEnv } from 'dotenv';
import type { ZodSchema, ZodTypeDef } from 'zod';
import { baseConfigSchema } from './schema';

loadBaseEnv({ override: true });

export interface LoadConfigOptions<Output, Def extends ZodTypeDef, Input> {
  configPath: string;
  configSchema: ZodSchema<Output, Def, Input>;
}

// config is part of the codebase itself, unlike environment variables
export const loadConfig = <Output, Def extends ZodTypeDef, Input>(
  options: LoadConfigOptions<Output, Def, Input>,
) => {
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
