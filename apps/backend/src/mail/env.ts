import { loadSecrets } from '@namefi-astra/env/client';
import { z } from 'zod';

const mailSchema = z.object({
  // Keep behavior aligned with pre-mail/env implementation:
  // missing/invalid ENVIRONMENT should gracefully fall back to production.
  ENVIRONMENT: z
    .enum(['local', 'development', 'production', 'test', 'custom', 'preview'])
    .catch('production'),
  // Keep this optional with the same development fallback secret as the global env schema.
  EMAIL_TRACKING_JWT_SECRET: z
    .string()
    .optional()
    .default('--dev-jwt-secret--'),
});

const mailEnv = loadSecrets({
  secretsSchema: mailSchema,
});

export const mailConfig = {
  ENVIRONMENT: mailEnv.ENVIRONMENT,
} as const;

export const mailSecrets = {
  EMAIL_TRACKING_JWT_SECRET: mailEnv.EMAIL_TRACKING_JWT_SECRET,
} as const;
