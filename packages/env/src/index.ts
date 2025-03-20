import { createRequire } from 'node:module';
import { config as loadBaseEnv } from 'dotenv';
import type { ZodSchema } from 'zod';
import { baseConfigSchema } from './schema';

const moduleRequire = createRequire(import.meta.url);

loadBaseEnv({ override: true });

export interface LoadConfigOptions<T> {
  configPath: string;
  configSchema: ZodSchema<T>;
}

// TODO(Sami -> Sid): config should be overridable by env vars, otherwise we would have to commit-push-build-deploy every time we want to change a config
export const loadConfig = <T>(options: LoadConfigOptions<T>) => {
  const validatedBaseConfig = baseConfigSchema.parse(process.env);
  const envConfigPath = `${options.configPath}/${validatedBaseConfig.ENVIRONMENT}`;
  let envConfig: unknown;
  try {
    ({ default: envConfig } = require(envConfigPath));
  } catch (_) {
    ({ default: envConfig } = moduleRequire(envConfigPath));
  }
  return options.configSchema.parse(envConfig);
};

export interface LoadSecretsOptions<T> {
  secretsSchema: ZodSchema<T>;
}

export const loadSecrets = <T>(options: LoadSecretsOptions<T>) => {
  const validatedSecrets = options.secretsSchema.parse(process.env);
  return validatedSecrets;
};
