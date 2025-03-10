import { z } from 'zod';

export const secretsSchema = z.object({
  DATABASE_URL: z.string().url(),
});

export type SecretsSchema = z.infer<typeof secretsSchema>;

export const configSchema = z.object({
  PORT: z.number().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']),
});

export type Config = z.infer<typeof configSchema>;
