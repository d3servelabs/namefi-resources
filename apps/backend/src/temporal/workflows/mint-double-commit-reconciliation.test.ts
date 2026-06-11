import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Hash } from 'viem';

const workflowMocks = {
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

const criticalAlertWithTicket = vi.fn(async () => ({
  taskId: 't',
  taskUrl: 'u',
}));
const runWithKnownGate = vi.fn(async (_opts: unknown) => '0xkept' as Hash);
const createDecisionGateRegistry = vi.fn(() => ({}));

vi.mock('@temporalio/workflow', () => workflowMocks);
vi.mock('../shared/workflow-helpers/critical-alert-with-ticket', () => ({
  criticalAlertWithTicket,
}));
vi.mock('../shared/workflow-helpers/decision-gate', () => ({
  createDecisionGateRegistry,
}));
vi.mock('../shared/workflow-helpers/known-gates', () => ({ runWithKnownGate }));

const { makeDoubleCommitReconciler } = await import(
  './mint-double-commit-reconciliation'
);

const WINNERS: Hash[] = ['0xcanonical' as Hash, '0xextra1' as Hash];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('makeDoubleCommitReconciler', () => {
  it('PROCEED keeps the canonical winner without alerting', async () => {
    const reconcile = makeDoubleCommitReconciler({
      policy: 'PROCEED',
      label: 'test',
      chainId: 8453,
    });
    expect(await reconcile(WINNERS)).toBe('0xcanonical');
    expect(criticalAlertWithTicket).not.toHaveBeenCalled();
  });

  it('AUTOFIX runs the compensating action over the extras and keeps canonical', async () => {
    const autofix = vi.fn(async () => undefined);
    const reconcile = makeDoubleCommitReconciler({
      policy: 'AUTOFIX',
      label: 'test',
      chainId: 8453,
      autofix,
    });

    const result = await reconcile(WINNERS);

    expect(autofix).toHaveBeenCalledWith(['0xextra1']);
    expect(criticalAlertWithTicket).toHaveBeenCalledTimes(1);
    expect(result).toBe('0xcanonical');
  });

  it('AUTOFIX without an autofix action throws (misconfigured)', async () => {
    const reconcile = makeDoubleCommitReconciler({
      policy: 'AUTOFIX',
      label: 'test',
      chainId: 8453,
    });
    await expect(reconcile(WINNERS)).rejects.toMatchObject({
      type: 'double-commit/autofix-misconfigured',
    });
  });

  it('WAIT_FOR_ADMIN opens a mint-double-commit gate and returns the admin choice', async () => {
    const reconcile = makeDoubleCommitReconciler({
      policy: 'WAIT_FOR_ADMIN',
      label: 'test',
      chainId: 8453,
    });

    const result = await reconcile(WINNERS);

    expect(createDecisionGateRegistry).toHaveBeenCalledTimes(1);
    expect(runWithKnownGate).toHaveBeenCalledTimes(1);
    const opts = runWithKnownGate.mock.calls[0][0] as {
      gateKind: string;
      allowedActions: string[];
    };
    expect(opts.gateKind).toBe('mint-double-commit');
    expect(opts.allowedActions).toEqual(['RESPOND', 'CANCEL']);
    expect(result).toBe('0xkept');
  });

  it('WAIT_FOR_ADMIN validateResponse never resolves to an empty hash', async () => {
    const reconcile = makeDoubleCommitReconciler({
      policy: 'WAIT_FOR_ADMIN',
      label: 'test',
      chainId: 8453,
    });
    await reconcile(WINNERS);

    const { validateResponse } = runWithKnownGate.mock.calls[0][0] as {
      validateResponse: (raw: unknown) => Hash;
    };

    // A keepHash that is one of the winners is returned as-is.
    expect(validateResponse({ keepHash: '0xextra1' })).toBe('0xextra1');
    // Missing or empty keepHash falls back to the canonical winner — and must
    // NEVER resolve to an empty-string hash.
    expect(validateResponse({ keepHash: '' })).toBe('0xcanonical');
    expect(validateResponse({})).toBe('0xcanonical');
    expect(validateResponse(undefined)).toBe('0xcanonical');
    // A non-empty keepHash that is not a confirmed winner is rejected.
    expect(() => validateResponse({ keepHash: '0xnope' })).toThrow(
      /not a confirmed winner/,
    );
  });

  it('CRITICAL_ALERT alerts and throws', async () => {
    const reconcile = makeDoubleCommitReconciler({
      policy: 'CRITICAL_ALERT',
      label: 'test',
      chainId: 8453,
    });
    await expect(reconcile(WINNERS)).rejects.toMatchObject({
      type: 'double-commit/critical',
    });
    expect(criticalAlertWithTicket).toHaveBeenCalledTimes(1);
  });
});
