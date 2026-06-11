import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Hash } from 'viem';
import type { TxConfirmationResult } from '../../activities/shared/eth-tx-primitives';
import type {
  SendAndConfirmTxInput,
  SendAndConfirmTxResult,
} from '../../workflows/send-and-confirm-tx.workflow';
import type {
  StaggeredRaceConfig,
  StaggeredRaceRecovery,
} from './staggered-send-race';

const workflowMocks = {
  sleep: vi.fn(async () => undefined),
  // Never resolves on its own: the watchdog stays dormant, the fast-path race
  // resolves via Promise.all(pending), and interruptibleSleep falls through to
  // the (immediate) mocked sleep.
  condition: vi.fn(() => new Promise<void>(() => {})),
  setCurrentDetails: vi.fn(),
  workflowInfo: () => ({ workflowId: 'parent-wf', workflowType: 'mintNfsc' }),
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

const getSignerNonce = vi.fn(async () => 100);
const getX402SignerNonce = vi.fn(async () => 100);
const getTransactionConfirmation = vi.fn(
  async (): Promise<TxConfirmationResult> => ({ kind: 'PENDING' }),
);
const getX402TransactionConfirmation = vi.fn(
  async (): Promise<TxConfirmationResult> => ({ kind: 'PENDING' }),
);
const generalAlertNamefi = vi.fn(async () => undefined);
const criticalAlertWithTicket = vi.fn(async () => ({
  taskId: 't',
  taskUrl: 'u',
}));

type ChildHandle = { result: () => Promise<SendAndConfirmTxResult> };
const startChild = vi.fn(
  async (..._args: unknown[]): Promise<ChildHandle> => makeHandle(timedOut()),
);

vi.mock('@temporalio/workflow', () => workflowMocks);
vi.mock('./typed-proxy-activities', () => ({
  typedProxyActivities: () => ({
    getSignerNonce,
    getX402SignerNonce,
    getTransactionConfirmation,
    getX402TransactionConfirmation,
    generalAlertNamefi,
  }),
}));
vi.mock('./typed-child-workflow', () => ({
  typedChildWorkflow: () => ({ startChild }),
}));
vi.mock('./critical-alert-with-ticket', () => ({ criticalAlertWithTicket }));

const { staggeredSendRace } = await import('./staggered-send-race');

const CHAIN_ID = 8453;
const NONCE = 100;

function makeHandle(result: SendAndConfirmTxResult): ChildHandle {
  return { result: () => Promise.resolve(result) };
}

/** Drive the children: map each attempt's input to a scripted result. */
function scriptChildren(
  fn: (input: SendAndConfirmTxInput) => SendAndConfirmTxResult,
) {
  startChild.mockImplementation(async (...callArgs: unknown[]) => {
    const input = (callArgs[1] as [SendAndConfirmTxInput])[0];
    return makeHandle(fn(input));
  });
}

const confirmed = (
  txHash: string,
  attempt = 0,
  nonce = NONCE,
): SendAndConfirmTxResult => ({
  status: 'CONFIRMED',
  txHash: txHash as Hash,
  blockNumber: '1',
  nonce,
  attempt,
});
const lost = (
  txHash: string,
  attempt = 0,
  onChainNonce = NONCE + 1,
  nonce = NONCE,
): SendAndConfirmTxResult => ({
  status: 'LOST',
  txHash: txHash as Hash,
  onChainNonce,
  nonce,
  attempt,
});
const reverted = (txHash: string, attempt = 0): SendAndConfirmTxResult => ({
  status: 'REVERTED',
  txHash: txHash as Hash,
  blockNumber: '1',
  nonce: NONCE,
  attempt,
});
const timedOut = (attempt = 0): SendAndConfirmTxResult => ({
  status: 'PENDING_TIMEOUT',
  txHash: `0xpending${attempt}` as Hash,
  nonce: NONCE,
  attempt,
});
const notSent = (benign: boolean, attempt = 0): SendAndConfirmTxResult => ({
  status: 'NOT_SENT',
  sendStatus: benign ? 'NONCE_EXPIRED' : 'FAILED_TO_SEND_TRANSACTION',
  benign,
  nonce: NONCE,
  attempt,
});

function run(
  config: Partial<StaggeredRaceConfig> = {},
  recovery?: StaggeredRaceRecovery,
  signerKind: 'mint' | 'x402' = 'mint',
) {
  return staggeredSendRace({
    preparedTx: {} as never,
    chainId: CHAIN_ID,
    label: 'test',
    signerKind,
    config: {
      lanes: 5,
      staggerMs: 1,
      pollIntervalMs: 1,
      alertThresholdMs: 1_000_000,
      failThresholdMs: 1_000_000,
      initialGasPriceMultiplier: 1,
      maxGasPriceMultiplier: 2,
      ...config,
    },
    recovery,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSignerNonce.mockResolvedValue(100);
  getX402SignerNonce.mockResolvedValue(100);
  getTransactionConfirmation.mockResolvedValue({ kind: 'PENDING' });
  getX402TransactionConfirmation.mockResolvedValue({ kind: 'PENDING' });
  generalAlertNamefi.mockResolvedValue(undefined);
  criticalAlertWithTicket.mockResolvedValue({ taskId: 't', taskUrl: 'u' });
  startChild.mockImplementation(async (...callArgs: unknown[]) => {
    const input = (callArgs[1] as [SendAndConfirmTxInput])[0];
    return makeHandle(timedOut(input.attempt));
  });
});

describe('staggeredSendRace (child orchestrator)', () => {
  it('returns the confirmed winner and pins the nonce once', async () => {
    scriptChildren((i) => confirmed(`0xwin${i.attempt}`));
    const winner = await run();
    expect(winner).toBe('0xwin0');
    expect(getSignerNonce).toHaveBeenCalledTimes(1);
    expect(criticalAlertWithTicket).not.toHaveBeenCalled();
  });

  it('starts every attempt at the pinned nonce with escalating, capped gas', async () => {
    // PENDING_TIMEOUT never consumes the nonce, so all lanes launch.
    scriptChildren((i) => timedOut(i.attempt));
    await expect(run()).rejects.toMatchObject({
      type: 'staggered-race/timeout',
    });
    const inputs = startChild.mock.calls.map(
      (c) => (c[1] as [SendAndConfirmTxInput])[0],
    );
    expect(inputs).toHaveLength(5);
    expect(inputs.map((i) => i.gasPriceMultiplier)).toEqual(
      Array.from({ length: 5 }, (_, i) => Math.min(1 + i * 0.05, 2)),
    );
    expect(inputs.every((i) => i.nonce === NONCE)).toBe(true);
    expect(getSignerNonce).toHaveBeenCalledTimes(1);
  });

  it('throws (and critical-alerts) on a reverted child', async () => {
    scriptChildren(() => reverted('0xrev'));
    await expect(run()).rejects.toMatchObject({
      type: 'staggered-race/reverted',
    });
    expect(criticalAlertWithTicket).toHaveBeenCalledTimes(1);
  });

  it('throws nonce-stolen when all children LOST and no re-pin budget', async () => {
    scriptChildren((i) => lost('0xlost', i.attempt));
    await expect(run({}, { maxNonceRepins: 0 })).rejects.toMatchObject({
      type: 'staggered-race/nonce-stolen',
    });
    expect(criticalAlertWithTicket).toHaveBeenCalledTimes(1);
  });

  it('CONFIRMED dominates a sibling PENDING_TIMEOUT (never re-pins, hole #1)', async () => {
    // attempt 0 stays pending (does not consume the nonce), so attempt 1 launches
    // and confirms; the confirmed winner must win over the pending terminal.
    scriptChildren((i) =>
      i.attempt === 0 ? timedOut(0) : confirmed('0xwin', i.attempt),
    );
    const winner = await run({}, { maxNonceRepins: 2 });
    expect(winner).toBe('0xwin');
    expect(getSignerNonce).toHaveBeenCalledTimes(1);
    expect(criticalAlertWithTicket).not.toHaveBeenCalled();
  });

  it('PENDING_TIMEOUT is terminal — does not re-pin even alongside a LOST', async () => {
    scriptChildren((i) =>
      i.attempt === 0 ? timedOut(0) : lost('0xlost', i.attempt),
    );
    await expect(run({}, { maxNonceRepins: 5 })).rejects.toMatchObject({
      type: 'staggered-race/timeout',
    });
    expect(getSignerNonce).toHaveBeenCalledTimes(1); // never re-pinned
  });

  it('re-pins a fresh nonce after a LOST round, then confirms', async () => {
    let nonceCall = 0;
    getSignerNonce.mockImplementation(async () => 100 + nonceCall++);
    scriptChildren((i) =>
      i.roundIndex === 0
        ? lost('0xr0', i.attempt, 101)
        : confirmed('0xr1', i.attempt, 101),
    );
    const winner = await run({}, { maxNonceRepins: 2 });
    expect(winner).toBe('0xr1');
    expect(getSignerNonce.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('reconciles a cross-round double-commit via onDoubleCommit', async () => {
    let nonceCall = 0;
    getSignerNonce.mockImplementation(async () => 100 + nonceCall++);
    scriptChildren((i) =>
      i.roundIndex === 0
        ? lost('0xr0', i.attempt, 101)
        : confirmed('0xr1', i.attempt, 101),
    );
    // The cross-round re-confirm finds two mined hashes.
    getTransactionConfirmation.mockResolvedValue({
      kind: 'MULTIPLE_CONFIRMED',
      winners: ['0xr0' as Hash, '0xr1' as Hash],
    });
    const onDoubleCommit = vi.fn(async (winners: Hash[]) => winners[0]);
    const winner = await run({}, { maxNonceRepins: 2, onDoubleCommit });
    expect(onDoubleCommit).toHaveBeenCalledWith(['0xr0', '0xr1']);
    expect(winner).toBe('0xr0');
  });

  it('zero-candidate with an advanced nonce re-pins, then confirms', async () => {
    const nonces = [100, 150, 151]; // pin r0, zero-candidate re-read, pin r1
    let n = 0;
    getSignerNonce.mockImplementation(
      async () => nonces[Math.min(n++, nonces.length - 1)],
    );
    scriptChildren((i) =>
      i.roundIndex === 0
        ? notSent(true, i.attempt)
        : confirmed('0xr1', i.attempt, 151),
    );
    const winner = await run({}, { maxNonceRepins: 2 });
    expect(winner).toBe('0xr1');
  });

  it('zero-candidate with an unchanged nonce is a terminal send failure', async () => {
    getSignerNonce.mockResolvedValue(100); // pin AND re-read both 100
    scriptChildren((i) => notSent(true, i.attempt));
    await expect(run({}, { maxNonceRepins: 2 })).rejects.toMatchObject({
      type: 'staggered-race/send-failed',
    });
    expect(criticalAlertWithTicket).toHaveBeenCalledTimes(1);
  });

  it("signerKind 'x402' routes the nonce read to the x402 signer", async () => {
    scriptChildren((i) => confirmed('0xx402', i.attempt));
    const winner = await run({}, undefined, 'x402');
    expect(winner).toBe('0xx402');
    expect(getX402SignerNonce).toHaveBeenCalled();
    expect(getSignerNonce).not.toHaveBeenCalled();
    const input = (startChild.mock.calls[0][1] as [SendAndConfirmTxInput])[0];
    expect(input.signerKind).toBe('x402');
  });

  it('a startChild failure terminates the race (does not hang) and critical-alerts', async () => {
    // A child workflowId collision — or any startChild rejection — must surface
    // as a terminal race failure, not stall. The runRound try/finally also
    // releases the slow-confirmation watchdog (roundDone) on this throw path.
    startChild.mockImplementationOnce(async () => {
      throw new Error('WorkflowExecutionAlreadyStarted');
    });
    await expect(run({}, { maxNonceRepins: 2 })).rejects.toMatchObject({
      type: 'staggered-race/failed',
    });
    expect(criticalAlertWithTicket).toHaveBeenCalledTimes(1);
    expect(generalAlertNamefi).not.toHaveBeenCalled();
  });
});
