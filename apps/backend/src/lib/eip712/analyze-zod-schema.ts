import { z } from 'zod';

type Analysis = {
  optional?: boolean;
  exactoptional?: boolean;
  nullable?: boolean;
  array?: boolean;
  transform?: boolean;
  lazy?: boolean;
} & (
  | {
      type: 'void';
      innermostType: z.ZodVoid;
    }
  | {
      type: 'unknown';
      innermostType: z.ZodUnknown;
    }
  | {
      type: 'nan';
      innermostType: z.ZodNaN;
    }
  | {
      type: 'literal';
      innermostType: z.ZodLiteral;
    }
  | {
      type: 'file';
      innermostType: z.ZodFile;
    }
  | {
      type: 'object';
      innermostType: z.ZodObject<any>;
    }
  | {
      type: 'record';
      innermostType: z.ZodRecord<any>;
    }
  | {
      type: 'function';
      innermostType: z.ZodFunction<any>;
    }
  | {
      type: 'boolean';
      innermostType: z.ZodBoolean;
    }
  | {
      type: 'string';
      innermostType: z.ZodString;
    }
  | {
      type: 'number';
      innermostType: z.ZodNumber;
    }
  | {
      type: 'bigint';
      innermostType: z.ZodBigInt;
    }
  | {
      type: 'date';
      innermostType: z.ZodDate;
    }
  | {
      type: 'symbol';
      innermostType: z.ZodSymbol;
    }
  | {
      type: 'null';
      innermostType: z.ZodNull;
    }
  | {
      type: 'undefined';
      innermostType: z.ZodUndefined;
    }
  | {
      type: 'any';
      innermostType: z.ZodAny;
    }
  | {
      type: 'never';
      innermostType: z.ZodNever;
    }
);

export function analyzeZodType(s: z.core.$ZodType, c = {}): Analysis {
  if (s instanceof z.ZodBoolean) {
    return { type: 'boolean', innermostType: s, ...c };
  }
  if (s instanceof z.ZodString) {
    return { type: 'string', innermostType: s, ...c };
  }
  if (s instanceof z.ZodNumber) {
    return { type: 'number', innermostType: s, ...c };
  }
  if (s instanceof z.ZodBigInt) {
    return { type: 'bigint', innermostType: s, ...c };
  }
  if (s instanceof z.ZodDate) {
    return { type: 'date', innermostType: s, ...c };
  }
  if (s instanceof z.ZodSymbol) {
    return { type: 'symbol', innermostType: s, ...c };
  }
  if (s instanceof z.ZodNull) {
    return { type: 'null', innermostType: s, ...c };
  }
  if (s instanceof z.ZodUndefined) {
    return { type: 'undefined', innermostType: s, ...c };
  }
  if (s instanceof z.ZodAny) {
    return { type: 'any', innermostType: s, ...c };
  }
  if (s instanceof z.ZodNever) {
    return { type: 'never', innermostType: s, ...c };
  }
  if (s instanceof z.ZodVoid) {
    return { type: 'void', innermostType: s, ...c };
  }
  if (s instanceof z.ZodUnknown) {
    return { type: 'unknown', innermostType: s, ...c };
  }
  if (s instanceof z.ZodNaN) {
    return { type: 'nan', innermostType: s, ...c };
  }
  if (s instanceof z.ZodLiteral) {
    return { type: 'literal', innermostType: s, ...c };
  }
  if (s instanceof z.ZodFile) {
    return { type: 'file', innermostType: s, ...c };
  }
  if (s instanceof z.ZodFunction) {
    return { type: 'function', innermostType: s, ...c };
  }

  if (s instanceof z.ZodObject) {
    return { type: 'object', innermostType: s, ...c };
  }

  if (s instanceof z.ZodRecord) {
    return { type: 'record', innermostType: s, ...c };
  }

  if (
    typeof s === 'object' &&
    s !== null &&
    'unwrap' in s &&
    typeof s.unwrap === 'function'
  ) {
    if (s instanceof z.ZodArray) {
      return analyzeZodType(s.unwrap(), { array: true, ...c });
    }
    if (s instanceof z.ZodOptional) {
      return analyzeZodType(s.unwrap(), { optional: true, ...c });
    }
    if (s instanceof z.ZodNonOptional) {
      return analyzeZodType(s.unwrap(), { nonoptional: true, ...c });
    }
    if (s instanceof z.ZodExactOptional) {
      return analyzeZodType(s.unwrap(), { exactoptional: true, ...c });
    }
    if (s instanceof z.ZodNullable) {
      return analyzeZodType(s.unwrap(), { nullable: true, ...c });
    }
    if (s instanceof z.ZodDefault) {
      return analyzeZodType(s.unwrap(), {
        default: true,
        defaultValue: s.def.defaultValue,
        ...c,
      });
    }
    if (s instanceof z.ZodPrefault) {
      return analyzeZodType(s.unwrap(), {
        prefault: true,
        defaultValue: s.def.defaultValue,
        ...c,
      });
    }
    if (s instanceof z.ZodPromise) {
      return analyzeZodType(s.unwrap(), { promise: true, ...c });
    }
    if (s instanceof z.ZodSuccess) {
      return analyzeZodType(s.unwrap(), { success: true, ...c });
    }
    if (s instanceof z.ZodCatch) {
      return analyzeZodType(s.unwrap(), { catch: true, ...c });
    }
    if (s instanceof z.ZodReadonly) {
      return analyzeZodType(s.unwrap(), { readonly: true, ...c });
    }
    if (s instanceof z.ZodLazy) {
      return analyzeZodType(s.unwrap(), { lazy: true, ...c });
    }
    if (s instanceof z.ZodTransform) {
      return analyzeZodType(s.unwrap(), { transform: true, ...c });
    }
    return analyzeZodType(s.unwrap(), c);
  }

  return { type: 'unknown', innermostType: s as z.ZodUnknown, ...c };
}
