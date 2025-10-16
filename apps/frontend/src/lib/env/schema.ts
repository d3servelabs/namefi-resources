import { z } from 'zod';

export const configSchema = z.object({
  TYPE: z.enum(['development', 'production', 'local']),
  BACKEND_URL: z.url(),
  RESOURCES_URL: z.url(),
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
  ALLOWED_CHAINS: z.number().array().default([]),
  HUNT_CAMPAIGN_KEYS: z.string().array().default([]),
});

export type ConfigInput = z.input<typeof configSchema>;

export const serverSideSecretsSchema = z.object({
  API_AUTH_KEY: z.string(),
});

export type SecretsInput = z.input<typeof serverSideSecretsSchema>;

export const clientSideEnvSchema = z.object({});

export type ClientSideEnvInput = z.input<typeof clientSideEnvSchema>;
