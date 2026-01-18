import { z } from 'zod';

export const baseConfigSchema = z.object({
  ENVIRONMENT: z.enum([
    'local',
    'development',
    'production',
    'test',
    'custom',
    'preview',
  ]),
});

export type BaseConfig = z.infer<typeof baseConfigSchema>;
