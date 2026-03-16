import { loadSecrets } from '@namefi-astra/env/client';
import { z } from 'zod';

const mailSchema = z.object({
  ENVIRONMENT: z.enum([
    'local',
    'development',
    'production',
    'test',
    'custom',
    'preview',
  ]),
  EMAIL_TRACKING_JWT_SECRET: z.string().min(1),
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
