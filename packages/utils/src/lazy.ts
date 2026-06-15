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

/**
 * Like {@link lazy}, but a runtime flag decides whether construction is
 * deferred or happens immediately. When `isLazy` is `true` the value is built
 * on first access (pure lazy); when `false` it is constructed eagerly, right
 * now, before this call returns. Either way the same {@link LazyGetter} is
 * returned, so call sites stay identical regardless of the mode.
 *
 * Useful when a config/env flag should control eager-vs-lazy init — e.g. eager
 * in long-lived servers (fail fast, warm on boot) but lazy in CLIs/tests.
 *
 * @param isLazy - `true` to defer to first access; `false` to construct now.
 * @param factory - Builder for the value.
 * @returns A getter; already primed when `isLazy` is `false`.
 * @template T - The type of the constructed value.
 */
export function conditionalLazy<T>(
  isLazy: boolean,
  factory: () => T,
): LazyGetter<T> {
  const getter = lazy(factory);
  if (!isLazy) {
    // Construct now so the cost is paid eagerly and errors surface immediately.
    getter();
  }
  return getter;
}

/** Options for {@link deferredLazy}. */
export interface DeferredLazyOptions {
  /**
   * Delay in ms before the value is primed in the background. Default `0` —
   * the next macrotask, i.e. after the current synchronous startup work
   * (module evaluation, bootstrap) has finished.
   */
  delayMs?: number;
  /**
   * Custom scheduler for the priming callback. Defaults to an unref'd
   * `setTimeout`, so priming never keeps the process alive on its own.
   * Primarily a seam for deterministic tests.
   */
  schedule?: (prime: () => void) => void;
}

/**
 * A "deferred" lazy singleton: not constructed at import/startup, but primed
 * automatically a tick later so the value is warm before it is actually
 * needed — without blocking boot. If something accesses the getter before the
 * scheduled priming fires, it constructs synchronously on demand (falling back
 * to plain {@link lazy} behavior); the scheduled prime then becomes a no-op
 * because the value is already cached.
 *
 * Priming is best-effort: a throw during background priming is swallowed (it
 * is not cached either, per {@link lazy}), so the next real access re-runs the
 * factory and surfaces the error rather than crashing a timer callback.
 *
 * @param factory - Builder for the value.
 * @param options - Priming delay / scheduler — see {@link DeferredLazyOptions}.
 * @returns A getter, scheduled to prime shortly after startup.
 * @template T - The type of the constructed value.
 */
export function deferredLazy<T>(
  factory: () => T,
  options?: DeferredLazyOptions,
): LazyGetter<T> {
  const getter = lazy(factory);

  const prime = (): void => {
    try {
      getter();
    } catch {
      // Best-effort: lazy() does not cache a thrown factory, so the next
      // on-demand access will re-attempt and propagate the real error.
    }
  };

  const schedule =
    options?.schedule ??
    ((run: () => void) => {
      const timer = setTimeout(run, options?.delayMs ?? 0);
      // Don't let background priming hold the event loop open by itself.
      (timer as { unref?: () => void }).unref?.();
    });

  schedule(prime);
  return getter;
}
