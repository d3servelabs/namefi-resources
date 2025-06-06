import { z } from 'zod';

export const configSchema = z.object({
  AWS_REGION: z.string(),
  DYNADOT_BASE_URL: z.string().optional(),
});

export type ConfigInput = z.input<typeof configSchema>;

export const secretsSchema = z.object({
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  WHOIS_API_KEY: z.string(),
  DYNADOT_API_KEY: z.string(),
  DYNADOT_PRIVATE_KEY: z.string().optional(),
  DYNADOT_ACCOUNT_ID: z.string().optional(),
});

export type SecretsSchema = z.infer<typeof secretsSchema>;
