import { z } from 'zod';

export const baseConfigSchema = z.object({
  ENVIRONMENT: z.enum(['development', 'staging', 'production', 'test']),
});

export type BaseConfig = z.infer<typeof baseConfigSchema>;
