import {
  aiGenerationCreditCostsSchema,
  aiTokenCreditRatesSchema,
  defaultAiGenerationCreditCosts,
  defaultAiTokenCreditRates,
} from '@namefi-astra/common/ai-generation-credits';
import {
  dnsConfigSchema,
  dnsSecretsSchema,
  refineParkGateTtls,
} from '@namefi-astra/dns-service/lib/env/dns-config-schema';
import { ALLOWED_CHAINS_SCHEMA } from '@namefi-astra/utils/allowed-chains';
import { zJson } from '@namefi-astra/utils/zod-helpers';
import { z } from 'zod';
import { Registrars } from '@namefi-astra/registrars/registrars-keys';

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
  API_AUTH_JWT_SECRET: z.string().optional(),
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
  NAMEFI_FEED_X_BEARER_TOKEN: z.string().optional(),
  SLACK_BOT_TOKEN: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  DISCORD_BOT_TOKEN: z.string().optional(),

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
  GA4_DNS_PROPERTY_ID: z.string().optional(),
  GA4_APP_PROPERTY_ID: z.string().optional(),
  GA4_KEY_FILE_PATH: z.string().optional(),
  GA_MEASUREMENT_API_SECRET: z.string().optional(),

  // BigQuery configuration
  BIGQUERY_PROJECT_ID: z.string(),
  BIGQUERY_KEY_FILE_PATH: z.string(),

  // BigQuery Audit Logs configuration (defaults to BIGQUERY_* when not provided)
  BIGQUERY_AUDIT_DATASET_ID: z.string(),
  BIGQUERY_AUDIT_TABLE_ID: z.string(),
  BIGQUERY_AUDIT_USE_TABLE_SUFFIX: z.stringbool().optional().default(false),

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

  CENTRALNIC_DEFAULT_REGISTRANT: z.string().optional(),
  X402_FACILITATOR_KEY: z
    .enum(['CDP', 'ONESHOT', 'TESTING'])
    .optional()
    .default('TESTING'),
  // x402 Protocol Configuration (for CDP facilitator in production)
  CDP_API_KEY_ID: z.string().optional(),
  CDP_API_KEY_SECRET: z.string().optional(),
  // x402 Protocol Configuration (for ONESHOT facilitator in production)
  ONESHOT_API_KEY: z.string().optional(),
  ONESHOT_API_KEY_SECRET: z.string().optional(),
  /**
   * Private key for signing x402 refund transactions (USDC transfers)
   * The same wallet that receives x402 payments signs refunds
   */
  X402_SIGNER_GCP_HSM_KEYRING_RESOURCE_NAME: z.string().optional(),
  X402_SIGNER_PRIVATE_KEY: z.string().optional(),
  X402_SIGNER_MNEMONIC: z.string().optional(),
  X402_PAYMENT_PAYLOAD_ENCRYPTION_PRIVATE_KEY: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return null;
      return Buffer.from(val, 'base64').toString('utf-8');
    }),

  EPP_AUTH_GEN_PRIVATE_KEY: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return null;
      return Buffer.from(val, 'base64').toString('utf-8');
    }),
  NAMEFI_ALERT_SLACK_WEBHOOK_URL: z.string().url().optional(),
  NAMEFI_API_HTTP_ALERT_SLACK_WEBHOOK_URL: z.string().url().optional(),
  NAMEFI_JUSTAING_ALERT_SLACK_WEBHOOK_URL: z.string().url().optional(),
  NAMEFI_COWBELL_SLACK_WEBHOOK_URL: z.string().url().optional(),
  DNS_CACHE_SERVERS_API_KEY: z.string().optional(),

  // ClickUp API for incident ticket creation
  CLICKUP_API_TOKEN: z.string().optional(),
  CLICKUP_INCIDENT_LIST_ID: z.string().optional(),

  // Ponder indexer API key for service-to-service sync
  PONDER_INDEXER_API_KEY: z.string().optional(),
  MAIN_REDIS_URL: z.string().url().optional(),

  // NFT marketplace proxy credentials. The frontend OKX adapters
  // cannot hold these — OKX HMAC-signs every request with the secret
  // — so the calls are
  // proxied through `nftMarketplacesRouter`. Optional: when unset the proxy
  // procedures fail with a configuration error and the marketplace panel
  // degrades to the client-side OpenSea / Rarible adapters.
  OKX_API_KEY: z.string().optional(),
  OKX_API_SECRET: z.string().optional(),
  OKX_API_PASSPHRASE: z.string().optional(),
  LOOKSRARE_API_KEY: z.string().optional(),
  /**
   * JWT secret for x402 access tokens
   * Used to sign tokens that allow re-access to paid resources
   * Falls back to API_AUTH_KEY if not set
   */
  X402_JWT_SECRET: z.string().optional(),

  // Caddy DNS-JWT park-gate signing key, owned by @namefi-astra/dns-service.
  ...dnsSecretsSchema.shape,
});

