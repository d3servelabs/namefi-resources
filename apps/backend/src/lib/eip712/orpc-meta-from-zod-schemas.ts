import z from 'zod';
import { toEip712TypesDef } from './eip712';
import { omit } from 'ramda';
import type { ORPCMeta } from '@orpc/trpc';
import { PayloadType } from '@vercel/sdk/models/userevent.js';

type Eip712MethodEntry = {
  acceptedPrimaryTypes: string[];
  types: Record<string, any>;
};

type Eip712Meta = {
  eip712: {
    input: Eip712MethodEntry;
  };
};

/**
 * Registry mapping operationId -> EIP-712 method metadata.
 * Populated automatically when routes call `orpcMetaWithEip712FromZodSchema`.
 */
const eip712MethodRegistry = new Map<string, Eip712MethodEntry>();

export function getEip712MethodRegistry(): ReadonlyMap<
  string,
  Eip712MethodEntry
> {
  return eip712MethodRegistry;
}
export function getEip712MetaFromZodSchema(schemas: any): Eip712Meta {
  const finalSchemas = schemas.map((schema: any) => {
    const name = (schema.meta()?.eip712 as any)?.structName;
    return {
      name: `${name}Envelope`,
      schema: z
        .object({
          payloadType: z.string(),
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

export function orpcMetaWithEip712FromZodSchema<T extends ORPCMeta>(
  schema: z.core.$ZodType[],
  meta: T,
): Eip712Meta & T {
  const _eip712meta = getEip712MetaFromZodSchema(schema);

  const operationId = meta.route?.operationId;
  if (operationId) {
    eip712MethodRegistry.set(operationId, _eip712meta.eip712.input);
  }

  return {
    ..._eip712meta,
    ...meta,
    route: {
      ...meta.route,
      spec: (spec) => {
        const _spec =
          meta?.route?.spec && typeof meta.route.spec === 'function'
            ? meta.route.spec(spec)
            : spec;
        return {
          ..._spec,
          'x-eip712-accepted-primary-types':
            _eip712meta.eip712.input.acceptedPrimaryTypes,
          'x-eip712-types': _eip712meta.eip712.input.types,
        };
      },
    } satisfies T['route'],
  };
}
