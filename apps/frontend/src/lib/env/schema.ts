import { z, type ZodSchema } from 'zod';
import { ALLOWED_CHAINS_SCHEMA } from '@namefi-astra/utils/allowed-chains';

export const configSchema = z.object({
  TYPE: z.enum(['development', 'production', 'local', 'preview', 'custom']),
  APP_VERSION: z.string().default('unknown'),
  DEPLOY_COMMIT_SHA: z.string().default('unknown'),
  BACKEND_URL: z.url(),
  MLS_PUBLIC_SALES_LISTINGS_URL: z.url(),
  RESOURCES_URL: z.url(),
  DOCS_URL: z.url(),
  FIRST_PARTY_DEPLOYMENT_URL: z.url(),
  GA_MEASUREMENT_ID: z.string(),
  PRIVY_APP_ID: z.string(),
  STRIPE_PUBLISHABLE_KEY: z.string(),
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
  ALLOWED_CHAINS: z.preprocess((value) => value ?? [], ALLOWED_CHAINS_SCHEMA),
  HUNT_CAMPAIGN_KEYS: z.string().array().default([]),
  DATADOG_LOGS_CLIENT_TOKEN: z
    .string()
    .default('pub8e11bd5c37f5798e2df1b8b503c24ed8'),
  DATADOG_LOGS_SESSION_SAMPLE_RATE: z.number().min(0).max(100).default(100),
});

export type ConfigInput = z.input<typeof configSchema>;

export const serverSideSecretsSchema = z.object({
  API_AUTH_KEY: z.string(),
  DATADOG_API_KEY: z.string().min(1),
});

export type SecretsInput = z.input<typeof serverSideSecretsSchema>;

export const clientSideEnvSchema = z.object({
  NEXT_PUBLIC_ALCHEMY_FRONTEND_API_KEY: z.string().optional(),
  /**
   * Rarible API key (developer portal). Required for the Rarible marketplace
   * adapter — Rarible has no instant-key endpoint, so this must be set per env.
   * When absent, the Rarible adapter is treated as unconfigured and the
   * Marketplace panel degrades gracefully (OpenSea unaffected).
   */
  NEXT_PUBLIC_RARIBLE_API_KEY: z.string().optional(),
  /**
   * Enables the LooksRare marketplace adapter. LooksRare is opt-in: it is
   * Ethereum-mainnet only, and its API is public (the backend
   * `LOOKSRARE_API_KEY` is optional — it only raises rate limits), so this
   * flag is the single on/off switch. When `false` (the default) LooksRare is
   * absent from the marketplace panel entirely.
   */
  NEXT_PUBLIC_LOOKSRARE_ENABLED: z.stringbool().optional().default(false),
  /**
   * Enables the lending-protocols facade (`lib/lending-protocols/`). The BendDAO
   * and NFTfi adapters currently ship as stubs, so this flag defaults off — when
   * `false` every protocol maps to no chains and the facade drops out of
   * discovery entirely.
   */
  NEXT_PUBLIC_LENDING_ENABLED: z.stringbool().optional().default(false),
} satisfies Record<`NEXT_PUBLIC_${string}`, ZodSchema>);

export type ClientSideEnvInput = z.input<typeof clientSideEnvSchema>;
