import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Hash } from 'viem';
import type { NonceAlreadySentResult } from '../../activities/default/nonce-collision.activities';
import type { TxConfirmationResult } from '../../activities/shared/eth-tx-primitives';
import type {
  SendAndConfirmTxInput,
  SendAndConfirmTxResult,
} from '../../workflows/send-and-confirm-tx.workflow';
import type {
  StaggeredRaceConfig,
  StaggeredRaceRecovery,
} from './staggered-send-race';
// Mocked below; imported so tests can assert the heartbeat is started with the
// acquired lock token (the extend/refresh loop itself is unit-tested in
// nonce-lock-heartbeat.test.ts).
import { runNonceLockHeartbeat } from './nonce-lock-heartbeat';
import type {
  StuckPendingDecision,
  TxStuckPendingGateArgs,
} from './tx-stuck-pending-gate';

const marker = vi.fn(async () => undefined);
const workflowMocks = {
  sleep: vi.fn(async () => undefined),
  // The stage marker is a `marker` activity, proxied per call (summary per marker).
  proxyActivities: () => ({ marker }),
  // Never resolves on its own: the watchdog stays dormant, and the fast-path
  // `Promise.race([condition, Promise.all(pending)])` resolves via Promise.all.
  condition: vi.fn(() => new Promise<void>(() => {})),
  setCurrentDetails: vi.fn(),
  patched: vi.fn(() => true),
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

const getPendingSignerNonce = vi.fn(async () => 100);
const getX402PendingSignerNonce = vi.fn(async () => 100);
// The AUTHORITATIVE cross-candidate poll. The parent decides win/lost/pending from
// THIS (not the per-child verdicts). Signature: (hashes, chainId, nonce, confs).
const getTransactionConfirmation = vi.fn(
  async (): Promise<TxConfirmationResult> => ({ kind: 'PENDING' }),
);
const getX402TransactionConfirmation = vi.fn(
  async (): Promise<TxConfirmationResult> => ({ kind: 'PENDING' }),
);
const generalAlertNamefi = vi.fn(async () => undefined);
const checkNonceAlreadySent = vi.fn(
  async (): Promise<NonceAlreadySentResult> => ({ status: 'unused' }),
);
const criticalAlertWithTicket = vi.fn(async () => ({
  taskId: 't',
  taskUrl: 'u',
}));
const acquireNonceLock = vi.fn(async () => ({
  handle: { id: 'i', key: 'k', value: 'v', ttl: 90_000 },
  absoluteDeadlineMs: 0,
}));
const extendNonceLock = vi.fn(async () => true);
const releaseNonceLock = vi.fn(async () => undefined);
const getEnvVars = vi.fn(
  async (): Promise<Record<string, string | undefined>> => ({}),
);

type ChildHandle = { result: () => Promise<SendAndConfirmTxResult> };
const startChild = vi.fn(
  async (..._args: unknown[]): Promise<ChildHandle> =>
    makeHandle(stillPending()),
);

vi.mock('@temporalio/workflow', () => workflowMocks);
vi.mock('./typed-proxy-activities', () => ({
  typedProxyActivities: () => ({
    getPendingSignerNonce,
    getX402PendingSignerNonce,
    getTransactionConfirmation,
    getX402TransactionConfirmation,
    generalAlertNamefi,
    checkNonceAlreadySent,
    acquireNonceLock,
    extendNonceLock,
    releaseNonceLock,
    getEnvVars,
  }),
}));
// The cross-candidate confirm is now a child workflow; the mocked `executeChild`
// runs the real workflow fn in-process so it drives off the same mocked
// `getTransactionConfirmation` (i.e. `scriptCross`) the inline poll used to.
const executeChild = vi.fn(async (...callArgs: unknown[]): Promise<unknown> => {
  const workflowFn = callArgs[0] as (input: unknown) => Promise<unknown>;
  const input = (callArgs[1] as [unknown])[0];
  return workflowFn(input);
});
vi.mock('./typed-child-workflow', () => ({
  typedChildWorkflow: () => ({ startChild, executeChild }),
}));
vi.mock('./nonce-lock-heartbeat', () => ({
  runNonceLockHeartbeat: vi.fn(() => Promise.resolve()),
}));
vi.mock('./critical-alert-with-ticket', () => ({ criticalAlertWithTicket }));

const { staggeredSendRace } = await import('./staggered-send-race');

const CHAIN_ID = 8453;
const NONCE = 100;

function makeHandle(result: SendAndConfirmTxResult): ChildHandle {
  return { result: () => Promise.resolve(result) };
}

/** Drive the children (advisory): map each attempt's input to a scripted result. */
function scriptChildren(
  fn: (input: SendAndConfirmTxInput) => SendAndConfirmTxResult,
) {
  startChild.mockImplementation(async (...callArgs: unknown[]) => {
    const input = (callArgs[1] as [SendAndConfirmTxInput])[0];
    return makeHandle(fn(input));
  });
}

/** Drive the AUTHORITATIVE cross-candidate poll, by (hashes, chainId, nonce, confs). */
function scriptCross(
  fn: (
    hashes: Hash[],
    chainId: number,
    nonce: number,
    confirmations: number,
  ) => TxConfirmationResult,
) {
  getTransactionConfirmation.mockImplementation(async (...args: unknown[]) =>
    fn(
      args[0] as Hash[],
      args[1] as number,
      args[2] as number,
      args[3] as number,
    ),
  );
}

// ---- child result builders (advisory) ----
const confirmed = (txHash: string, attempt = 0): SendAndConfirmTxResult => ({
  status: 'CONFIRMED',
  txHash: txHash as Hash,
  blockNumber: '1',
  nonce: NONCE,
  attempt,
});
const lost = (
  txHash: string,
  attempt = 0,
  onChainNonce = NONCE + 1,
): SendAndConfirmTxResult => ({
  status: 'LOST',
  txHash: txHash as Hash,
  onChainNonce,
  nonce: NONCE,
  attempt,
});
const stillPending = (attempt = 0): SendAndConfirmTxResult => ({
  status: 'STILL_PENDING',
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

// ---- cross-candidate (authoritative) builders ----
const xConfirmed = (winner: string): TxConfirmationResult => ({
  kind: 'CONFIRMED',
  winner: winner as Hash,
  blockNumber: '1',
  confirmations: 3,
});
const xReverted = (reverted: string): TxConfirmationResult => ({
  kind: 'REVERTED',
  reverted: reverted as Hash,
  blockNumber: '1',
});
const xForeign = (onChainNonce: number): TxConfirmationResult => ({
  kind: 'NONCE_FILLED_NO_CANDIDATE',
  onChainNonce,
});
const xPending = (): TxConfirmationResult => ({ kind: 'PENDING' });

function run(
  config: Partial<StaggeredRaceConfig> = {},
  recovery?: StaggeredRaceRecovery,
  signerKind: 'mint' | 'x402' = 'mint',
  lock?: { enabled: boolean; heartbeatIntervalMs?: number; leewayMs?: number },
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
    lock,
  });
}

function childInputs(): SendAndConfirmTxInput[] {
  return startChild.mock.calls.map((c) => (c[1] as [SendAndConfirmTxInput])[0]);
}

beforeEach(() => {
  vi.clearAllMocks();
  getPendingSignerNonce.mockResolvedValue(100);
  getX402PendingSignerNonce.mockResolvedValue(100);
  getTransactionConfirmation.mockResolvedValue(xConfirmed('0xwin'));
  getX402TransactionConfirmation.mockResolvedValue(xConfirmed('0xwin'));
  generalAlertNamefi.mockResolvedValue(undefined);
  checkNonceAlreadySent.mockResolvedValue({ status: 'unused' });
  criticalAlertWithTicket.mockResolvedValue({ taskId: 't', taskUrl: 'u' });
  acquireNonceLock.mockResolvedValue({
    handle: { id: 'i', key: 'k', value: 'v', ttl: 90_000 },
    absoluteDeadlineMs: 0,
  });
  extendNonceLock.mockResolvedValue(true);
  releaseNonceLock.mockResolvedValue(undefined);
  getEnvVars.mockResolvedValue({});
  // Children default to the benign STILL_PENDING — the cross-candidate poll is the
  // authority and resolves the run.
  startChild.mockImplementation(async (...callArgs: unknown[]) => {
    const input = (callArgs[1] as [SendAndConfirmTxInput])[0];
    return makeHandle(stillPending(input.attempt));
  });
});

describe('staggeredSendRace — cross-candidate authority', () => {
  it('returns the cross-candidate winner and pins the nonce once', async () => {
    getTransactionConfirmation.mockResolvedValue(xConfirmed('0xwin'));
    const winner = await run();
    expect(winner).toBe('0xwin');
    expect(getPendingSignerNonce).toHaveBeenCalledTimes(1);
    expect(criticalAlertWithTicket).not.toHaveBeenCalled();
  });

  it('a confirmed cross-candidate WINS even when every child reports LOST (the incident)', async () => {
    // This is the bug: per-child polling makes a slow winner's siblings report
    // LOST. The parent's cross-candidate check must override and CONFIRM — never
    // fail, never re-pin.
    scriptChildren((i) => lost('0xlost', i.attempt));
    getTransactionConfirmation.mockResolvedValue(xConfirmed('0xreal'));
    const winner = await run({}, { maxNonceRepins: 2 });
    expect(winner).toBe('0xreal');
    expect(getPendingSignerNonce).toHaveBeenCalledTimes(1); // never re-pinned
    expect(criticalAlertWithTicket).not.toHaveBeenCalled();
  });

  it('throws (and critical-alerts) when the cross-candidate check reverts', async () => {
    getTransactionConfirmation.mockResolvedValue(xReverted('0xrev'));
    await expect(run()).rejects.toMatchObject({
      type: 'staggered-race/reverted',
    });
    expect(criticalAlertWithTicket).toHaveBeenCalledTimes(1);
  });

  it('throws nonce-stolen on cross-candidate LOST-foreign with no re-pin budget', async () => {
    getTransactionConfirmation.mockResolvedValue(xForeign(101));
    await expect(run({}, { maxNonceRepins: 0 })).rejects.toMatchObject({
      type: 'staggered-race/nonce-stolen',
    });
    expect(criticalAlertWithTicket).toHaveBeenCalledTimes(1);
  });

  it('re-pins a fresh nonce after a LOST-foreign round, then confirms', async () => {
    let nonceCall = 0;
    getPendingSignerNonce.mockImplementation(async () => 100 + nonceCall++);
    // nonce 100 → foreign took it; nonce 101 → confirmed.
    scriptCross((_h, _c, nonce) =>
      nonce === 100 ? xForeign(101) : xConfirmed('0xr1'),
    );
    const winner = await run({}, { maxNonceRepins: 2 });
    expect(winner).toBe('0xr1');
    expect(getPendingSignerNonce.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('RESETS gas to initial on re-pin (a fresh nonce has no pending tx to outbid)', async () => {
    let nonceCall = 0;
    getPendingSignerNonce.mockImplementation(async () => 100 + nonceCall++);
    scriptCross((_h, _c, nonce) =>
      nonce === 100 ? xForeign(101) : xConfirmed('0xr1'),
    );
    await run({}, { maxNonceRepins: 2 });
    const round1 = childInputs().filter((i) => i.roundIndex === 1);
    expect(round1.length).toBeGreaterThan(0);
    // First lane of the re-pinned round starts back at the initial gas.
    expect(round1[0].gasPriceMultiplier).toBe(1);
  });

  it('reconciles a cross-round double-commit via onDoubleCommit', async () => {
    let nonceCall = 0;
    getPendingSignerNonce.mockImplementation(async () => 100 + nonceCall++);
    scriptCross((_h, _c, nonce, confirmations) => {
      if (nonce === 100) return xForeign(101); // round 0 → re-pin
      // round 1: the resolution poll (confs=3) confirms; the cross-round
      // re-check (confs=1) finds a SECOND late-mined hash → double-commit.
      if (confirmations === 1) {
        return {
          kind: 'MULTIPLE_CONFIRMED',
          winners: ['0xr0', '0xr1'] as Hash[],
        };
      }
      return xConfirmed('0xr1');
    });
    const onDoubleCommit = vi.fn(async (winners: Hash[]) => winners[0]);
    const winner = await run({}, { maxNonceRepins: 2, onDoubleCommit });
    expect(onDoubleCommit).toHaveBeenCalledWith(['0xr0', '0xr1']);
    expect(winner).toBe('0xr0');
  });

  it("signerKind 'x402' routes the nonce read AND the cross-candidate poll", async () => {
    getX402TransactionConfirmation.mockResolvedValue(xConfirmed('0xx402'));
    const winner = await run({}, undefined, 'x402');
    expect(winner).toBe('0xx402');
    expect(getX402PendingSignerNonce).toHaveBeenCalled();
    expect(getX402TransactionConfirmation).toHaveBeenCalled();
    expect(getPendingSignerNonce).not.toHaveBeenCalled();
    expect(childInputs()[0].signerKind).toBe('x402');
  });

  it('a startChild rejection terminates the race (does not hang) and critical-alerts', async () => {
    startChild.mockImplementationOnce(async () => {
      throw new Error('WorkflowExecutionAlreadyStarted');
    });
    await expect(run({}, { maxNonceRepins: 2 })).rejects.toMatchObject({
      type: 'staggered-race/failed',
    });
    expect(criticalAlertWithTicket).toHaveBeenCalledTimes(1);
  });

  it('a child WORKFLOW crash is downgraded — resolves via the cross-candidate check', async () => {
    // A child whose result REJECTS (workflow crashed) does not un-send its tx;
    // the cross-candidate check still confirms it.
    startChild.mockImplementation(async () => ({
      result: () => Promise.reject(new Error('child crashed')),
    }));
    getTransactionConfirmation.mockResolvedValue(xConfirmed('0xrecovered'));
    const winner = await run({}, { maxNonceRepins: 2 });
    expect(winner).toBe('0xrecovered');
    expect(workflowMocks.log.warn).toHaveBeenCalledWith(
      expect.stringContaining('may have orphaned a tx'),
    );
  });

  it('fails fast (send-failed) ONLY when a clean (benign) no-broadcast and gas is maxed', async () => {
    // Benign NOT_SENT proves the node never accepted our tx → no orphan risk; with
    // gas maxed there is no pending tx to wait for, so fail rather than wait out
    // the bound.
    scriptChildren((i) => notSent(true, i.attempt));
    getTransactionConfirmation.mockResolvedValue(xPending());
    await expect(
      run({ maxGasPriceMultiplier: 1.05 }, { maxNonceRepins: 0 }),
    ).rejects.toMatchObject({ type: 'staggered-race/send-failed' });
  });

  it('does NOT fail-fast when a send may have ORPHANED a tx (holds the lock, never double-mints)', async () => {
    // A non-benign NOT_SENT may mean the node accepted the broadcast but the
    // response was lost → an orphan tx is live with no captured hash. Empty
    // candidates must NOT be read as "nothing sent": we hold the lock and route
    // to the stuck-pending path rather than releasing while a tx might be live.
    scriptChildren((i) => notSent(false, i.attempt)); // non-benign
    getTransactionConfirmation.mockResolvedValue(xPending());
    await expect(
      run(
        { maxGasPriceMultiplier: 1.05, maxPendingWaitMs: 1 },
        { maxNonceRepins: 0 },
      ),
    ).rejects.toMatchObject({ type: 'staggered-race/stuck-pending' }); // NOT send-failed
  });
});

describe('staggeredSendRace — batches & gas escalation', () => {
  it('escalates gas MONOTONICALLY across batches and caps at maxGasPriceMultiplier', async () => {
    // 2 lanes/batch, gas climbs 1.00→1.15 across batches then caps; PENDING forever
    // so multiple batches launch; the stuck-pending gate ends the run.
    getTransactionConfirmation.mockResolvedValue(xPending());
    const onStuckPending = vi.fn(
      async (): Promise<StuckPendingDecision> => ({
        kind: 'MARK_CONFIRMED',
        txHash: '0xw' as Hash,
      }),
    );
    await run(
      {
        lanes: 2,
        initialGasPriceMultiplier: 1,
        maxGasPriceMultiplier: 1.15,
        maxPendingWaitMs: 1,
      },
      { onStuckPending },
    );
    const gas = childInputs().map((i) => i.gasPriceMultiplier);
    // More than one batch launched (gas continued across the batch boundary).
    expect(gas.length).toBeGreaterThan(2);
    expect(gas).toEqual(gas.map((_, i) => Math.min(1 + i * 0.05, 1.15)));
    // Never exceeds the cap.
    expect(Math.max(...gas)).toBeLessThanOrEqual(1.15);
  });

  it('stops launching new batches once gas is maxed (keeps polling)', async () => {
    getTransactionConfirmation.mockResolvedValue(xPending());
    const onStuckPending = vi.fn(
      async (): Promise<StuckPendingDecision> => ({
        kind: 'MARK_CONFIRMED',
        txHash: '0xw' as Hash,
      }),
    );
    await run(
      {
        lanes: 5,
        initialGasPriceMultiplier: 1,
        maxGasPriceMultiplier: 1.05,
        maxPendingWaitMs: 1,
      },
      { onStuckPending },
    );
    // One batch only — gas maxes after attempt 1, so no second batch launches.
    expect(startChild.mock.calls).toHaveLength(5);
  });

  it('broadcasts the configured max gas even when it lands on a batch boundary (no off-by-one)', async () => {
    getTransactionConfirmation.mockResolvedValue(xPending());
    const onStuckPending = vi.fn(
      async (): Promise<StuckPendingDecision> => ({
        kind: 'MARK_CONFIRMED',
        txHash: '0xw' as Hash,
      }),
    );
    // Sepolia-like: (2.0 − 1.5)/0.05 = 10 = 2×lanes, so the first attempt AT the
    // 2.0 cap lands exactly on a batch boundary. The old `gasMaxed` (which checked
    // the next, un-launched attempt) stopped one increment short at 1.95.
    await run(
      {
        lanes: 5,
        initialGasPriceMultiplier: 1.5,
        maxGasPriceMultiplier: 2.0,
        maxPendingWaitMs: 1,
      },
      { onStuckPending },
    );
    const gas = childInputs().map((i) => i.gasPriceMultiplier);
    expect(Math.max(...gas)).toBe(2.0); // the configured ceiling WAS broadcast
  });
});

describe('staggeredSendRace — SEPOLIA_BLOCK_TIME_MS override', () => {
  it('fetches the override via getEnvVars (Sepolia only) and applies it to the child poll window', async () => {
    getEnvVars.mockResolvedValue({ SEPOLIA_BLOCK_TIME_MS: '500' });
    getTransactionConfirmation.mockResolvedValue(xConfirmed('0xwin'));
    await staggeredSendRace({
      preparedTx: {} as never,
      chainId: 11155111, // Sepolia → the override is fetched + applied
      label: 'test',
      signerKind: 'mint',
      config: {
        lanes: 5,
        pollIntervalMs: 1,
        confirmations: 3,
        initialGasPriceMultiplier: 1,
        maxGasPriceMultiplier: 2,
        // no staggerMs → derived from the overridden block time
      },
    });
    expect(getEnvVars).toHaveBeenCalledWith(['SEPOLIA_BLOCK_TIME_MS']);
    // Child poll window uses 500ms blocks: (3+3)*500 + 3000 = 6000 (vs 75s default).
    expect(childInputs()[0].pollWindowMs).toBe(6000);
  });

  it('does NOT fetch env for non-Sepolia chains', async () => {
    getTransactionConfirmation.mockResolvedValue(xConfirmed('0xwin'));
    await run(); // chainId 8453 (Base)
    expect(getEnvVars).not.toHaveBeenCalled();
  });
});

describe('staggeredSendRace — stuck-pending admin gate', () => {
  const stuckConfig = {
    maxGasPriceMultiplier: 1.05,
    maxPendingWaitMs: 1,
  };

  it('opens the gate with the lock STILL HELD (never released while pending)', async () => {
    getTransactionConfirmation.mockResolvedValue(xPending());
    const onStuckPending = vi.fn(async (): Promise<StuckPendingDecision> => {
      // The lock must still be held when we hand off to the admin.
      expect(releaseNonceLock).not.toHaveBeenCalled();
      return { kind: 'MARK_CONFIRMED', txHash: '0xmarked' as Hash };
    });
    const winner = await run(stuckConfig, { onStuckPending }, 'mint', {
      enabled: true,
    });
    expect(winner).toBe('0xmarked');
    expect(onStuckPending).toHaveBeenCalledTimes(1);
    expect(releaseNonceLock).toHaveBeenCalledTimes(1); // released at the very end
  });

  it('MARK_CONFIRMED returns the admin hash', async () => {
    getTransactionConfirmation.mockResolvedValue(xPending());
    const onStuckPending = vi.fn(
      async (): Promise<StuckPendingDecision> => ({
        kind: 'MARK_CONFIRMED',
        txHash: '0xadmin' as Hash,
      }),
    );
    expect(await run(stuckConfig, { onStuckPending })).toBe('0xadmin');
  });

  it('REPIN re-pins (bypassing the foreign-steal budget) then resolves', async () => {
    let nonceCall = 0;
    getPendingSignerNonce.mockImplementation(async () => 100 + nonceCall++);
    // nonce 100 stays pending (→ gate → REPIN); nonce 101 confirms.
    scriptCross((_h, _c, nonce) =>
      nonce === 100 ? xPending() : xConfirmed('0xafterrepin'),
    );
    const onStuckPending = vi
      .fn<() => Promise<StuckPendingDecision>>()
      .mockResolvedValueOnce({ kind: 'REPIN' });
    // maxNonceRepins 0 — REPIN must still re-pin (admin-authorized).
    const winner = await run(stuckConfig, {
      maxNonceRepins: 0,
      onStuckPending,
    });
    expect(winner).toBe('0xafterrepin');
    expect(getPendingSignerNonce.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('KEEP_WAITING reopens the gate (distinct waitCycle), then MARK_CONFIRMED resolves', async () => {
    getTransactionConfirmation.mockResolvedValue(xPending());
    const onStuckPending = vi
      .fn<(args: TxStuckPendingGateArgs) => Promise<StuckPendingDecision>>()
      .mockResolvedValueOnce({ kind: 'KEEP_WAITING' })
      .mockResolvedValueOnce({
        kind: 'MARK_CONFIRMED',
        txHash: '0xeventually' as Hash,
      });
    const winner = await run(stuckConfig, { onStuckPending });
    expect(winner).toBe('0xeventually');
    expect(onStuckPending).toHaveBeenCalledTimes(2);
    // Each reopen uses a distinct waitCycle so its gate wait-point can't collide.
    expect(onStuckPending.mock.calls[0][0].waitCycle).toBe(0);
    expect(onStuckPending.mock.calls[1][0].waitCycle).toBe(1);
  });

  it('throws when no onStuckPending gate is wired', async () => {
    getTransactionConfirmation.mockResolvedValue(xPending());
    await expect(run(stuckConfig, { maxNonceRepins: 0 })).rejects.toMatchObject(
      {
        type: 'staggered-race/stuck-pending',
      },
    );
  });
});

describe('staggeredSendRace — pre-re-pin nonce-collision check', () => {
  // A foreign tx took the nonce (cross-candidate LOST-foreign) → the precheck runs
  // before re-pinning.
  const foreign = () =>
    getTransactionConfirmation.mockResolvedValue(xForeign(101));
  const matchedSent = (
    receiptStatus: 'success' | 'reverted',
  ): NonceAlreadySentResult => ({
    status: 'matched',
    txHash: '0xalready' as Hash,
    receiptStatus,
    blockNumber: '1',
  });

  it('PROCEEDs with the already-sent tx (idempotent op) without re-pinning', async () => {
    foreign();
    checkNonceAlreadySent.mockResolvedValue(matchedSent('success'));
    const winner = await run(
      {},
      { maxNonceRepins: 2, alreadySentPolicy: 'PROCEED' },
    );
    expect(winner).toBe('0xalready');
    expect(getPendingSignerNonce).toHaveBeenCalledTimes(1); // never re-pinned
    expect(criticalAlertWithTicket).not.toHaveBeenCalled();
  });

  it('routes a matched non-idempotent op to the admin gate', async () => {
    foreign();
    checkNonceAlreadySent.mockResolvedValue(matchedSent('success'));
    const onAlreadySentNeedsAdmin = vi.fn(async (h: Hash) => h);
    const winner = await run(
      {},
      {
        maxNonceRepins: 2,
        alreadySentPolicy: 'WAIT_FOR_ADMIN',
        onAlreadySentNeedsAdmin,
      },
    );
    expect(onAlreadySentNeedsAdmin).toHaveBeenCalledWith('0xalready');
    expect(winner).toBe('0xalready');
  });

  it('re-pins when the check says a foreign tx took the nonce (conflict)', async () => {
    let nonceCall = 0;
    getPendingSignerNonce.mockImplementation(async () => 100 + nonceCall++);
    scriptCross((_h, _c, nonce) =>
      nonce === 100 ? xForeign(101) : xConfirmed('0xr1'),
    );
    checkNonceAlreadySent.mockResolvedValue({
      status: 'conflict',
      txHash: '0xforeign' as Hash,
      to: null,
      onChainData: '0xdead',
    });
    const winner = await run(
      {},
      { maxNonceRepins: 2, alreadySentPolicy: 'WAIT_FOR_ADMIN' },
    );
    expect(winner).toBe('0xr1');
    expect(getPendingSignerNonce.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('escalates a non-idempotent op when the consuming tx is unidentifiable', async () => {
    foreign();
    checkNonceAlreadySent.mockResolvedValue({
      status: 'consumed_unidentified',
      nonce: 100,
      onChainNonce: 101,
    });
    await expect(
      run({}, { maxNonceRepins: 2, alreadySentPolicy: 'WAIT_FOR_ADMIN' }),
    ).rejects.toMatchObject({
      type: 'staggered-race/already-sent-unidentified',
    });
    expect(criticalAlertWithTicket).toHaveBeenCalledTimes(1);
  });

  it('is terminal when the already-sent tx reverted', async () => {
    foreign();
    checkNonceAlreadySent.mockResolvedValue(matchedSent('reverted'));
    await expect(
      run({}, { maxNonceRepins: 2, alreadySentPolicy: 'PROCEED' }),
    ).rejects.toMatchObject({ type: 'staggered-race/reverted' });
  });

  it('skips the check entirely when no alreadySentPolicy is set (back-compat)', async () => {
    foreign();
    await expect(run({}, { maxNonceRepins: 0 })).rejects.toMatchObject({
      type: 'staggered-race/nonce-stolen',
    });
    expect(checkNonceAlreadySent).not.toHaveBeenCalled();
  });
});

describe('staggeredSendRace — distributed signer-nonce lock', () => {
  it('does not touch the lock when not enabled (back-compat)', async () => {
    getTransactionConfirmation.mockResolvedValue(xConfirmed('0xwin'));
    await run(); // no lock arg
    expect(acquireNonceLock).not.toHaveBeenCalled();
    expect(releaseNonceLock).not.toHaveBeenCalled();
  });

  it('acquires before the first nonce pin and releases on success', async () => {
    getTransactionConfirmation.mockResolvedValue(xConfirmed('0xwin'));
    const winner = await run({}, undefined, 'mint', { enabled: true });
    expect(winner).toBe('0xwin');
    expect(acquireNonceLock).toHaveBeenCalledTimes(1);
    expect(acquireNonceLock).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: CHAIN_ID,
        signerKind: 'mint',
        ttlMs: expect.any(Number),
        absoluteMaxMs: expect.any(Number),
      }),
    );
    expect(releaseNonceLock).toHaveBeenCalledTimes(1);
    expect(acquireNonceLock.mock.invocationCallOrder[0]).toBeLessThan(
      getPendingSignerNonce.mock.invocationCallOrder[0],
    );
  });

  it('releases the lock even when the race throws (finally)', async () => {
    getTransactionConfirmation.mockResolvedValue(xReverted('0xrev'));
    await expect(
      run({}, undefined, 'mint', { enabled: true }),
    ).rejects.toMatchObject({ type: 'staggered-race/reverted' });
    expect(acquireNonceLock).toHaveBeenCalledTimes(1);
    expect(releaseNonceLock).toHaveBeenCalledTimes(1);
  });

  it('acquires once across a multi-round re-pin', async () => {
    let nonceCall = 0;
    getPendingSignerNonce.mockImplementation(async () => 100 + nonceCall++);
    scriptCross((_h, _c, nonce) =>
      nonce === 100 ? xForeign(101) : xConfirmed('0xr1'),
    );
    await run({}, { maxNonceRepins: 2 }, 'mint', { enabled: true });
    expect(acquireNonceLock).toHaveBeenCalledTimes(1);
    expect(releaseNonceLock).toHaveBeenCalledTimes(1);
  });

  it('runs the full lock lifecycle (acquire → heartbeat → release) for x402', async () => {
    getX402TransactionConfirmation.mockResolvedValue(xConfirmed('0xx402'));
    await run({}, undefined, 'x402', { enabled: true });
    expect(acquireNonceLock).toHaveBeenCalledTimes(1);
    expect(acquireNonceLock).toHaveBeenCalledWith(
      expect.objectContaining({ signerKind: 'x402' }),
    );
    expect(runNonceLockHeartbeat).toHaveBeenCalledTimes(1);
    expect(runNonceLockHeartbeat).toHaveBeenCalledWith(
      expect.objectContaining({
        token: expect.objectContaining({
          handle: expect.objectContaining({ key: 'k' }),
        }),
        label: 'test',
        lockTtlMs: expect.any(Number),
        intervalMs: expect.any(Number),
        isDone: expect.any(Function),
      }),
    );
    expect(releaseNonceLock).toHaveBeenCalledTimes(1);
    expect(acquireNonceLock.mock.invocationCallOrder[0]).toBeLessThan(
      releaseNonceLock.mock.invocationCallOrder[0],
    );
  });
});
