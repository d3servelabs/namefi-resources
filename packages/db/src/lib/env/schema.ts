import { z } from 'zod';

export const secretsSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_DRIVER: z.enum(['pg', 'neon']).default('neon'),
});

export type SecretsSchema = z.infer<typeof secretsSchema>;
