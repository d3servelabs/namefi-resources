import { z } from 'zod';

export const envSchema = {
  ENVIRONMENT: z.enum(['development', 'staging', 'production']),
  DATABASE_URL: z.string().url(),
  DYNADOT_API_KEY: z.string(),
} as const;

const zodEnvSchema = z.object(envSchema);

export type Env = z.infer<typeof zodEnvSchema>;

export const configSchema = {
  PORT: z.number().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']),
} as const;

const zodConfigSchema = z.object(configSchema);

export type Config = z.infer<typeof zodConfigSchema>;
