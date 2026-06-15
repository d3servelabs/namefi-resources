/**
 * Lazy-loading singleton helpers.
 *
 * A "lazy singleton" defers constructing a value until it is first needed,
 * then caches and reuses that single instance for the lifetime of the process.
 * This avoids paying construction/connection costs at import time and keeps a
 * single shared instance across all consumers.
 */

/** A memoized getter for a synchronously-constructed lazy singleton. */
export type LazyGetter<T> = (() => T) & {
  /** Drop the cached value so the next call rebuilds it. */
  reset(): void;
  /** Return the cached value without constructing it, else `undefined`. */
  peek(): T | undefined;
};

/**
 * Memoizes the result of `factory` on first call and returns the same instance
 * on every subsequent call (classic lazy singleton). `factory` runs at most
 * once until {@link LazyGetter.reset} is called.
 *
 * @param factory - Builder invoked lazily on first access.
 * @returns A getter that constructs-then-caches, plus `reset()` / `peek()`.
 * @template T - The type of the lazily-constructed value.
 */
export function lazy<T>(factory: () => T): LazyGetter<T> {
  let cached: { value: T } | undefined;

  const getter = (): T => {
    if (!cached) {
      cached = { value: factory() };
    }
    return cached.value;
  };

  return Object.assign(getter, {
    reset(): void {
      cached = undefined;
    },
    peek(): T | undefined {
      return cached?.value;
    },
  });
}

/** A memoized getter for an asynchronously-constructed lazy singleton. */
export type AsyncLazyGetter<T> = (() => Promise<T>) & {
  /** Drop the cached value/in-flight promise so the next call rebuilds it. */
  reset(): void;
  /** Return the resolved cached value without constructing it, else `undefined`. */
  peek(): T | undefined;
};

/**
 * Async lazy singleton. Concurrent callers before resolution share the same
 * in-flight promise (the factory runs once). On resolution the value is cached
 * and returned directly on later calls.
 *
 * A REJECTED promise is never cached: the cache is cleared so the next caller
 * retries instead of permanently poisoning every consumer.
 *
 * The `reset` callback passed to `factory` is generation-guarded: it only
 * invalidates the cache while it still belongs to the current generation. A
 * stale `reset` (from a superseded factory invocation) is a no-op, so a
 * delayed event from an old instance can't clobber a freshly-rebuilt one. Use
 * it to wire terminal-event invalidation, e.g. `client.on('end', reset)`.
 *
 * @param factory - Async builder; receives a generation-guarded `reset`.
 * @returns A getter that connects-once-then-caches, plus `reset()` / `peek()`.
 * @template T - The type of the lazily-constructed value.
 */
export function lazyAsync<T>(
  factory: (reset: () => void) => Promise<T>,
): AsyncLazyGetter<T> {
  let value: { value: T } | undefined;
  let promise: Promise<T> | undefined;
  // Monotonic token identifying the current build; a `reset` bound to an older
  // token is ignored so stale invalidations can't clear a newer instance.
  let generation = 0;

  const clear = (): void => {
    value = undefined;
    promise = undefined;
  };

  const getter = (): Promise<T> => {
    if (value) return Promise.resolve(value.value);
    if (promise) return promise;

    const myGeneration = ++generation;
    const resetThisGeneration = (): void => {
      if (myGeneration === generation) clear();
    };

    promise = factory(resetThisGeneration)
      .then((resolved) => {
        // Only cache if this build is still current (not reset mid-flight).
        if (myGeneration === generation) {
          value = { value: resolved };
        }
        return resolved;
      })
      .catch((err) => {
        // Never cache a rejected connection: clear so the next call retries.
        if (myGeneration === generation) clear();
        throw err;
      });

    return promise;
  };

  return Object.assign(getter, {
    reset(): void {
      generation++;
      clear();
    },
    peek(): T | undefined {
      return value?.value;
    },
  });
}
