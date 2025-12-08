import type { z } from 'zod';

/**
 * Make a Zod object schema loose (allow extra properties) while preserving type safety.
 * This is useful for XML parsing where xmlns and other attributes may be present.
 */
export function zloosen<Z extends z.ZodObject<z.ZodRawShape>>(schema: Z): Z {
  return schema.passthrough() as Z;
}
