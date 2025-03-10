import { createRequire } from 'node:module';
import { config as loadBaseEnv } from 'dotenv';
import type { ZodSchema } from 'zod';
import { baseConfigSchema } from './schema';

loadBaseEnv({ override: true });

const require = createRequire(import.meta.url);

export interface LoadConfigOptions<T> {
  configPath: string;
  configSchema: ZodSchema<T>;
}

export const loadConfig = <T>(options: LoadConfigOptions<T>) => {
  const validatedBaseConfig = baseConfigSchema.parse(process.env);
  const { default: envConfig } = require(
    `${options.configPath}/${validatedBaseConfig.ENVIRONMENT}`,
  );
  return options.configSchema.parse(envConfig);
};

export interface LoadSecretsOptions<T> {
  secretsSchema: ZodSchema<T>;
}

export const loadSecrets = <T>(options: LoadSecretsOptions<T>) => {
  const validatedSecrets = options.secretsSchema.parse(process.env);
  return validatedSecrets;
};
