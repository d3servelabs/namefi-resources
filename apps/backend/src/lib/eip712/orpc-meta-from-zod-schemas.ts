import z from 'zod';
import { toEip712TypesDef } from './eip712';
import { omit } from 'ramda';

export function getEip712MetaFromZodSchema(schemas: any) {
  const finalSchemas = schemas.map((schema: any) => {
    const name = (schema.meta()?.eip712 as any)?.structName;
    return {
      name: `${name}Envelope`,
      schema: z
        .object({
          payload: schema,
          timestamp: z.number(),
          nonce: z.string(),
        })
        .meta({
          eip712: {
            structName: `${name}Envelope`,
          },
        }),
    };
  }) as { name: string; schema: z.core.$ZodType }[];
  return {
    eip712: {
      input: {
        acceptedPrimaryTypes: finalSchemas.map(({ name }) => name),
        types: omit(
          ['Primary'] as any,
          toEip712TypesDef(
            [],
            z.object(
              Object.fromEntries(
                finalSchemas.map(({ name, schema }) => [name, schema]),
              ),
            ),
          )?.types,
        ),
      },
    },
  };
}
