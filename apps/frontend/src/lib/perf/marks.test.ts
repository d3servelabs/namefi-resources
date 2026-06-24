import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Isolate the recorder from the Datadog sink; emit()'s unconditional
// performance.measure() call is what we count to detect (de)duplication.
vi.mock('@/lib/datadog/logs', () => ({ logDatadogPerf: vi.fn() }));

import { recordPerfNow, recordPerfOnce, startPerfSpan } from './marks';

let measure: ReturnType<typeof vi.fn>;
let nowValue: number;

beforeEach(() => {
  measure = vi.fn();
  nowValue = 100;
  (globalThis as unknown as { window: unknown }).window = {};
  (globalThis as unknown as { performance: unknown }).performance = {
    now: () => nowValue,
    mark: vi.fn(),
    measure,
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  (globalThis as unknown as { window?: unknown }).window = undefined;
  (globalThis as unknown as { performance?: unknown }).performance = undefined;
});

// The once-guard is module-level state that persists for the whole file, so each
// test below uses a DISTINCT metric name to avoid cross-test interference.
describe('recordPerfOnce', () => {
  it('emits a given metric at most once per page load, across repeated calls', () => {
    expect(recordPerfOnce('once.alpha')).toBe(100);
    nowValue = 80_000; // simulate a much-later remount re-firing the effect
    expect(recordPerfOnce('once.alpha')).toBeUndefined();
    expect(recordPerfOnce('once.alpha')).toBeUndefined();

    // Only the first (real) measurement is recorded; the inflated repeats drop.
    expect(measure).toHaveBeenCalledTimes(1);
  });

  it('tracks distinct metrics independently', () => {
    recordPerfOnce('once.beta');
    recordPerfOnce('once.gamma');
    expect(measure).toHaveBeenCalledTimes(2);
  });
});

describe('recordPerfNow', () => {
  it('emits on every call (no once-guard) — for non-load metrics', () => {
    recordPerfNow('now.repeat');
    recordPerfNow('now.repeat');
    expect(measure).toHaveBeenCalledTimes(2);
  });
});

describe('recorder is no-op without a browser environment', () => {
  it('returns undefined when window is absent', () => {
    (globalThis as unknown as { window?: unknown }).window = undefined;
    startPerfSpan('signin:1');
    expect(recordPerfNow('ssr.metric')).toBeUndefined();
    expect(measure).not.toHaveBeenCalled();
  });
});
