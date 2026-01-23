import { z } from 'zod';

export const configSchema = z.object({
  TYPE: z.enum(['development', 'production', 'local', 'preview', 'test']),
  BACKEND_URL: z.url(),
});

export type ConfigInput = z.input<typeof configSchema>;
