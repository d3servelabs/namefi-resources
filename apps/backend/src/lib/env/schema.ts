import { zJson } from '@namefi-astra/utils/zod-helpers';
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
  LOCAL_SIGNER_MNEMONIC: z.string().optional(),
  X_ALCHEMY_WEBHOOK_NFT_ACTIVITY_SIGNATURE: zJson
    .optional()
    .default('{}')
    .pipe(z.record(z.coerce.number(), z.string())),
});

export type SecretsSchema = z.infer<typeof secretsSchema>;

export const configSchema = z.object({
  PORT: z.number().default(3000),
  TEMPORAL_WORKER_PORT: z.number().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']),
  PRIVY_APP_ID: z.string(),
  TEMPORAL_API_URL: z.string().url(),
  TEMPORAL_NAMESPACE: z.string(),
  SMTP_SECURE: z.boolean(),
  SMTP_PORT: z.number().default(465),
  SMTP_HOST: z.string(),
  APP_URL: z.string(),
  /**
   * List of first-party domains that are owned by NameFI and allowed to interact with the API.
   */
  NAMEFI_FIRST_PARTY_HOSTNAMES: z.string().array().default([]),
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES: z.string().array().default([]),
  /**
   * Map of additional origins to their corresponding hostnames.
   * @example
   * {
   *   '0xcity.localhost': '0x.city',
   *   'defibuild.localhost': 'defi.build',
   * }
   */
  ADDITIONAL_HOSTNAME_MAP: z.record(z.string(), z.string()).default({}),
  ALLOW_HTTP: z.boolean().default(false),
  ALLOWED_CHAINS: z.number().array().default([]),
  /**
   * Maps email addresses to the hostnames they own.
   * Used to determine which parent domains a user owns based on their email.
   * @example
   * {
   *   'dev-team@d3serve.xyz': ['0x.city'],
   *   'another-owner@example.com': ['example.com', 'another-domain.com'],
   * }
   */
  EMAIL_ADDRESS_TO_OWNED_HOSTNAMES_MAP: z
    .record(z.string(), z.string().array())
    .default({}),
  /**
   * If true, all origins will be allowed.
   * This is useful for local development.
   */
  ALLOW_ALL_ORIGINS: z.boolean().default(false),

  /**
   * The token for the GitHub Actions workflow.
   */
  GITHUB_WORKFLOWS_TOKEN: z.string().optional(),
});

export type ConfigInput = z.input<typeof configSchema>;
