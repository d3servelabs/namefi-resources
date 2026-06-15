import { z } from 'zod';
import {
  dnsConfigSchema,
  dnsSecretsSchema,
  refineParkGateTtls,
} from './dns-config-schema';

export const configSchema = dnsConfigSchema.superRefine(refineParkGateTtls);
export type ConfigInput = z.input<typeof configSchema>;
export type Config = z.infer<typeof configSchema>;

export const secretsSchema = dnsSecretsSchema.extend({
  /**
   * Redis connection used to cache issued park-gate tokens and the
   * powered-by-namefi domain list. Optional: when unset, park-gate caching
   * is skipped and the powered-by lookup falls back to a direct DB read.
   */
  MAIN_REDIS_URL: z.string().url().optional(),
});
export type SecretsSchema = z.infer<typeof secretsSchema>;
