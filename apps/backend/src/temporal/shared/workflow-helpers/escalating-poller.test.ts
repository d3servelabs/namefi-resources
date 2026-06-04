import type { Duration } from '@temporalio/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PollPhase } from './escalating-poller';

const sleepCalls: number[] = [];

const workflowMocks = {
  defineSignal: vi.fn((name: string) => name),
  defineQuery: vi.fn((name: string) => name),
  setHandler: vi.fn(),
  condition: vi.fn(),
  sleep: vi.fn(async (ms: number) => {
    sleepCalls.push(ms);
  }),
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  ApplicationFailure: class ApplicationFailure extends Error {
    type?: string;
    nonRetryable?: boolean;
    static create({
      message,
      type,
      nonRetryable,
    }: {
      message?: string;
      type?: string;
      nonRetryable?: boolean;
    }) {
      const failure = new ApplicationFailure(message);
      failure.type = type;
      failure.nonRetryable = nonRetryable;
      return failure;
    }
  },
};

vi.mock('@temporalio/workflow', () => workflowMocks);

const { durationToMs, pickPhase, escalatingPoll, PollInterrupted } =
  await import('./escalating-poller');

describe('durationToMs', () => {
  it('passes numbers through unchanged (ms)', () => {
    expect(durationToMs(0)).toBe(0);
    expect(durationToMs(1500)).toBe(1500);
  });

  it('parses the common string units', () => {
    expect(durationToMs('250ms')).toBe(250);
    expect(durationToMs('10 seconds')).toBe(10_000);
    expect(durationToMs('1 minute')).toBe(60_000);
    expect(durationToMs('2h')).toBe(2 * 3_600_000);
    expect(durationToMs('1 day')).toBe(86_400_000);
  });

  it('supports abbreviations and fractional values', () => {
    expect(durationToMs('30s')).toBe(30_000);
    expect(durationToMs('5 min')).toBe(5 * 60_000);
    expect(durationToMs('1.5 hours')).toBe(1.5 * 3_600_000);
  });

  it('throws on unsupported formats', () => {
    expect(() => durationToMs('soon' as unknown as Duration)).toThrow(
      /unsupported Duration/,
    );
    expect(() => durationToMs('10 fortnights' as unknown as Duration)).toThrow(
      /unsupported Duration/,
    );
  });
});

describe('pickPhase', () => {
  const schedule: PollPhase[] = [
    { interval: '10 seconds', untilElapsedMs: 30_000 },
    { interval: '1 minute', untilElapsedMs: 120_000 },
    { interval: '5 minutes', untilElapsedMs: Number.POSITIVE_INFINITY },
  ];

  it('selects the first phase whose boundary has not been crossed', () => {
    expect(pickPhase(schedule, 0).interval).toBe('10 seconds');
    expect(pickPhase(schedule, 29_999).interval).toBe('10 seconds');
    expect(pickPhase(schedule, 30_000).interval).toBe('1 minute');
    expect(pickPhase(schedule, 119_999).interval).toBe('1 minute');
    expect(pickPhase(schedule, 120_000).interval).toBe('5 minutes');
  });

  it('saturates at the last phase past every boundary', () => {
    expect(pickPhase(schedule, 10_000_000).interval).toBe('5 minutes');
  });
});

describe('escalatingPoll', () => {
  beforeEach(() => {
    sleepCalls.length = 0;
  });

  it('returns the first ready result and sleeps on the short cadence', async () => {
    let attempts = 0;
    const result = await escalatingPoll<{ ready: true }>({
      schedule: [{ interval: '10 seconds', untilElapsedMs: 30_000 }],
      overallTimeoutMs: 300_000,
      poll: async () => {
        attempts++;
        return attempts >= 3 ? { ready: true } : null;
      },
    });

    expect(result).toEqual({ ready: true });
    expect(attempts).toBe(3);
    // Two inter-poll sleeps before the third (ready) poll.
    expect(sleepCalls).toEqual([10_000, 10_000]);
  });

  it('escalates short to long and caps the final sleep at the deadline', async () => {
    const schedule: PollPhase[] = [
      { interval: '10 seconds', untilElapsedMs: 30_000 },
      { interval: '1 minute', untilElapsedMs: 120_000 },
      { interval: '5 minutes', untilElapsedMs: Number.POSITIVE_INFINITY },
    ];

    await expect(
      escalatingPoll({
        label: 'never-ready',
        schedule,
        overallTimeoutMs: 300_000,
        poll: async () => null,
      }),
    ).rejects.toMatchObject({ type: 'polling/timeout' });

    expect(sleepCalls).toEqual([
      10_000, // 0 -> 10s
      10_000, // 10s -> 20s
      10_000, // 20s -> 30s
      60_000, // 30s -> 90s
      60_000, // 90s -> 150s
      150_000, // 150s -> 300s (capped at the remaining time to the deadline)
    ]);
  });

  it('returns the sentinel instead of throwing when configured', async () => {
    const sentinel = { ready: true } as const;
    const result = await escalatingPoll<{ ready: true }>({
      schedule: [{ interval: '1 minute', untilElapsedMs: 60_000 }],
      overallTimeoutMs: 60_000,
      onTimeout: { kind: 'return', value: sentinel },
      poll: async () => null,
    });

    expect(result).toBe(sentinel);
  });

  it('throws PollInterrupted when the interrupt hook fires', async () => {
    let interrupted = false;
    let attempts = 0;
    // condition resolves immediately so the inter-poll sleep race ends fast.
    workflowMocks.condition.mockResolvedValue(true);

    await expect(
      escalatingPoll({
        label: 'interruptible',
        schedule: [{ interval: '10 seconds', untilElapsedMs: 30_000 }],
        overallTimeoutMs: 300_000,
        interrupt: () => interrupted,
        poll: async () => {
          attempts++;
          // Flip the interrupt after the first not-ready poll.
          if (attempts >= 1) interrupted = true;
          return null;
        },
      }),
    ).rejects.toBeInstanceOf(PollInterrupted);
  });

  it('rejects an empty schedule', async () => {
    await expect(
      escalatingPoll({
        schedule: [],
        overallTimeoutMs: 1_000,
        poll: async () => null,
      }),
    ).rejects.toThrow(/at least one phase/);
  });
});
