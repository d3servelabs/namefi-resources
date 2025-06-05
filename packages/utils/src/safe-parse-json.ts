import type { z } from 'zod';
import { zJson } from './zod-helpers';

/**
 * safely paring json and returning a default value if the json is not valid
 * @param json - the json to parse
 * @param returned - the default value to return if the json is not valid
 * @returns the parsed json or the default value
 */
export function safeParseJson<
  T extends z.infer<typeof zJson> | undefined | null,
>(json: any, returned: T = undefined as T): T {
  return parseJsonOrDefault(json, returned);
}

/**
 * safely parsing a json and returning a default value if the json is not valid
 * @param json - the json to parse
 * @param defaultValue - the default value to return if the json is not valid
 * @returns the parsed json or the default value
 */
export function parseJsonOrDefault<
  T extends z.infer<typeof zJson> | undefined | null,
>(json: any, defaultValue: T): T {
  const result = zJson.safeParse(json);
  if (result.success) {
    return result.data as T;
  }
  return defaultValue;
}

/**
 * safely parsing a json and returning undefined if the json is not valid
 * @param json - the json to parse
 * @returns the parsed json or undefined
 */
export function parseJsonOrUndefined<T extends z.infer<typeof zJson>>(
  json: any,
): T | undefined {
  return parseJsonOrDefault(json, undefined);
}

/**
 * safely parsing a json and returning null if the json is not valid
 * @param json - the json to parse
 * @returns the parsed json or null
 */
export function parseJsonOrNull<T extends z.infer<typeof zJson>>(
  json: any,
): T | null {
  return parseJsonOrDefault(json, null);
}
