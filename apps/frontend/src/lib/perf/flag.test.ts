import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// flag.ts reads `config.PERF_SAMPLE_RATE`; mock the env module so each test can
// drive a specific rate without going through env parsing.
const { mockConfig } = vi.hoisted(() => ({
  mockConfig: { PERF_SAMPLE_RATE: 0 },
}));
vi.mock('@/lib/env', () => ({ config: mockConfig }));

import {
  getPerfFlagFromStorage,
  isPerfConsoleEnabled,
  isPerfSessionSampled,
  PERF_SAMPLED_SESSION_KEY,
  setPerfFlagInStorage,
} from './flag';

function makeStore() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    raw: map,
  };
}

let localStore: ReturnType<typeof makeStore>;
let sessionStore: ReturnType<typeof makeStore>;

beforeEach(() => {
  localStore = makeStore();
  sessionStore = makeStore();
  // Minimal window stub: flag.ts only touches local/sessionStorage.
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: localStore,
    sessionStorage: sessionStore,
  };
  mockConfig.PERF_SAMPLE_RATE = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
  (globalThis as unknown as { window?: unknown }).window = undefined;
});

describe('perf teammate flag', () => {
  it('reflects the persisted localStorage flag', () => {
    expect(getPerfFlagFromStorage()).toBe(false);
    expect(isPerfConsoleEnabled()).toBe(false);

    setPerfFlagInStorage(true);
    expect(getPerfFlagFromStorage()).toBe(true);
    expect(isPerfConsoleEnabled()).toBe(true);
  });

  it('clears the flag and re-arms sampling when disabled', () => {
    setPerfFlagInStorage(true);
    // Force-flag caches a sampled session as a side effect of being on.
    sessionStore.setItem(PERF_SAMPLED_SESSION_KEY, '1');

    setPerfFlagInStorage(false);
    expect(getPerfFlagFromStorage()).toBe(false);
    // The cached sample decision is dropped so the next session re-rolls.
    expect(sessionStore.getItem(PERF_SAMPLED_SESSION_KEY)).toBeNull();
  });
});

describe('isPerfSessionSampled', () => {
  it('forces sampling on when the teammate flag is set, regardless of rate', () => {
    mockConfig.PERF_SAMPLE_RATE = 0;
    setPerfFlagInStorage(true);
    expect(isPerfSessionSampled()).toBe(true);
  });

  it('never samples at rate 0 and caches the negative decision', () => {
    mockConfig.PERF_SAMPLE_RATE = 0;
    expect(isPerfSessionSampled()).toBe(false);
    expect(sessionStore.getItem(PERF_SAMPLED_SESSION_KEY)).toBe('0');
  });

  it('always samples at rate 100 and caches the positive decision', () => {
    mockConfig.PERF_SAMPLE_RATE = 100;
    expect(isPerfSessionSampled()).toBe(true);
    expect(sessionStore.getItem(PERF_SAMPLED_SESSION_KEY)).toBe('1');
  });

  it('keeps the decision stable for the session once rolled', () => {
    mockConfig.PERF_SAMPLE_RATE = 100;
    expect(isPerfSessionSampled()).toBe(true);

    // Rate change mid-session must not flip an already-rolled session.
    mockConfig.PERF_SAMPLE_RATE = 0;
    expect(isPerfSessionSampled()).toBe(true);
  });

  it('rolls against the rate boundary (rate=50)', () => {
    mockConfig.PERF_SAMPLE_RATE = 50;
    const random = vi.spyOn(Math, 'random');

    random.mockReturnValueOnce(0.49); // 49 < 50 -> sampled
    expect(isPerfSessionSampled()).toBe(true);

    sessionStore.removeItem(PERF_SAMPLED_SESSION_KEY);
    random.mockReturnValueOnce(0.5); // 50 < 50 is false -> not sampled
    expect(isPerfSessionSampled()).toBe(false);
  });
});
