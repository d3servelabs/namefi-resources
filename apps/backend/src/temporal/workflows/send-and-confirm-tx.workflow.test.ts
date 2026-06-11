import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Hash } from 'viem';
import type {
  TxConfirmationResult,
  TxSendOnlyResult,
} from '../activities/shared/eth-tx-primitives';
import type { SendAndConfirmTxInput } from './send-and-confirm-tx.workflow';

const workflowMocks = {
  sleep: vi.fn(async () => undefined),
  setCurrentDetails: vi.fn(),
  log: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
};

const sendPreparedTransaction = vi.fn(
  async (): Promise<TxSendOnlyResult> => ({
    status: 'SENT',
    txHash: '0xmint' as Hash,
  }),
);
const sendX402PreparedTransaction = vi.fn(
  async (): Promise<TxSendOnlyResult> => ({
    status: 'SENT',
    txHash: '0xx402' as Hash,
  }),
);
const getTransactionConfirmation = vi.fn(
  async (): Promise<TxConfirmationResult> => ({ kind: 'PENDING' }),
);
const getX402TransactionConfirmation = vi.fn(
  async (): Promise<TxConfirmationResult> => ({ kind: 'PENDING' }),
);

vi.mock('@temporalio/workflow', () => workflowMocks);
vi.mock('../shared/workflow-helpers/typed-proxy-activities', () => ({
  typedProxyActivities: () => ({
    sendPreparedTransaction,
    sendX402PreparedTransaction,
    getTransactionConfirmation,
    getX402TransactionConfirmation,
  }),
}));

const { sendAndConfirmTxWorkflow } = await import(
  './send-and-confirm-tx.workflow'
);

const BASE: SendAndConfirmTxInput = {
  signerKind: 'mint',
  preparedTx: {} as never,
  chainId: 8453,
  nonce: 42,
  gasPriceMultiplier: 1,
  confirmations: 3,
  pollIntervalMs: 1,
  timeoutMs: 10_000,
  graceCycles: 2,
  label: 'test',
  attempt: 0,
  roundIndex: 0,
};

const run = (overrides: Partial<SendAndConfirmTxInput> = {}) =>
  sendAndConfirmTxWorkflow({ ...BASE, ...overrides });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendAndConfirmTxWorkflow', () => {
  it('SENT then CONFIRMED returns CONFIRMED with the sent hash', async () => {
    getTransactionConfirmation.mockResolvedValueOnce({
      kind: 'CONFIRMED',
      winner: '0xmint' as Hash,
      blockNumber: '5',
      confirmations: 3,
    });
    expect(await run()).toEqual({
      status: 'CONFIRMED',
      txHash: '0xmint',
      blockNumber: '5',
      nonce: 42,
      attempt: 0,
    });
  });

  it('SENT then REVERTED returns REVERTED', async () => {
    getTransactionConfirmation.mockResolvedValueOnce({
      kind: 'REVERTED',
      reverted: '0xmint' as Hash,
      blockNumber: '5',
    });
    expect(await run()).toMatchObject({ status: 'REVERTED', txHash: '0xmint' });
  });

  it('concludes LOST only after graceCycles consecutive NONCE_FILLED polls', async () => {
    getTransactionConfirmation.mockResolvedValue({
      kind: 'NONCE_FILLED_NO_CANDIDATE',
      onChainNonce: 43,
    });
    const result = await run({ graceCycles: 2 });
    expect(result).toMatchObject({
      status: 'LOST',
      txHash: '0xmint',
      onChainNonce: 43,
    });
    // Did not give up on the first poll.
    expect(getTransactionConfirmation).toHaveBeenCalledTimes(2);
  });

  it('returns PENDING_TIMEOUT when the confirm budget elapses while pending', async () => {
    getTransactionConfirmation.mockResolvedValue({ kind: 'PENDING' });
    expect(await run({ timeoutMs: 1, pollIntervalMs: 1 })).toMatchObject({
      status: 'PENDING_TIMEOUT',
      txHash: '0xmint',
    });
  });

  it('benign send result returns NOT_SENT{benign:true} without polling', async () => {
    sendPreparedTransaction.mockResolvedValueOnce({
      status: 'NONCE_EXPIRED',
      error: 'taken',
    });
    expect(await run()).toMatchObject({
      status: 'NOT_SENT',
      sendStatus: 'NONCE_EXPIRED',
      benign: true,
    });
    expect(getTransactionConfirmation).not.toHaveBeenCalled();
  });

  it('fatal send result returns NOT_SENT{benign:false}', async () => {
    sendPreparedTransaction.mockResolvedValueOnce({
      status: 'FAILED_TO_SEND_TRANSACTION',
      error: 'boom',
    });
    expect(await run()).toMatchObject({
      status: 'NOT_SENT',
      sendStatus: 'FAILED_TO_SEND_TRANSACTION',
      benign: false,
    });
  });

  it("signerKind 'x402' routes to the x402 send + confirm activities", async () => {
    getX402TransactionConfirmation.mockResolvedValueOnce({
      kind: 'CONFIRMED',
      winner: '0xx402' as Hash,
      blockNumber: '7',
      confirmations: 3,
    });
    const result = await run({ signerKind: 'x402' });
    expect(result).toMatchObject({ status: 'CONFIRMED', txHash: '0xx402' });
    expect(sendX402PreparedTransaction).toHaveBeenCalledTimes(1);
    expect(sendPreparedTransaction).not.toHaveBeenCalled();
    expect(getX402TransactionConfirmation).toHaveBeenCalledTimes(1);
    expect(getTransactionConfirmation).not.toHaveBeenCalled();
  });
});
