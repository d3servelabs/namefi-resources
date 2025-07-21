import { createRequire } from 'node:module';
import { config as loadBaseEnv } from 'dotenv';
import type { ZodSchema, ZodTypeDef } from 'zod';
import { baseConfigSchema } from './schema';

loadBaseEnv({ override: true });

export interface LoadConfigOptions<Output, Def extends ZodTypeDef, Input> {
  configPath: string;
  configSchema: ZodSchema<Output, Def, Input>;
}

// TODO(Sami -> Sid): config should be overridable by env vars, otherwise we would have to commit-push-build-deploy every time we want to change a config
export const loadConfig = <Output, Def extends ZodTypeDef, Input>(
  options: LoadConfigOptions<Output, Def, Input>,
) => {
  const validatedBaseConfig = baseConfigSchema.parse(process.env);
  const envConfigPath = `${options.configPath}/${validatedBaseConfig.ENVIRONMENT}`;
  let envConfig: unknown;
  console.log(envConfigPath);
  try {
    ({ default: envConfig } = require(envConfigPath));
  } catch (_) {
    const moduleRequire = createRequire(import.meta.url);
    ({ default: envConfig } = moduleRequire(envConfigPath));
  }
  return options.configSchema.parse(envConfig);
};

export { loadSecrets, type LoadSecretsOptions } from './client';
