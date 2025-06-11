import { z } from 'zod';

export const secretsSchema = z.object({
  SUPABASE_PROJECT_REF: z.string(),
  SUPABASE_S3_ACCESS_KEY_ID: z.string(),
  SUPABASE_S3_SECRET_ACCESS_KEY: z.string(),
  SUPABASE_S3_REGION: z.string(),
});

export type SecretsSchema = z.infer<typeof secretsSchema>;
