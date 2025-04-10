import { z } from 'zod';

export const configSchema = z.object({
  BACKEND_URL: z.string().url(),
  GA_MEASUREMENT_ID: z.string(),
  PRIVY_APP_ID: z.string(),
  STRIPE_PUBLISHABLE_KEY: z.string(),
});

export type Config = z.infer<typeof configSchema>;
