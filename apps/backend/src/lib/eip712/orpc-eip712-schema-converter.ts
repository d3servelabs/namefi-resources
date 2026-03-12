import type { AnySchema } from '@orpc/contract';
import type { Promisable } from '@orpc/shared';
import { z } from 'zod';
import { toEip712TypesDef } from './eip712';
import type {
  ConditionalSchemaConverter,
  JSONSchema,
  SchemaConvertOptions,
} from '@orpc/openapi';
import type { TypedDataParameter } from 'viem';
import { omit } from 'ramda';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';

export class EIP712SchemaConverter implements ConditionalSchemaConverter {
  eip712Registery = new Map<string, z.core.$ZodType>();

  condition(
    schema: AnySchema | undefined,
    options: SchemaConvertOptions,
  ): Promisable<boolean> {
    this.register(schema);
    return false;
  }
  convert(
    schema: AnySchema | undefined,
    options: SchemaConvertOptions,
  ): Promisable<[required: boolean, jsonSchema: JSONSchema]> {
    return [false, {} as JSONSchema];
  }

  getTypes(): Record<string, readonly TypedDataParameter[]> | undefined {
    return omit(
      ['Primary'] as any,
      toEip712TypesDef(
        [],
        z.object(
          Object.fromEntries(Array.from(this.eip712Registery.entries())),
        ),
      )?.types,
    );
  }
  register(schema: AnySchema | undefined): void {
    if (schema instanceof z.ZodObject && 'meta' in schema) {
      const eip712 = schema.meta()?.eip712 as unknown as {
        structName: string;
        registryIgnore?: boolean;
      };
      const name = eip712?.structName;
      const registryIgnore = eip712?.registryIgnore;

      if (name && !registryIgnore) {
        this.eip712Registery.set(
          `${name}Envelope`,
          z
            .object({
              payloadType: z.string(),
              payload: schema,
              timestamp: z.number(),
              nonce: z.string(),
            })
            .meta({ eip712: { structName: `${name}Envelope` } }),
        );
      }
    }
  }
}

export const defaultEip712SchemaConverter = new EIP712SchemaConverter();

export function inputWithEip712Type(schema: z.ZodObject) {
  const eip712 = schema.meta()?.eip712 as unknown as {
    structName: string;
    registryIgnore?: boolean;
  };
  const name = eip712?.structName;
  if (name) {
    return z.union([
      z
        .object({
          payloadType: z.literal(name),
          payload: schema,
          timestamp: z.number(),
          nonce: z.string(),
        })
        .meta({
          eip712: { structName: `${name}Envelope`, registryIgnore: true },
          description: `${name}Eip712Envelope`,
        }),
      schema,
    ]);
  }
  return schema;
}

export class ZodToJsonSchemaConverterWithEip712 extends ZodToJsonSchemaConverter {
  convert(
    schema: AnySchema | undefined,
    options: SchemaConvertOptions,
  ): [required: boolean, jsonSchema: Exclude<JSONSchema, boolean>] {
    return super.convert(inputWithEip712Type(schema as z.ZodObject), options);
  }
}
