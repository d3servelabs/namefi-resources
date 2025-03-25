import { isNil } from 'ramda';

type AsyncResultGetters<E, T> = { result: T; error: E } & {
  success: E extends null ? true : false;
  failed: E extends null ? false : true;
};

/** Represents possible error types that can be returned */
type ErrorOrData = Error; // | string | number | boolean | object;

/** Represents a successful async result tuple with a value and null error */
type AsyncResultTupleSuccessful<T> = [null, T] & AsyncResultGetters<null, T>;

/** Represents a failed async result tuple with an error and null value */
type AsyncResultTupleFailure<E = ErrorOrData> = [E, null] &
  AsyncResultGetters<E, null>;

/** Union type representing either a successful or failed async result */
type AsyncResultTuple<T, E = ErrorOrData> =
  | AsyncResultTupleSuccessful<T>
  | AsyncResultTupleFailure<E>;

// biome-ignore lint/suspicious/noExplicitAny:
export class PrimitiveValueError<T = any> extends Error {
  value: T;
  constructor(value: T, message?: string) {
    super(message);
    this.value = value;
  }
}

/**
 * Safely resolves a promise and returns a tuple containing either [null, result] or [error, null]
 * along with helper properties for checking the status and accessing values
 *
 * @param promise - The promise to resolve
 * @returns A tuple with either [null, T] for success or [ErrorOrData, null] for failure
 * @template T - The type of the successful result
 */
export const resolve = async <T, E = ErrorOrData>(
  promise: PromiseLike<T>,
  _errorType: E = {} as unknown as E,
): Promise<AsyncResultTuple<T, E>> => {
  let output: [null, T] | [E, null];
  let success = true;
  try {
    const response = await promise;
    output = [null, response];
    // biome-ignore lint/suspicious/noExplicitAny: error can be any
  } catch (_error: any) {
    // This needs to be extend to account for other values like arrays, but these are the primitives that cause issues because of boolean coercion
    const error =
      ['string', 'number', 'boolean', 'bigint'].includes(typeof _error) ||
      _error instanceof BigInt ||
      _error instanceof Number ||
      _error instanceof Boolean ||
      _error instanceof String
        ? new PrimitiveValueError(_error)
        : _error;
    output = [error ?? new Error('Nil Error'), null];
    success = false;
  }

  return Object.defineProperties(output, {
    success: {
      value: success,
      writable: false,
    },
    failed: {
      get() {
        return !this.success;
      },
    },
    result: {
      get() {
        return this[1];
      },
    },
    error: {
      get() {
        return this[0];
      },
    },
  }) as AsyncResultTuple<T, E>;
};

/**
 * Type guard to check if an async result tuple represents a successful operation
 *
 * @param asyncResultTuple - The tuple to check
 * @returns True if the operation was successful
 * @template T - The type of the successful result
 */
export function isAsyncSuccessful<T>(
  asyncResultTuple: AsyncResultTuple<T>,
): asyncResultTuple is AsyncResultTupleSuccessful<T> {
  const [error] = asyncResultTuple;
  return isNil(error);
}

/**
 * Type guard to check if an async result tuple represents a failed operation
 *
 * @param asyncResultTuple - The tuple to check
 * @returns True if the operation failed
 * @template T - The type of the successful result
 */
export function isAsyncFailure<T>(
  asyncResultTuple: AsyncResultTuple<T>,
): asyncResultTuple is AsyncResultTupleFailure {
  const [error] = asyncResultTuple;
  return !isNil(error);
}

/**
 * Resolves a promise and returns either the result or a fallback value if the promise fails
 *
 * @param promise - The promise to resolve
 * @param fallback - The fallback value to return if the promise fails
 * @param options - Optional configuration for error logging
 * @returns The promise result or fallback value
 * @template T - The type of the successful result
 * @template D - The type of the fallback value
 */
export const resolveOrFallback = async <T, D>(
  promise: PromiseLike<T>,
  fallback: D,
  options?: {
    enableErrorLog: boolean;
    // biome-ignore lint/suspicious/noExplicitAny: logger can accept any arguments
    logger: { error: (...args: any[]) => any; log: (...args: any[]) => any };
  },
): Promise<T | D> => {
  const res = await resolve(promise);
  if (res.success) {
    return res.result;
  }
  if (options?.enableErrorLog) {
    (options.logger ?? console).error(res.error);
  }

  return fallback;
};

/**
 * Resolves a promise and returns either the result or a default value of the same type if the promise fails
 *
 * @param promise - The promise to resolve
 * @param fallback - The default value to return if the promise fails
 * @param options - Optional configuration for error logging
 * @returns The promise result or default value
 * @template T - The type of both the successful result and fallback
 */
export const resolveOrDefault = async <T>(
  promise: PromiseLike<T>,
  fallback: T,
  options?: {
    enableErrorLog: boolean;
    // biome-ignore lint/suspicious/noExplicitAny: logger can accept any arguments
    logger: { error: (...args: any) => any; log: (...args: any) => any };
  },
): Promise<T> => {
  const res = await resolve(promise);
  if (res.success) {
    return res.result;
  }
  if (options?.enableErrorLog) {
    (options.logger ?? console).error(res.error);
  }

  return fallback;
};
