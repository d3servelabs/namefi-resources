import { z } from 'zod';
import { CHAINS } from '@namefi-astra/utils/chains';
import { zJson } from '@namefi-astra/utils/zod-helpers';

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
  /**
   * API key for service-to-service authentication.
   * Used by backend services to sync data from the Ponder indexer.
   */
  PONDER_SERVICE_API_KEY: z.string().optional(),
  CHAINS_CONFIG: zJson.optional().pipe(
    z
      .record(
        z.coerce.number(),
        z.object({
          useWebsockets: z.boolean().optional().default(true),
          pollingIntervalMs: z
            .number()
            .optional()
            .default(60 * 1000),
        }),
      )
      .default({
        [CHAINS.mainnet.id]: {
          useWebsockets: true,
        },
        [CHAINS.base.id]: {
          useWebsockets: true,
        },
        [CHAINS.robinhoodTestnet.id]: {
          useWebsockets: true,
        },
        [CHAINS.sepolia.id]: {
          useWebsockets: false,
          pollingIntervalMs: 2 * 60 * 1000,
        },
      }),
  ),
});

export const secretsSchema = _baseSecretsSchema
  .extend({
    DATABASE_OVERRIDE_URL: z
      .string()
      .trim()
      .optional()
      .transform((data) => (data ? data : undefined)) // change falsy to undefined
      .pipe(z.string().url().optional()),
    SENTIO_API_KEY: z.string(),
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
