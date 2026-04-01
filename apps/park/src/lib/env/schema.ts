import { z } from 'zod';

export const configSchema = z.object({
  TYPE: z.enum(['local', 'development', 'production', 'test', 'preview']),
  NAMEFI_MD_API_ENDPOINT: z.url(),
  ASTRA_BACKEND_URL: z.url(),
  NEWSLETTER_ENDPOINT: z.url().optional(),
  NAMEFI_NFT_ADDRESS: z.string(),
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES: z.string().array().default([]),
  ADDITIONAL_HOSTNAME_MAP: z.record(z.string(), z.string()).default({}),
  FRONTEND_URL: z.url(),
});

export type ConfigInput = z.input<typeof configSchema>;

export const serverSideSecretsSchema = z.object({
  API_AUTH_KEY: z.string(),
});

export type SecretsInput = z.input<typeof serverSideSecretsSchema>;
