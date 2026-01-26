import { punycodeFqdnSchema } from '@namefi-astra/registrars/lib/data/validations';
import { zJson } from '@namefi-astra/utils/zod-helpers';
import { z } from 'zod';
import { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';

const numericStringKeySchema = z
  .string()
  .regex(/^-?\d+$/, {
    message: 'Record keys must be numeric strings',
  })
  .transform(Number);

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
  EMAIL_TRACKING_JWT_SECRET: z
    .string()
    .optional()
    .default('--dev-jwt-secret--'),
  GCP_HSM_KEYRING_RESOURCE_NAME: z.string().optional(),
  LOCAL_SIGNER_PRIVATE_KEY: z.string().optional(),
  LOCAL_SIGNER_MNEMONIC: z.string().optional(),
  X_ALCHEMY_WEBHOOK_NFT_ACTIVITY_SIGNATURE: zJson
    .optional()
    .default('{}')
    .pipe(z.record(numericStringKeySchema, z.string())),
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
  NAMEFI_ASSET_REPORT_SLACK_WEBHOOK_URL: z.string().optional(),

  // Google Analytics 4 configuration
  GA4_PROPERTY_ID: z.string().optional(),
  GA4_KEY_FILE_PATH: z.string().optional(),
  GA_MEASUREMENT_API_SECRET: z.string().optional(),

  // BigQuery configuration
  BIGQUERY_PROJECT_ID: z.string(),
  BIGQUERY_KEY_FILE_PATH: z.string(),

  // BigQuery Audit Logs configuration (defaults to BIGQUERY_* when not provided)
  BIGQUERY_AUDIT_DATASET_ID: z.string(),
  BIGQUERY_AUDIT_TABLE_ID: z.string(),

  VISION_API_KEY: z.string(),

  // Vercel API configuration
  VERCEL_API_TOKEN: z.string().optional(),
  VERCEL_TEAM_ID: z.string().optional(),

  // Google Cloud DNS configuration (uses existing Google credentials)
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  OPENSEA_API_KEY: z.string(),
  AVAILABILITY_API_AUTH_KEY: z.string(),
  PUBLIC_ROUTER_AUTH_KEY: z.string(),

  COOKIE_SECRET: z.string(),
  ALTCHA_HMAC_KEY: z.string(),
  PRIVY_SIGNATURE_VERIFICATION_KEY: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return null;
      return [
        '-----BEGIN PUBLIC KEY-----',
        val,
        '-----END PUBLIC KEY-----',
      ].join('\n');
    }),

  CENTRALNIC_CLID: z.string().optional(),
  CENTRALNIC_PASS: z.string().optional(),
  CENTRALNIC_HOST: z.string().optional(),

  // CentralNic OTE2 credentials (for admin testing)
  CENTRALNIC_OTE2_CLID: z.string().optional(),
  CENTRALNIC_OTE2_PASS: z.string().optional(),
  CENTRALNIC_OTE2_HOST: z.string().optional(),
  CENTRALNIC_OTE2_DEFAULT_REGISTRANT: z.string().optional(),

  EPP_AUTH_GEN_PRIVATE_KEY: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return null;
      return Buffer.from(val, 'base64').toString('utf-8');
    }),
  NAMEFI_ALERT_SLACK_WEBHOOK_URL: z.string().url().optional(),
  NAMEFI_COWBELL_SLACK_WEBHOOK_URL: z.string().url().optional(),
  DNS_CACHE_SERVERS_API_KEY: z.string().optional(),
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
  // Google Analytics 4 Measurement Protocol configuration
  GA_MEASUREMENT_ID: z.string().optional(),
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
    .default(() =>
      ['ns3.namefi.dev.', 'ns4.namefi.dev.'].map((value) =>
        punycodeFqdnSchema.parse(value),
      ),
    ),

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
  DEV_NFSC_ENABLED: z.boolean().default(false),
  DEV_NFSC_SIGNUP_MINT_AMOUNT: z.number().default(0),
  DEV_NFSC_FAUCET_AMOUNT: z.number().default(0),
  DEV_NFSC_FAUCET_COOLDOWN_HOURS: z.number().default(6),
  /**
   * Maximum number of AI generations allowed per user per month
   */
  MAX_AI_GENERATIONS_PER_USER_PER_MONTH: z.number().default(25),

  /**
   * Default Listmonk list ID for new subscribers
   */
  LISTMONK_NAMEFI_LIST_ID: z.number().default(3), // z.literal(3) causes ts issues
  /**
   * Newsletter list ID for opted-in users
   */
  LISTMONK_NEWSLETTER_LIST_ID: z.number().default(2),
  ADMIN_WALLET_ADDRESSES: z
    .string()
    .array()
    .default([
      '0x1b0f291c8fFebE891886351CDfF8A304a840C8Ad',
      '0xB5856d4598c919834913b8656ebc15a64d3C7836',
    ]),
  AUTO_CREATE_TEMPORAL_SEARCH_ATTRIBUTES: z.boolean().default(false),
  REQUIRE_TEMPORAL_SEARCH_ATTRIBUTES_VALIDATION: z.boolean().default(false),

  VISION_API_URL: z.string().url().default('https://api.vision.io'),

  VERCEL_TEAM_SLUG: z.string().default('d3servelabs'),
  VERCEL_PROJECT_SLUG: z.string().default('namefi-astra'),
  VERCEL_PROJECT_ID: z.string().default('prj_s5UsB8zN2BL3tRhGZfwSIUKvyGfV'),
  NAMEFI_IO_ZONE: z.string().default('namefi-io'),
  NAMEFI_DEV_ZONE: z.string().default('namefi-dev'),
  VERCEL_DEV_ENV_ID: z.string().default('env_zTZy6lGe9uNCkFYgd4FbfDETzoHO'),

  BIGQUERY_AUDIT_SERVICE_NAMES: z
    .string()
    .array()
    .optional()
    .describe('List of service names to filter audit logs by environment')
    .default([]),
  CENTRALNIC_KEY: z
    .enum([
      Registrars.CentralNic_OTE_01,
      Registrars.CentralNic_OTE_02,
      Registrars.CentralNic,
    ])
    .optional(),
  DNS_CACHE_SERVERS: z
    .array(
      z.object({
        name: z.string(),
        baseUrl: z.string().url(),
      }),
    )
    .default([]),
  ALLOW_LIVE_REGISTRARS: z.boolean().default(false),
  /**
   * User ID to use when skip_auth is enabled in local/development environments.
   * The backend will look up this user from the database.
   * Should be set for local/dev environments and left empty for production.
   */
  SKIP_AUTH_USER_ID: z.string().uuid().optional(),
});

export type ConfigInput = z.input<typeof configSchema>;
