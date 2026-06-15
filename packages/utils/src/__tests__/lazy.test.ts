import { afterEach, describe, expect, it, vi } from 'vitest';
import { conditionalLazy, deferredLazy, lazy, lazyAsync } from '../lazy';

describe('lazy', () => {
  it('constructs once and returns the same instance', () => {
    const factory = vi.fn(() => ({ id: 1 }));
    const getValue = lazy(factory);

    const a = getValue();
    const b = getValue();

    expect(a).toBe(b);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('peek returns undefined before first access', () => {
    const getValue = lazy(() => 42);

    expect(getValue.peek()).toBeUndefined();
    getValue();
    expect(getValue.peek()).toBe(42);
  });

  it('reset forces a rebuild on the next call', () => {
    const factory = vi.fn(() => ({}));
    const getValue = lazy(factory);

    const first = getValue();
    getValue.reset();
    const second = getValue();

    expect(first).not.toBe(second);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('caches falsy values without reconstructing', () => {
    const factory = vi.fn(() => 0);
    const getValue = lazy(factory);

    expect(getValue()).toBe(0);
    expect(getValue()).toBe(0);
    expect(factory).toHaveBeenCalledTimes(1);
  });
});

describe('lazyAsync', () => {
  it('shares one in-flight promise across concurrent callers', async () => {
    const factory = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve({ id: 1 }), 5)),
    );
    const getValue = lazyAsync(factory);

    const [a, b] = await Promise.all([getValue(), getValue()]);

    expect(a).toBe(b);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('caches the resolved value for later calls', async () => {
    const factory = vi.fn(async () => ({ id: 1 }));
    const getValue = lazyAsync(factory);

    const a = await getValue();
    const b = await getValue();

    expect(a).toBe(b);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(getValue.peek()).toBe(a);
  });

  it('does not cache a rejected promise; the next call retries', async () => {
    let attempt = 0;
    const factory = vi.fn(async () => {
      attempt += 1;
      if (attempt === 1) throw new Error('boom');
      return { id: attempt };
    });
    const getValue = lazyAsync(factory);

    await expect(getValue()).rejects.toThrow('boom');
    expect(getValue.peek()).toBeUndefined();

    const resolved = await getValue();
    expect(resolved).toEqual({ id: 2 });
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('reset invalidates the cached value', async () => {
    const factory = vi.fn(async () => ({}));
    const getValue = lazyAsync(factory);

    const first = await getValue();
    getValue.reset();
    const second = await getValue();

    expect(first).not.toBe(second);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('factory reset callback invalidates the cache it built', async () => {
    let captured: (() => void) | undefined;
    const factory = vi.fn(async (reset: () => void) => {
      captured = reset;
      return {};
    });
    const getValue = lazyAsync(factory);

    const first = await getValue();
    captured?.(); // simulate a terminal event clearing the singleton
    const second = await getValue();

    expect(first).not.toBe(second);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('generation-guards reset: a stale reset cannot clear a newer instance', async () => {
    let firstReset: (() => void) | undefined;
    const factory = vi.fn(async (reset: () => void) => {
      // Capture only the first generation's reset.
      firstReset ??= reset;
      return {};
    });
    const getValue = lazyAsync(factory);

    await getValue();
    getValue.reset(); // bumps generation, drops first instance
    const second = await getValue(); // builds second instance

    firstReset?.(); // stale: belongs to the dropped first generation -> no-op

    expect(getValue.peek()).toBe(second);
  });
});

describe('conditionalLazy', () => {
  it('defers construction to first access when isLazy is true', () => {
    const factory = vi.fn(() => ({}));
    const getValue = conditionalLazy(true, factory);

    expect(factory).not.toHaveBeenCalled();
    expect(getValue.peek()).toBeUndefined();

    const value = getValue();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(getValue()).toBe(value);
  });

  it('constructs eagerly (before returning) when isLazy is false', () => {
    const factory = vi.fn(() => ({}));
    const getValue = conditionalLazy(false, factory);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(getValue.peek()).toBeDefined();
    expect(getValue()).toBe(getValue.peek());
  });

  it('surfaces eager construction errors immediately when isLazy is false', () => {
    expect(() =>
      conditionalLazy(false, () => {
        throw new Error('boom');
      }),
    ).toThrow('boom');
  });
});

describe('deferredLazy', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not construct synchronously, but primes via the scheduler', () => {
    let scheduled: (() => void) | undefined;
    const factory = vi.fn(() => ({}));
    const getValue = deferredLazy(factory, {
      schedule: (prime) => {
        scheduled = prime;
      },
    });

    // Not built at creation time.
    expect(factory).not.toHaveBeenCalled();
    expect(getValue.peek()).toBeUndefined();

    // Priming fires later (here, manually) and warms the value.
    scheduled?.();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(getValue.peek()).toBeDefined();
  });

  it('constructs on demand if accessed before priming, then prime is a no-op', () => {
    let scheduled: (() => void) | undefined;
    const factory = vi.fn(() => ({}));
    const getValue = deferredLazy(factory, {
      schedule: (prime) => {
        scheduled = prime;
      },
    });

    const onDemand = getValue(); // accessed before the scheduled prime
    expect(factory).toHaveBeenCalledTimes(1);

    scheduled?.(); // prime: value already cached -> factory not called again
    expect(factory).toHaveBeenCalledTimes(1);
    expect(getValue()).toBe(onDemand);
  });

  it('swallows priming errors; the next access re-runs and surfaces them', () => {
    let scheduled: (() => void) | undefined;
    let attempt = 0;
    const factory = vi.fn(() => {
      attempt += 1;
      if (attempt === 1) throw new Error('cold-start boom');
      return { ok: true };
    });
    const getValue = deferredLazy(factory, {
      schedule: (prime) => {
        scheduled = prime;
      },
    });

    expect(() => scheduled?.()).not.toThrow(); // background prime must not throw
    expect(getValue.peek()).toBeUndefined(); // failed prime is not cached
    expect(getValue()).toEqual({ ok: true }); // on-demand retry succeeds
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('defaults to a setTimeout-based prime after the current sync work', () => {
    vi.useFakeTimers();
    const factory = vi.fn(() => ({}));
    const getValue = deferredLazy(factory);

    // Deferred past synchronous startup.
    expect(factory).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(getValue.peek()).toBeDefined();
  });
});
