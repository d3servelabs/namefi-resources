import { describe, expect, it, vi } from 'vitest';
import { lazy, lazyAsync } from '../lazy';

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
