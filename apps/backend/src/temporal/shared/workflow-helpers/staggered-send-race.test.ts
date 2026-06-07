import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Hash } from 'viem';
import type {
  TxConfirmationResult,
  TxSendOnlyResult,
} from '../../activities/shared/eth-tx-primitives';
import type {
  StaggeredRaceActivities,
  StaggeredRaceConfig,
} from './staggered-send-race';

const sleepCalls: number[] = [];

const workflowMocks = {
  sleep: vi.fn(async (ms: number) => {
    sleepCalls.push(ms);
  }),
  // Never resolves; the interruptible stagger always wins via the instant sleep.
  condition: vi.fn(
    () =>
      new Promise<void>(() => {
        /* never resolves in tests */
      }),
  ),
  log: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
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

const generalAlertNamefi = vi.fn(async () => undefined);
const criticalAlertWithTicket = vi.fn(async () => ({
  taskId: 't',
  taskUrl: 'u',
}));

vi.mock('@temporalio/workflow', () => workflowMocks);
vi.mock('./typed-proxy-activities', () => ({
  typedProxyActivities: () => ({ generalAlertNamefi }),
}));
vi.mock('./critical-alert-with-ticket', () => ({ criticalAlertWithTicket }));

const { staggeredSendRace } = await import('./staggered-send-race');

const PINNED_NONCE = 42;
const CHAIN_ID = 8453;

const baseConfig: StaggeredRaceConfig = {
  lanes: 5,
  staggerMs: 1_000,
  pollIntervalMs: 1_000,
  alertThresholdMs: 1_000_000,
  failThresholdMs: 1_000_000,
  initialGasPriceMultiplier: 1.0,
  maxGasPriceMultiplier: 2,
};

function run(
  activities: StaggeredRaceActivities,
  config: Partial<StaggeredRaceConfig> = {},
) {
  return staggeredSendRace({
    preparedTx: {} as never,
    chainId: CHAIN_ID,
    label: 'test',
    activities,
    config: { ...baseConfig, ...config },
  });
}

function makeActivities(
  overrides: Partial<StaggeredRaceActivities> = {},
): StaggeredRaceActivities {
  return {
    getSignerNonce: vi.fn(async () => PINNED_NONCE),
    sendPreparedTransaction: vi.fn(
      async (): Promise<TxSendOnlyResult> => ({
        status: 'SENT',
        txHash: '0xsent' as Hash,
      }),
    ),
    getTransactionConfirmation: vi.fn(
      async (): Promise<TxConfirmationResult> => ({ kind: 'PENDING' }),
    ),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  sleepCalls.length = 0;
});

describe('staggeredSendRace', () => {
  it('returns the confirmed winner and pins the nonce exactly once', async () => {
    let sendIdx = 0;
    const activities = makeActivities({
      sendPreparedTransaction: vi.fn(
        async (): Promise<TxSendOnlyResult> => ({
          status: 'SENT',
          txHash: `0xtx${sendIdx++}` as Hash,
        }),
      ),
      getTransactionConfirmation: vi.fn(
        async (hashes: Hash[]): Promise<TxConfirmationResult> =>
          hashes.length > 0
            ? {
                kind: 'CONFIRMED',
                winner: hashes[0],
                blockNumber: '1',
                confirmations: 3,
              }
            : { kind: 'PENDING' },
      ),
    });

    const winner = await run(activities);

    expect(winner).toBe('0xtx0');
    expect(activities.getSignerNonce).toHaveBeenCalledTimes(1);
    // Every broadcast reused the single pinned nonce.
    for (const call of (
      activities.sendPreparedTransaction as ReturnType<typeof vi.fn>
    ).mock.calls) {
      expect(call[2]).toBe(PINNED_NONCE);
    }
    // Confirmation poll receives the pinned nonce and required confirmations.
    const firstConfirm = (
      activities.getTransactionConfirmation as ReturnType<typeof vi.fn>
    ).mock.calls[0];
    expect(firstConfirm[1]).toBe(CHAIN_ID);
    expect(firstConfirm[2]).toBe(PINNED_NONCE);
    expect(firstConfirm[3]).toBe(3);
  });

  it('broadcasts each lane with an escalating, capped gas multiplier', async () => {
    const send = vi.fn(
      async (
        _tx: unknown,
        _chainId: number,
        _nonce: number,
        gas: number,
      ): Promise<TxSendOnlyResult> => ({
        status: 'SENT',
        txHash: `0x${gas}` as Hash,
      }),
    );
    const activities = makeActivities({
      sendPreparedTransaction: send as never,
      // Confirm only once all 5 lanes have broadcast.
      getTransactionConfirmation: vi.fn(
        async (hashes: Hash[]): Promise<TxConfirmationResult> =>
          send.mock.calls.length >= 5
            ? {
                kind: 'CONFIRMED',
                winner: hashes[0],
                blockNumber: '1',
                confirmations: 3,
              }
            : { kind: 'PENDING' },
      ),
    });

    await run(activities);

    const gasArgs = send.mock.calls.map((c) => c[3]);
    const expected = Array.from({ length: 5 }, (_, i) =>
      Math.min(1.0 + i * 0.05, 2),
    );
    expect(gasArgs).toEqual(expected);
  });

  it('treats NONCE_EXPIRED / REPLACEMENT_UNDERPRICED lanes as benign', async () => {
    let callIdx = 0;
    const send = vi.fn(async (): Promise<TxSendOnlyResult> => {
      const idx = callIdx++;
      if (idx === 0) return { status: 'SENT', txHash: '0xwinner' as Hash };
      return idx % 2 === 0
        ? { status: 'REPLACEMENT_UNDERPRICED', error: 'x' }
        : { status: 'NONCE_EXPIRED', error: 'x' };
    });
    const activities = makeActivities({
      sendPreparedTransaction: send,
      getTransactionConfirmation: vi.fn(
        async (hashes: Hash[]): Promise<TxConfirmationResult> =>
          hashes.length > 0
            ? {
                kind: 'CONFIRMED',
                winner: hashes[0],
                blockNumber: '1',
                confirmations: 3,
              }
            : { kind: 'PENDING' },
      ),
    });

    await expect(run(activities)).resolves.toBe('0xwinner');
    expect(criticalAlertWithTicket).not.toHaveBeenCalled();
  });

  it('alerts and throws non-retryable on MULTIPLE_CONFIRMED', async () => {
    const activities = makeActivities({
      sendPreparedTransaction: vi.fn(
        async (): Promise<TxSendOnlyResult> => ({
          status: 'SENT',
          txHash: '0xa' as Hash,
        }),
      ),
      getTransactionConfirmation: vi.fn(
        async (): Promise<TxConfirmationResult> => ({
          kind: 'MULTIPLE_CONFIRMED',
          winners: ['0xa' as Hash, '0xb' as Hash],
        }),
      ),
    });

    await expect(run(activities)).rejects.toMatchObject({
      type: 'staggered-race/multi-confirm',
      nonRetryable: true,
    });
    expect(criticalAlertWithTicket).toHaveBeenCalledTimes(1);
  });

  it('alerts and throws on a reverted candidate', async () => {
    const activities = makeActivities({
      sendPreparedTransaction: vi.fn(
        async (): Promise<TxSendOnlyResult> => ({
          status: 'SENT',
          txHash: '0xa' as Hash,
        }),
      ),
      getTransactionConfirmation: vi.fn(
        async (): Promise<TxConfirmationResult> => ({
          kind: 'REVERTED',
          reverted: '0xa' as Hash,
          blockNumber: '7',
        }),
      ),
    });

    await expect(run(activities)).rejects.toMatchObject({
      type: 'staggered-race/reverted',
    });
    expect(criticalAlertWithTicket).toHaveBeenCalledTimes(1);
  });

  it('fails fast on a stolen nonce after the grace window, without runaway sends', async () => {
    const send = vi.fn(
      async (): Promise<TxSendOnlyResult> => ({
        status: 'SENT',
        txHash: '0xa' as Hash,
      }),
    );
    const activities = makeActivities({
      sendPreparedTransaction: send,
      getTransactionConfirmation: vi.fn(
        async (): Promise<TxConfirmationResult> => ({
          kind: 'NONCE_FILLED_NO_CANDIDATE',
          onChainNonce: 99,
        }),
      ),
    });

    await expect(run(activities, { graceCycles: 3 })).rejects.toMatchObject({
      type: 'staggered-race/nonce-stolen',
    });
    expect(criticalAlertWithTicket).toHaveBeenCalledTimes(1);
    // Never broadcasts more than the configured number of lanes.
    expect(send.mock.calls.length).toBeLessThanOrEqual(5);
  });

  it('alerts (soft then critical) and throws on overall timeout', async () => {
    const activities = makeActivities({
      sendPreparedTransaction: vi.fn(
        async (): Promise<TxSendOnlyResult> => ({
          status: 'SENT',
          txHash: '0xa' as Hash,
        }),
      ),
      getTransactionConfirmation: vi.fn(
        async (): Promise<TxConfirmationResult> => ({ kind: 'PENDING' }),
      ),
    });

    await expect(
      run(activities, {
        pollIntervalMs: 1_000,
        alertThresholdMs: 1_000,
        failThresholdMs: 3_000,
      }),
    ).rejects.toMatchObject({ type: 'staggered-race/timeout' });

    expect(generalAlertNamefi).toHaveBeenCalledTimes(1);
    expect(criticalAlertWithTicket).toHaveBeenCalledTimes(1);
  });
});
