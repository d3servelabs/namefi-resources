/**
 * Type guard function that checks if a value matches any of the provided arguments
 * @template E - The base type
 * @template T - Type extending E for the first argument
 * @template A - Type extending E for rest of the arguments
 * @param toBeChecked - The value to check
 * @param args - Array of values to check against
 * @returns Boolean indicating if the value matches any argument
 */
export function matchAny<E, T extends E, A extends E>(
  toBeChecked: E,
  ...args: [T, ...A[]]
): toBeChecked is T | A {
  return args.some((arg) => toBeChecked === arg);
}

/**
 * Type guard function that checks if a value does not match any of the provided arguments
 * @template E - The base type
 * @template T - Type extending E for the first argument
 * @template A - Type extending E for rest of the arguments
 * @template K - Type extending E, excluding T and A
 * @param toBeChecked - The value to check
 * @param args - Array of values to check against
 * @returns Boolean indicating if the value does not match any argument
 */
export function notMatchAny<
  E,
  T extends E,
  A extends E,
  K extends E = Exclude<E, T | A>,
>(toBeChecked: E, ...args: [T, ...A[]]): toBeChecked is K {
  // biome-ignore lint/suspicious/noExplicitAny: "any" is intentional to enable matching with any input.
  return !matchAny(toBeChecked, ...(args as [any, ...any[]]));
}

/**
 * Type guard function that checks if a value mismatches all provided arguments
 * @template E - The base type
 * @template T - Type extending E for the first argument
 * @template A - Type extending E for rest of the arguments
 * @template K - Type extending E, excluding T and A
 * @param toBeChecked - The value to check
 * @param args - Array of values to check against
 * @returns Boolean indicating if the value mismatches all arguments
 */
export function mismatchAll<
  E,
  T extends E,
  A extends E,
  K extends E = Exclude<E, T | A>,
>(toBeChecked: E, ...args: [T, ...A[]]): toBeChecked is K {
  return !matchAny(toBeChecked, ...(args as [any, ...any[]]));
}

/**
 * This acts as a cleaner way in the code to handle switch-case
 * @template K - Type for the selector key (string, number, or symbol)
 * @template M - Type for the map object extending Record<K, any>
 * @param select - The key to select from the map
 * @param map - Object containing key-value pairs
 * @returns The value associated with the selected key
 * @throws Error if the key is not found in the map
 */
export function caseWhen<
  K extends string | number | symbol,
  // biome-ignore lint/suspicious/noExplicitAny: "any" is intentional to enable matching with any input.
  M extends Record<K, any>,
>(select: K, map: M): M[K] {
  if (select in map) {
    return map[select];
  }
  throw new Error('unknown-case');
}

export const switchCase = caseWhen;

/**
 * Similar to caseWhen but returns a default value if the key is not found
 * @template K - Type for the selector key
 * @template M - Type for the partial map object
 * @template D - Type for the default value
 * @param select - The key to select from the map
 * @param map - Object containing key-value pairs
 * @param defaultValue - Value to return if key is not found
 * @returns The value associated with the selected key or the default value
 */
export function caseWhenOr<
  K extends keyof any,
  M extends Partial<Record<K, any>>,
  D extends any | undefined | null,
>(
  select: K,
  map: M,
  defaultValue: D,
): K extends keyof M ? M[K] : M[keyof M] | D {
  if (select in map) {
    return map[select];
  }
  //@ts-expect-error D is not assignable to return type
  return defaultValue;
}

export const switchCaseOrDefault = caseWhenOr;
