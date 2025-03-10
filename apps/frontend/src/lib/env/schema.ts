import { z } from 'zod';

export const configSchema = z.object({
  EXAMPLE_CONFIG_VAR: z.string(),
});

export type Config = z.infer<typeof configSchema>;
