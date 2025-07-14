export const promiseWithAbortSignal = async <T>(
  promise: () => Promise<T>,
  signal: AbortSignal | undefined | null,
  fallbackValueOnAbort: T,
): Promise<T> => {
  if (signal?.aborted) return fallbackValueOnAbort;

  if (!signal) {
    return await promise();
  }

  // if the request is aborted, return the fallback
  return await Promise.race([
    promise(),
    new Promise<T>((resolve) => {
      signal?.addEventListener('abort', () => {
        resolve(fallbackValueOnAbort);
      });
    }),
  ]);
};
