import { beforeEach, describe, expect, it, vi } from 'vitest';

const sleepCalls: Array<[unknown, unknown]> = [];

const workflowMocks = {
  sleep: vi.fn(async (ms: unknown, opts?: unknown) => {
    sleepCalls.push([ms, opts]);
  }),
  // Never resolves on its own; the sleep is what ends the race in these tests.
  condition: vi.fn(() => new Promise<void>(() => {})),
};

vi.mock('@temporalio/workflow', () => workflowMocks);

const { interruptibleSleep } = await import('./interruptible-sleep');

beforeEach(() => {
  vi.clearAllMocks();
  sleepCalls.length = 0;
});

describe('interruptibleSleep', () => {
  it('short-circuits without scheduling a timer when already interrupted', async () => {
    await interruptibleSleep(5_000, () => true);
    expect(workflowMocks.sleep).not.toHaveBeenCalled();
    expect(workflowMocks.condition).not.toHaveBeenCalled();
  });

  it('resolves via the sleep when the interrupt stays false', async () => {
    await interruptibleSleep(5_000, () => false);
    expect(sleepCalls).toEqual([[5_000, undefined]]);
  });

  it('forwards a summary onto the timer', async () => {
    await interruptibleSleep(5_000, () => false, { summary: 'stagger' });
    expect(sleepCalls).toEqual([[5_000, { summary: 'stagger' }]]);
  });
});
