import { z } from 'zod';

export const configSchema = z.object({
  BACKEND_URL: z.string().url(),
  GA_MEASUREMENT_ID: z.string(),
  PRIVY_APP_ID: z.string(),
  STRIPE_PUBLISHABLE_KEY: z.string(),
  /**
   * List of first-party domains that are owned by NameFI and allowed to interact with the API.
   */
  NAMEFI_FIRST_PARTY_ORIGINS: z.string().array().default([]),
  POWERED_BY_NAMEFI_THIRD_PARTY_ORIGINS: z.string().array().default([]),
  /**
   * Map of additional origins to their corresponding hostnames.
   * @example
   * {
   *   '0xcity.localhost': '0x.city',
   *   'defibuild.localhost': 'defi.build',
   * }
   */
  ADDITIONAL_ORIGIN_TO_HOSTNAME_MAP: z
    .record(z.string(), z.string())
    .default({}),
});

export type ConfigInput = z.input<typeof configSchema>;
