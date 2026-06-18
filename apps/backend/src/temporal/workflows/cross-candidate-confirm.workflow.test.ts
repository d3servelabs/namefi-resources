import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Hash } from 'viem';
import type { TxConfirmationResult } from '../activities/shared/eth-tx-primitives';
import type { CrossCandidateConfirmInput } from './cross-candidate-confirm.workflow';

const workflowMocks = {
  sleep: vi.fn(async () => undefined),
};

const getTransactionConfirmation = vi.fn(
  async (): Promise<TxConfirmationResult> => ({ kind: 'PENDING' }),
);
const getX402TransactionConfirmation = vi.fn(
  async (): Promise<TxConfirmationResult> => ({ kind: 'PENDING' }),
);

vi.mock('@temporalio/workflow', () => workflowMocks);
vi.mock('../shared/workflow-helpers/typed-proxy-activities', () => ({
  typedProxyActivities: () => ({
    getTransactionConfirmation,
    getX402TransactionConfirmation,
  }),
}));

const { crossCandidateConfirmWorkflow } = await import(
  './cross-candidate-confirm.workflow'
);

const BASE: CrossCandidateConfirmInput = {
  candidateHashes: ['0xa' as Hash, '0xb' as Hash],
  chainId: 8453,
  pinnedNonce: 42,
  confirmations: 3,
  windowMs: 10_000,
  pollIntervalMs: 1,
  graceCycles: 2,
  signerKind: 'mint',
  label: 'test',
  roundIndex: 0,
  batchIndex: 0,
};

const run = (overrides: Partial<CrossCandidateConfirmInput> = {}) =>
  crossCandidateConfirmWorkflow({ ...BASE, ...overrides });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('crossCandidateConfirmWorkflow', () => {
  it('maps CONFIRMED to a CONFIRMED verdict with the winner', async () => {
    getTransactionConfirmation.mockResolvedValueOnce({
      kind: 'CONFIRMED',
      winner: '0xa' as Hash,
      blockNumber: '5',
      confirmations: 3,
    });
    expect(await run()).toEqual({ kind: 'CONFIRMED', winner: '0xa' });
  });

  it('maps MULTIPLE_CONFIRMED to a MULTIPLE verdict', async () => {
    getTransactionConfirmation.mockResolvedValueOnce({
      kind: 'MULTIPLE_CONFIRMED',
      winners: ['0xa' as Hash, '0xb' as Hash],
    });
    expect(await run()).toEqual({
      kind: 'MULTIPLE',
      winners: ['0xa', '0xb'],
    });
  });

  it('maps REVERTED to a REVERTED verdict', async () => {
    getTransactionConfirmation.mockResolvedValueOnce({
      kind: 'REVERTED',
      reverted: '0xa' as Hash,
      blockNumber: '5',
    });
    expect(await run()).toEqual({
      kind: 'REVERTED',
      reverted: '0xa',
      blockNumber: '5',
    });
  });

  it('concludes LOST_FOREIGN only after graceCycles consecutive NONCE_FILLED polls', async () => {
    getTransactionConfirmation.mockResolvedValue({
      kind: 'NONCE_FILLED_NO_CANDIDATE',
      onChainNonce: 43,
    });
    expect(await run({ graceCycles: 2 })).toEqual({
      kind: 'LOST_FOREIGN',
      onChainNonce: 43,
    });
    // Did not give up on the first foreign-nonce poll (RPC-lag grace).
    expect(getTransactionConfirmation).toHaveBeenCalledTimes(2);
  });

  it('resets the NONCE_FILLED streak on an interleaved PENDING', async () => {
    getTransactionConfirmation
      .mockResolvedValueOnce({
        kind: 'NONCE_FILLED_NO_CANDIDATE',
        onChainNonce: 43,
      })
      .mockResolvedValueOnce({ kind: 'PENDING' })
      .mockResolvedValueOnce({
        kind: 'NONCE_FILLED_NO_CANDIDATE',
        onChainNonce: 43,
      })
      .mockResolvedValue({ kind: 'PENDING' });
    // The streak never reaches graceCycles, so the window elapses → PENDING.
    expect(
      await run({ graceCycles: 2, windowMs: 3, pollIntervalMs: 1 }),
    ).toEqual({ kind: 'PENDING' });
  });

  it('returns PENDING when the window elapses with the nonce still open', async () => {
    getTransactionConfirmation.mockResolvedValue({ kind: 'PENDING' });
    expect(await run({ windowMs: 1, pollIntervalMs: 1 })).toEqual({
      kind: 'PENDING',
    });
  });

  it('polls across many PENDING cycles, then CONFIRMS within the window', async () => {
    getTransactionConfirmation
      .mockResolvedValueOnce({ kind: 'PENDING' })
      .mockResolvedValueOnce({ kind: 'PENDING' })
      .mockResolvedValueOnce({
        kind: 'CONFIRMED',
        winner: '0xb' as Hash,
        blockNumber: '9',
        confirmations: 3,
      });
    expect(await run({ windowMs: 10_000, pollIntervalMs: 1 })).toEqual({
      kind: 'CONFIRMED',
      winner: '0xb',
    });
    expect(getTransactionConfirmation).toHaveBeenCalledTimes(3);
  });

  it('passes the full candidate-hash snapshot and pinned nonce to the activity', async () => {
    getTransactionConfirmation.mockResolvedValueOnce({
      kind: 'CONFIRMED',
      winner: '0xa' as Hash,
      blockNumber: '1',
      confirmations: 3,
    });
    await run({
      candidateHashes: ['0xa' as Hash, '0xb' as Hash, '0xc' as Hash],
    });
    expect(getTransactionConfirmation).toHaveBeenCalledWith(
      ['0xa', '0xb', '0xc'],
      8453,
      42,
      3,
    );
  });

  it("signerKind 'x402' routes to the x402 confirmation activity", async () => {
    getX402TransactionConfirmation.mockResolvedValueOnce({
      kind: 'CONFIRMED',
      winner: '0xa' as Hash,
      blockNumber: '7',
      confirmations: 3,
    });
    expect(await run({ signerKind: 'x402' })).toEqual({
      kind: 'CONFIRMED',
      winner: '0xa',
    });
    expect(getX402TransactionConfirmation).toHaveBeenCalledTimes(1);
    expect(getTransactionConfirmation).not.toHaveBeenCalled();
  });
});
