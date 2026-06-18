import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Hash } from 'viem';
import type { StuckPendingDecision } from './tx-stuck-pending-gate';

const workflowMocks = {
  log: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
  ApplicationFailure: class ApplicationFailure extends Error {
    type?: string;
    static create({ message, type }: { message?: string; type?: string }) {
      const failure = new ApplicationFailure(message);
      failure.type = type;
      return failure;
    }
  },
};

const runWithKnownGate = vi.fn(
  async (_opts: unknown): Promise<StuckPendingDecision> => ({ kind: 'REPIN' }),
);
const createDecisionGateRegistry = vi.fn(() => ({}));

vi.mock('@temporalio/workflow', () => workflowMocks);
vi.mock('./decision-gate', () => ({ createDecisionGateRegistry }));
vi.mock('./known-gates', () => ({ runWithKnownGate }));

const { makeTxStuckPendingResolver } = await import('./tx-stuck-pending-gate');

const CANDIDATES: Hash[] = ['0xa' as Hash, '0xb' as Hash];
const resolve = makeTxStuckPendingResolver({ label: 'test', chainId: 8453 });

function getValidateResponse() {
  const { validateResponse } = runWithKnownGate.mock.calls[0][0] as {
    validateResponse: (raw: unknown) => StuckPendingDecision;
  };
  return validateResponse;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('makeTxStuckPendingResolver', () => {
  it('opens a tx-stuck-pending gate (RESPOND/CANCEL) and returns the admin decision', async () => {
    const result = await resolve({
      pinnedNonce: 7,
      candidateHashes: CANDIDATES,
      waitCycle: 0,
    });
    expect(createDecisionGateRegistry).toHaveBeenCalledTimes(1);
    expect(runWithKnownGate).toHaveBeenCalledTimes(1);
    const opts = runWithKnownGate.mock.calls[0][0] as {
      gateKind: string;
      interactionId: string;
      allowedActions: string[];
    };
    expect(opts.gateKind).toBe('tx-stuck-pending');
    expect(opts.interactionId).toBe('tx-stuck-pending-0');
    expect(opts.allowedActions).toEqual(['RESPOND', 'CANCEL']);
    expect(result).toEqual({ kind: 'REPIN' });
  });

  it('varies interactionId by waitCycle so a KEEP_WAITING reopen does not collide', async () => {
    await resolve({
      pinnedNonce: 7,
      candidateHashes: CANDIDATES,
      waitCycle: 3,
    });
    const opts = runWithKnownGate.mock.calls[0][0] as { interactionId: string };
    expect(opts.interactionId).toBe('tx-stuck-pending-3');
  });

  it('validateResponse parses each admin action', async () => {
    await resolve({
      pinnedNonce: 7,
      candidateHashes: CANDIDATES,
      waitCycle: 0,
    });
    const validateResponse = getValidateResponse();
    expect(
      validateResponse({ action: 'MARK_CONFIRMED', txHash: '0xa' }),
    ).toEqual({ kind: 'MARK_CONFIRMED', txHash: '0xa' });
    expect(validateResponse({ action: 'REPIN' })).toEqual({ kind: 'REPIN' });
    expect(validateResponse({ action: 'KEEP_WAITING' })).toEqual({
      kind: 'KEEP_WAITING',
    });
  });

  it('validateResponse rejects MARK_CONFIRMED with a non-candidate or missing hash', async () => {
    await resolve({
      pinnedNonce: 7,
      candidateHashes: CANDIDATES,
      waitCycle: 0,
    });
    const validateResponse = getValidateResponse();
    expect(() =>
      validateResponse({ action: 'MARK_CONFIRMED', txHash: '0xnope' }),
    ).toThrow(/candidate hashes/);
    expect(() => validateResponse({ action: 'MARK_CONFIRMED' })).toThrow(
      /candidate hashes/,
    );
  });

  it('validateResponse rejects unknown/malformed payloads (gate keeps waiting)', async () => {
    await resolve({
      pinnedNonce: 7,
      candidateHashes: CANDIDATES,
      waitCycle: 0,
    });
    const validateResponse = getValidateResponse();
    expect(() => validateResponse({ action: 'WHATEVER' })).toThrow(
      /unknown stuck-pending action/,
    );
    expect(() => validateResponse(undefined)).toThrow(
      /unknown stuck-pending action/,
    );
    expect(() => validateResponse({})).toThrow(/unknown stuck-pending action/);
  });
});
