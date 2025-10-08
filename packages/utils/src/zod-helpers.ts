import { z } from 'zod';

export const literalSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

type Literal = z.infer<typeof literalSchema>;

type Json = Literal | { [key: string]: Json } | Json[];

export const jsonSchema: z.ZodType<Json> = z.lazy(
  () =>
    z.union([
      literalSchema,
      z.array(jsonSchema),
      z.record(z.string(), jsonSchema),
    ]) as unknown as z.ZodType<Json>,
) as unknown as z.ZodType<Json>;

export const zJson = z
  .string()
  .transform((str, ctx): z.infer<typeof jsonSchema> => {
    try {
      return JSON.parse(str);
    } catch (e) {
      ctx.addIssue({ code: 'custom', message: 'Invalid JSON' });
      return z.NEVER;
    }
  });
