import type { z } from 'zod';

export function zloosen<Z extends z.ZodObject>(z: Z): Z {
  return z.loose() as Z & { ['@_xlmns']?: string };
}
