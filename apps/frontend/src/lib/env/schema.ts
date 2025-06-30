import { z } from 'zod';

export const configSchema = z.object({
  BACKEND_URL: z.string().url(),
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
  /**
   * UserCentrics IDs for cookie consent management
   */
  USER_CENTRICS_SETTINGS_ID: z.string(),
  USER_CENTRICS_GOOGLE_ANALYTICS_SERVICE_ID: z.string(),
  ALLOWED_CHAINS: z.number().array().default([]),
});

export type ConfigInput = z.input<typeof configSchema>;

export const secretsSchema = z.object({
  NEXT_PUBLIC_VERCEL_URL: z.string().transform((val) => `https://${val}`),
});

export type SecretsInput = z.input<typeof secretsSchema>;