export type SecretsSchema = z.infer<typeof secretsSchema>;

const temporalApiUrlSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => {
    if (/^[a-z][a-z\d+.-]*:\/\//i.test(value)) {
      return new URL(value).host;
    }

    return value;
  });

export const configSchema = z
  .object({
    PORT: z.number().default(3000),
    TEMPORAL_WORKER_PORT: z.number().default(3000),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']),
    PRIVY_APP_ID: z.string().min(1, 'PRIVY_APP_ID is required'),
    TEMPORAL_API_URL: temporalApiUrlSchema,
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
    ALLOWED_CHAINS: ALLOWED_CHAINS_SCHEMA,
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
    API_AUTH_JWT_TTL_SECONDS: z
      .number()
      .int()
      .positive()
      .default(60 * 60 * 12),
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
        ANIMATIONS: z.string(),
      })
      .default({
        LOGOS: 'ai-logos',
        SOCIAL: 'ai-social',
        ANIMATIONS: 'ai-animations',
      }),
    DISALLOW_LIVE_PAYMENT_METHODS: z.boolean().optional().default(false),
    DEV_NFSC_ENABLED: z.boolean().default(false),
    DEV_NFSC_SIGNUP_MINT_AMOUNT: z.number().default(0),
    DEV_NFSC_FAUCET_AMOUNT: z.number().default(0),
    DEV_NFSC_FAUCET_COOLDOWN_HOURS: z.number().default(6),
    /**
     * Maximum weighted AI generation credits allowed per user per month.
     * Production uses 25 credits, which backs into a $5 planning budget at
     * $0.20 per credit.
     */
    MAX_AI_GENERATIONS_PER_USER_PER_MONTH: z.number().default(25),
    /**
     * Credit costs by generation type, mode, and primary model. Unknown models
     * fall back to the type default, then the global default.
     */
    AI_GENERATION_CREDIT_COSTS: aiGenerationCreditCostsSchema.default(
      defaultAiGenerationCreditCosts,
    ),
    /**
     * Token-backed credit rates by model. These let variable-cost workflows
     * such as leadgen back-calculate credits from persisted input/output usage.
     */
    AI_TOKEN_CREDIT_RATES: aiTokenCreditRatesSchema.default(
      defaultAiTokenCreditRates,
    ),

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
    RDAP_ENABLE_DUMMY_OBJECTS: z.boolean().default(true),
    /**
     * Optional override for the upstream RDAP endpoint used by
     * `@namefi-astra/registrars/rdap-whois/rdap_client`. When unset, the
     * client falls back to its built-in default (`https://rdap.org`).
     * Useful for dev/test pointing at a local mock server.
     */
    RDAP_BASE_URL: z.string().url().optional(),
    /**
     * Optional override for the upstream WHOIS JSON API endpoint used by
     * `@namefi-astra/registrars/rdap-whois/whois_client`. When unset, the
     * client falls back to its built-in default (`https://whoisjsonapi.com/v1`).
     * Useful for dev/test pointing at a local mock server.
     */
    WHOIS_BASE_URL: z.string().url().optional(),
    DNS_CACHE_SERVERS: z
      .array(
        z.object({
          name: z.string(),
          baseUrl: z.string().url(),
        }),
      )
      .default([]),
    ALLOW_LIVE_REGISTRARS: z.boolean().default(false),
    CENTRALNIC_BALANCE_ENDPOINT: z.string().url().optional(),
    /**
     * User ID to use when skip_auth is enabled in local/development environments.
     * The backend will look up this user from the database.
     * Should be set for local/dev environments and left empty for production.
     */
    SKIP_AUTH_USER_ID: z.string().uuid().optional(),
    USE_NEW_EPP_WORKFLOW: z
      .string()
      .default(process.env.USE_NEW_EPP_WORKFLOW ?? 'false')
      .pipe(z.stringbool()),
    EMAIL_ANALYTICS_URL: z.url().optional(),
    EMAIL_CART_DOMAINS_POPULAR_ITEM_MIN_AGE_DAYS: z
      .number()
      .positive()
      .default(1),
    EMAIL_DOMAIN_TRAFFIC_WEEKLY_THRESHOLD: z.number().default(1000),
    EMAIL_DREAM_DOMAIN_AWAITS_ORDER_LOOKBACK_DAYS: z
      .number()
      .positive()
      .default(90),
    ALLOW_LOGIN_NOTIFICATIONS: z
      .boolean()
      .default(
        z.stringbool().safeParse(process.env.ALLOW_LOGIN_NOTIFICATIONS).data ??
          true,
      ),
    /**
     * Gate for displaying the resolved `loginMethod` in user-visible
     * surfaces (login-notification email + admin login-history page +
     * profile Security card). The DB column keeps storing whatever
     * `detectLoginMethod` resolves; this flag only controls the *render*.
     *
     * Default false: `detectLoginMethod` is heuristic (it walks Privy
     * `linkedAccounts` types) and the team can't actually verify which
     * method a user authenticated with, so showing it misleads more than
     * it informs. Flip to true (`SHOW_LOGIN_METHOD=true`) once the
     * detection is reliable enough to surface.
     */
    SHOW_LOGIN_METHOD: z
      .boolean()
      .default(
        z.stringbool().safeParse(process.env.SHOW_LOGIN_METHOD).data ?? false,
      ),

    /**
     * URL of the Ponder indexer to sync from.
     * When set, enables syncing on-chain data from a remote Ponder indexer
     * instead of running a local Ponder instance.
     */
    PONDER_INDEXER_URL: z.string().url().optional(),
    MPP_ENABLED: z.stringbool().default(true),
    MPP_STRIPE_NETWORK_ID: z.string().default('internal'),
    MPP_TEMPO_CURRENCY: z
      .string()
      .default('0x20c0000000000000000000000000000000000000'),
    MPP_TEMPO_RECIPIENT: z.string().optional(),
    MPP_TEMPO_TESTNET: z.stringbool().default(true),
    // x402 Protocol Configuration
    /**
     * Enable/disable x402 payment protocol
     */
    X402_ENABLED: z.stringbool().default(true),
    /**
     * Network for x402 payments in CAIP-2 format
     * - Base Mainnet: eip155:8453
     * - Base Sepolia: eip155:84532
     */
    X402_NETWORK: z
      .enum(['eip155:8453', 'eip155:84532'])
      .default('eip155:84532'),
    /**
     * Wallet address that signs x402 payments (receives USDC and signs refunds)
     */
    X402_SIGNER_ADDRESS: z.string().optional(),
    /**
     * x402 facilitator URL
     * - Testnet: https://x402.org/facilitator
     * - Production (CDP): https://api.cdp.coinbase.com/platform/v2/x402
     */
    X402_FACILITATOR_URL: z
      .string()
      .url()
      .default('https://x402.org/facilitator'),
    /**
     * WalletConnect project ID for x402 paywall
     * If not set, WalletConnect option will be hidden in the paywall UI
     */
    X402_WALLETCONNECT_PROJECT_ID: z.string().optional(),
    /**
     * Default chain ID for minting NFTs from x402 purchases
     * Maps payment network to NFT chain:
     * - Base Sepolia (84532) payment -> Sepolia (11155111) NFT
     * - Base Mainnet (8453) payment -> Base (8453) NFT
     * If not set, defaults based on X402_NETWORK:
     * - eip155:84532 -> 11155111 (Sepolia)
     * - eip155:8453 -> 8453 (Base)
     */
    X402_DEFAULT_NFT_CHAINID: z.coerce.number().optional(),
    ZERO_PAYMENT_REGISTRATION_TRIAL_DAYS: z
      .string()
      .optional()
      .default('2')
      .pipe(z.coerce.number()),
    // Listmonk email service
    LISTMONK_URL: z.string().url(),

    // DNS resolution config (nameservers, relay zone, Caddy DNS-JWT park gate)
    // owned by @namefi-astra/dns-service so backend and ns-json-api agree.
    ...dnsConfigSchema.shape,
  })
  .superRefine(refineParkGateTtls);

export type ConfigInput = z.input<typeof configSchema>;
