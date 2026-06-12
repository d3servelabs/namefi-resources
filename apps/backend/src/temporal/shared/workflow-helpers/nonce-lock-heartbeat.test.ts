import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NonceLockToken } from '../../activities/default/nonce-lock.activities';

const workflowMocks = {
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  workflowInfo: () => ({ workflowId: 'wf', runId: 'run' }),
};
const interruptibleSleep = vi.fn(async () => undefined);
const extendNonceLock = vi.fn(async () => true);
const generalAlertNamefi = vi.fn(async () => undefined);

vi.mock('@temporalio/workflow', () => workflowMocks);
vi.mock('./interruptible-sleep', () => ({ interruptibleSleep }));
vi.mock('./typed-proxy-activities', () => ({
  typedProxyActivities: () => ({ extendNonceLock, generalAlertNamefi }),
}));

const { runNonceLockHeartbeat } = await import('./nonce-lock-heartbeat');

const TOKEN: NonceLockToken = {
  handle: { id: 'i', key: 'k', value: 'v', acquiredAt: 0, ttl: 90_000 },
  absoluteDeadlineMs: 0,
};

function run(over: Partial<Parameters<typeof runNonceLockHeartbeat>[0]> = {}) {
  return runNonceLockHeartbeat({
    token: TOKEN,
    lockTtlMs: 90_000,
    intervalMs: 10,
    absoluteMaxMs: 25, // → ~2 extends before the workflow-side cap
    isDone: () => false,
    label: 'test',
    ...over,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  interruptibleSleep.mockResolvedValue(undefined);
  extendNonceLock.mockResolvedValue(true);
  generalAlertNamefi.mockResolvedValue(undefined);
});

describe('runNonceLockHeartbeat', () => {
  it('extends repeatedly until the workflow-side absolute cap is reached', async () => {
    await run(); // interval 10, cap 25 → checked at 0,10,20 (<25) → 3 extends, 30 stops
    expect(extendNonceLock).toHaveBeenCalledTimes(3);
    expect(extendNonceLock).toHaveBeenCalledWith({
      token: TOKEN,
      ttlMs: 90_000,
    });
    expect(workflowMocks.log.error).toHaveBeenCalledTimes(1); // "absolute cap reached"
    expect(generalAlertNamefi).toHaveBeenCalledTimes(1); // one terminal escalation
  });

  it('stops promptly once isDone flips', async () => {
    let done = false;
    extendNonceLock.mockImplementation(async () => {
      done = true;
      return true;
    });
    await run({ isDone: () => done, absoluteMaxMs: 10_000 });
    expect(extendNonceLock).toHaveBeenCalledTimes(1);
    expect(workflowMocks.log.error).not.toHaveBeenCalled();
    expect(generalAlertNamefi).not.toHaveBeenCalled(); // clean stop ⇒ no alert
  });

  it('alerts and returns when extend reports the lock lost (false)', async () => {
    extendNonceLock.mockResolvedValue(false);
    await run({ absoluteMaxMs: 10_000 });
    expect(extendNonceLock).toHaveBeenCalledTimes(1);
    expect(workflowMocks.log.error).toHaveBeenCalledTimes(1);
    expect(generalAlertNamefi).toHaveBeenCalledTimes(1); // terminal: lock lost
  });

  it('CONTINUES through a transient extend failure (does not stop after one undefined)', async () => {
    // extend always rejects → held === undefined every beat; with a large
    // lockTtlMs the lapse-guard never trips, so it keeps trying to the cap.
    extendNonceLock.mockRejectedValue(new Error('redis blip'));
    await run({ lockTtlMs: 90_000, absoluteMaxMs: 25 });
    expect(extendNonceLock).toHaveBeenCalledTimes(3); // not 1 — transient ≠ stop
    expect(workflowMocks.log.error).toHaveBeenCalledTimes(1); // "absolute cap reached"
    // Each transient beat is logged at debug, NOT alerted — only the terminal cap
    // escalates. So a Redis blip does NOT fan out one alert per beat.
    expect(generalAlertNamefi).toHaveBeenCalledTimes(1);
    expect(workflowMocks.log.debug).toHaveBeenCalledTimes(3); // one per transient beat
  });

  it('stops once transient extend failures span the rolling TTL (lock may have lapsed)', async () => {
    extendNonceLock.mockRejectedValue(new Error('redis blip'));
    // lockTtlMs 30, interval 10 → lapse-guard trips when gap >= 30-10 = 20:
    // elapsed 10 (gap 10, continue), elapsed 20 (gap 20, stop).
    await run({ lockTtlMs: 30, intervalMs: 10, absoluteMaxMs: 10_000 });
    expect(extendNonceLock).toHaveBeenCalledTimes(2);
    expect(workflowMocks.log.error).toHaveBeenCalledTimes(1); // "may have lapsed"
    expect(generalAlertNamefi).toHaveBeenCalledTimes(1); // terminal: likely lapsed
  });
});
