import { z } from 'zod';

export const configSchema = z.object({
  BACKEND_URL: z.string().url(),
  PRIVY_APP_ID: z.string(),
});

export type Config = z.infer<typeof configSchema>;
