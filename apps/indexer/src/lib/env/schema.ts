import { zJson } from '@namefi-astra/utils/zod-helpers';
import { z } from 'zod';

export const secretsSchema = z.object({
  DATABASE_URL: z.string().url(),
  ALCHEMY_API_KEY: z.string(),
  USE_WEBSOCKETS: zJson.optional().pipe(z.boolean().default(true)),
});

export type SecretsSchema = z.infer<typeof secretsSchema>;

export const configSchema = z.object({});

export type ConfigInput = z.input<typeof configSchema>;
