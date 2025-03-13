import { z } from 'zod';

export const configSchema = z.object({
  EXAMPLE_CONFIG_VAR: z.string(),
  SUPPORTED_LOCALES: z.array(z.string()),
});

export type Config = z.infer<typeof configSchema>;
