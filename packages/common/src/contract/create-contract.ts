import { z } from 'zod';

import type { ProcedureContract, RouterContract } from './trpc-contract';

export type ContractConfig = {
  softOutput?: boolean;
};

/**
 * Define a router contract with optional runtime behaviour.
 *
 * When `config.softOutput` is `true`, every procedure's output schema is
 * replaced at runtime with one that always passes — if `safeParse` fails
 * the error is logged but the value is still returned to the client.
 * The TypeScript type is preserved so compile-time inference is unaffected.
 *
 * When `config.softOutput` is `false` (or omitted) the contract object is
 * returned unchanged — zero overhead.
 */
export function createContract<const T extends RouterContract>(
  config: ContractConfig,
  procedures: T,
): T {
  if (!config.softOutput) return procedures;
  return wrapContractOutputs(procedures) as T;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isProcedureContract(
  value: ProcedureContract | RouterContract,
): value is ProcedureContract {
  return 'type' in value && 'input' in value && 'output' in value;
}

function wrapContractOutputs(
  contract: RouterContract,
  path: string[] = [],
): RouterContract {
  const result: Record<string, ProcedureContract | RouterContract> = {};
  for (const [key, value] of Object.entries(contract)) {
    if (isProcedureContract(value)) {
      result[key] = {
        ...value,
        output: softOutputSchema(value.output, [...path, key].join('.')),
      };
    } else {
      result[key] = wrapContractOutputs(value as RouterContract, [
        ...path,
        key,
      ]);
    }
  }
  return result;
}

function softOutputSchema<T extends z.ZodTypeAny>(
  schema: T,
  procedurePath: string,
): z.ZodType<z.output<T>> {
  return z.custom<z.output<T>>((val) => {
    const result = schema.safeParse(val);
    if (!result.success) {
      console.error(
        `[trpc-contract] Output validation failed for "${procedurePath}" (soft mode)`,
        result.error.flatten(),
      );
    }
    return true;
  });
}
