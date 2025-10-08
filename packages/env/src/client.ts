import type { z } from 'zod';

export interface LoadSecretsOptions<Schema extends z.ZodTypeAny> {
  secretsSchema: Schema;
  secrets?: Record<string, string | undefined>;
}

export const loadSecrets = <Schema extends z.ZodTypeAny>(
  options: LoadSecretsOptions<Schema>,
): z.output<Schema> => {
  const validatedSecrets = options.secretsSchema.parse(
    options.secrets ?? process.env,
  );
  return validatedSecrets;
};
