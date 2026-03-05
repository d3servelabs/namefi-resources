import type { z } from 'zod';
import { analyzeZodType } from './analyze-zod-schema';
import { pascalCase } from 'change-case';
import type { TypedData, TypedDataParameter } from 'viem';

export function toEip712TypesDef(
  path: string[],
  s: z.ZodTypeAny,
  _c?: { types: [string, TypedDataParameter[]][]; dropOptional?: boolean },
):
  | {
      typedData: TypedData;
      types: Record<string, readonly TypedDataParameter[]>;
    }
  | undefined {
  const info = analyzeZodType(s);
  const maybeToArray = info.array ? toArr : (x: any) => x;
  const name = path.at(-1);
  const c = _c ?? { types: [], dropOptional: false };
  const dropOptional = c.dropOptional;
  if (dropOptional && (info.optional || info.nullable)) {
    return;
  }

  switch (info.type) {
    case 'object':
      try {
        const schema = info.innermostType;
        let typeName = name
          ? path.map((p) => pascalCase(p)).join('_')
          : 'Primary';
        if ('meta' in schema) {
          typeName =
            (schema.meta()?.eip712 as unknown as { structName: string })
              ?.structName ?? typeName;
        }
        const typeParameters = Object.entries(schema.def.shape)
          .map(
            ([k, v]) => toEip712TypesDef([...path, k], v as any, c)?.typedData,
          )
          .filter((x) => x !== undefined) as unknown as TypedDataParameter[];
        c.types.push([typeName, typeParameters]);
        return {
          typedData: maybeToArray({ name: name ?? 'primary', type: typeName }),
          types: Object.fromEntries(c.types),
        };
      } catch {
        throw new Error(`Unsupported object shape for field: ${name}`);
      }
    default:
      if (!name) {
        return;
      }
      switch (info.type) {
        case 'string':
          return {
            typedData: maybeToArray({ name, type: 'string' }),
            types: Object.fromEntries(c.types),
          };
        case 'number':
        case 'bigint':
          return {
            typedData: maybeToArray({ name, type: 'uint256' }),
            types: Object.fromEntries(c.types),
          };
        case 'boolean':
          return {
            typedData: maybeToArray({ name, type: 'bool' }),
            types: Object.fromEntries(c.types),
          };
      }
      return;
  }
}
function toArr({ name, type }: TypedDataParameter) {
  return { name, type: `${type}[]` };
}
