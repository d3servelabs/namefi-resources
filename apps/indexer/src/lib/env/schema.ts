import { z } from 'zod';

const _baseSecretsSchema = z.object({
  DATABASE_URL: z.string().url(),
  ALCHEMY_API_KEY: z.string(),
  USE_WEBSOCKETS: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),
  PONDER_JWT_SECRET: z.string(),
  PONDER_COOKIE_SECRET: z.string(),
  SMTP_USERNAME: z.string(),
  SMTP_PASSWORD: z.string(),
  BASE_SCHEMA: z.string().optional().default('indexer'),
});

export const secretsSchema = _baseSecretsSchema
  .extend({
    DATABASE_OVERRIDE_URL: z.string().url().optional(),
  })
  .transform((secrets) => ({
    ...secrets,
    DATABASE_URL: secrets.DATABASE_OVERRIDE_URL || secrets.DATABASE_URL,
  }));

export type SecretsSchema = z.infer<typeof secretsSchema>;

export const configSchema = z.object({
  SMTP_PORT: z.number(),
  SMTP_HOST: z.string(),
  SMTP_SECURE: z.boolean(),
  MAGIC_LINK_BASE_URL: z
    .string()
    .url()
    .default(
      process.env.ENVIRONMENT === 'development'
        ? 'https://indexer.namefi.dev'
        : 'https://indexer.namefi.io',
    ),
});

export type ConfigInput = z.input<typeof configSchema>;
