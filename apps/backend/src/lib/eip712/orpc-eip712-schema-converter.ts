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
      const name = (schema.meta()?.eip712 as unknown as { structName: string })
        ?.structName;
      if (name) {
        this.eip712Registery.set(
          `${name}Envelope`,
          z
            .object({
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
