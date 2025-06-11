// Browser-compatible async interval function
export const createAsyncInterval = (
  ms: number,
  signal?: AbortSignal,
  options?: { maxCount?: number },
) => {
  return {
    [Symbol.asyncIterator]() {
      let count = 0;
      return {
        next() {
          return new Promise<{ value: number; done: boolean }>(
            (resolve, reject) => {
              if (signal?.aborted) {
                return reject(new DOMException('Aborted', 'AbortError'));
              }

              const timer = setTimeout(() => {
                resolve({
                  value: count++,
                  done: options?.maxCount ? count >= options.maxCount : false,
                });
              }, ms);

              if (signal) {
                signal.addEventListener(
                  'abort',
                  () => {
                    clearTimeout(timer);
                    reject(new DOMException('Aborted', 'AbortError'));
                  },
                  { once: true },
                );
              }
            },
          );
        },
      };
    },
  };
};
