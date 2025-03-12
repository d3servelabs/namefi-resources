import { z } from 'zod';

export const secretsSchema = z.object({
  DATABASE_URL: z.string().url(),
});

export type SecretsSchema = z.infer<typeof secretsSchema>;
