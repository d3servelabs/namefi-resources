import type { ZodSchema } from 'zod';

export interface LoadSecretsOptions<Z> {
  secretsSchema: Z;
  secrets?: Record<string, string>;
}

export const loadSecrets = <Z extends ZodSchema<any>>(
  options: LoadSecretsOptions<Z>,
): Z['_output'] => {
  const validatedSecrets = options.secretsSchema.parse(
    options.secrets ?? process.env,
  );
  return validatedSecrets;
};
