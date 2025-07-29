import { punycodeFqdnSchema } from '@namefi-astra/registrars/lib/data/validations';
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
  /**
   * The token for the GitHub Actions workflow.
   */
  GITHUB_WORKFLOWS_TOKEN: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  WHOIS_API_KEY: z.string(),
  DYNADOT_GDG_API_KEY: z.string(),
  DYNADOT_REGULAR_API_KEY: z.string(),
  DYNADOT_PRIVATE_KEY: z.string().optional(),
  DYNADOT_ACCOUNT_ID: z.string().optional(),
  DEFAULT_EPP_CODE_ENCRYPTION_KEY_ID: z.string(),
  LEGACY_DB_URL: z.string(),
  // redis connection for rate limiting
  LIMITER_REDIS_PASSWORD: z.string().optional(),
  LIMITER_REDIS_USER: z.string().optional(),
  LIMITER_REDIS_HOST: z.string().optional(),
  LIMITER_REDIS_PORT: z.number().optional().default(6379),

  // Listmonk configuration
  LISTMONK_BASE_URL: z.string(),
  LISTMONK_USERNAME: z.string(),
  LISTMONK_PASSWORD: z.string(),
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
   * The nameservers that NameFI will use for its own domains.
   */
  NAMEFI_ASTRA_NAMESERVERS: punycodeFqdnSchema
    .array()
    .default(['ns3.namefi.dev.', 'ns4.namefi.dev.']),

  AWS_REGION: z.string().default('us-east-1'),
  DYNADOT_BASE_URL: z.string().optional(),
  DNSSEC_DNSKEY_PUBLIC_RECORD: z.string(),
  DNSSEC_DNSKEY_KEY_TAG: z.number(),

  STORAGE_BUCKET: z.string().default('namefi-astra-dev'),
  CLOUD_FRONT_DOMAIN: z.string().default('d3pajj40uywidf.cloudfront.net'),
  AI_BUCKET_FOLDERS: z
    .object({
      LOGOS: z.string(),
      SOCIAL: z.string(),
    })
    .default({
      LOGOS: 'ai-logos',
      SOCIAL: 'ai-social',
    }),
  DISALLOW_LIVE_PAYMENT_METHODS: z.boolean().optional().default(false),
  /**
   * Maximum number of AI generations allowed per user per month
   */
  MAX_AI_GENERATIONS_PER_USER_PER_MONTH: z.number().default(25),

  /**
   * Default Listmonk list ID for new subscribers
   */
  LISTMONK_NAMEFI_LIST_ID: z.number().default(3), // z.literal(3) causes ts issues
  ADMIN_WALLET_ADDRESSES: z
    .string()
    .array()
    .default([
      '0x1b0f291c8fFebE891886351CDfF8A304a840C8Ad',
      '0xB5856d4598c919834913b8656ebc15a64d3C7836',
    ]),
});

export type ConfigInput = z.input<typeof configSchema>;
