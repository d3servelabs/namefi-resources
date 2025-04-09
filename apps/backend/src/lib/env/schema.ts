import { z } from 'zod';

export const secretsSchema = z.object({
  DATABASE_URL: z.string().url(),
  PRIVY_APP_SECRET: z.string(),
  PRIVY_WEBHOOK_SECRET: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  TEMPORAL_API_KEY: z.string().optional(),
  API_AUTH_KEY: z.string(),
  ALCHEMY_API_KEY: z.string(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_USERNAME: z.string().optional(),
  GCP_HSM_KEYRING_RESOURCE_NAME: z.string().optional(),
  LOCAL_SIGNER_PRIVATE_KEY: z.string().optional(),
});

export type SecretsSchema = z.infer<typeof secretsSchema>;

export const configSchema = z.object({
  PORT: z.number().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']),
  PRIVY_APP_ID: z.string(),
  TEMPORAL_API_URL: z.string().url(),
  TEMPORAL_NAMESPACE: z.string(),
  SMTP_SECURE: z.boolean(),
  SMTP_PORT: z.number().optional().default(465),
  SMTP_HOST: z.string(),
  APP_URL: z.string(),
  /**
   * List of first-party domains that are owned by NameFI and allowed to interact with the API.
   */
  NAMEFI_FIRST_PARTY_ORIGINS: z.string().array().optional().default([]),
  ADDITIONAL_POWERED_BY_NAMEFI_THIRD_PARTY_DOMAINS: z
    .string()
    .array()
    .optional()
    .default([]),
  ALLOW_HTTP: z.boolean().optional().default(false),
});

export type Config = z.infer<typeof configSchema>;
