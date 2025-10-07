import { z } from 'zod';

export const secretsSchema = z.object({
  OPENAI_API_KEY: z.string(),
  GEMINI_API_KEY: z.string(),
});

export type SecretsSchema = z.infer<typeof secretsSchema>;
