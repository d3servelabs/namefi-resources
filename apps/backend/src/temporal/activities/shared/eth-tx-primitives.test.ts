import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Hash } from 'viem';
import type { SignerClientBundle } from './eth-tx-primitives';

const log = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

vi.mock('@temporalio/activity', () => ({
  Context: { current: () => ({ log }) },
}));

const { createEthTxPrimitives } = await import('./eth-tx-primitives');

const PINNED_NONCE = 5;

function makeReceiptNotFoundError(): Error {
  const error = new Error('Transaction receipt could not be found');
  error.name = 'TransactionReceiptNotFoundError';
  return error;
}

function makeClients() {
  const publicClient = {
    estimateGas: vi.fn(async () => 21_000n),
    getGasPrice: vi.fn(async () => 1_000_000_000n),
    getBlockNumber: vi.fn(async () => 100n),
    getTransactionReceipt: vi.fn(async () => {
      throw makeReceiptNotFoundError();
    }),
    getTransactionCount: vi.fn(async () => PINNED_NONCE),
  };
  const walletClient = {
    account: { address: '0xSigner' as const },
    sendTransaction: vi.fn(async (_tx: unknown) => '0xsent' as Hash),
  };
  const clients = {
    getPublicClient: () => publicClient,
    getWalletClient: async () => walletClient,
    resolveMaxGasPriceMultiplier: async () => 1.25,
  } as unknown as SignerClientBundle;
  return { publicClient, walletClient, clients };
}

let publicClient: ReturnType<typeof makeClients>['publicClient'];
let walletClient: ReturnType<typeof makeClients>['walletClient'];
let primitives: ReturnType<typeof createEthTxPrimitives>;

beforeEach(() => {
  vi.clearAllMocks();
  const built = makeClients();
  publicClient = built.publicClient;
  walletClient = built.walletClient;
  primitives = createEthTxPrimitives(built.clients);
});

describe('getSignerNonce', () => {
  it('reads the next nonce using the pending block tag', async () => {
    publicClient.getTransactionCount.mockResolvedValueOnce(9);
    const nonce = await primitives.getSignerNonce(8453);
    expect(nonce).toBe(9);
    expect(publicClient.getTransactionCount).toHaveBeenCalledWith({
      address: '0xSigner',
      blockTag: 'pending',
    });
  });
});

describe('sendPreparedTransaction', () => {
  const send = (gasMultiplier = 1) =>
    primitives.sendPreparedTransaction(
      {} as never,
      8453,
      PINNED_NONCE,
      gasMultiplier,
    );

  it('sends with the explicit pinned nonce and a capped maxFeePerGas', async () => {
    const result = await send(2); // above the 1.25 cap
    expect(result).toEqual({ status: 'SENT', txHash: '0xsent' });

    const sentTx = walletClient.sendTransaction.mock.calls[0][0] as {
      nonce: number;
      maxFeePerGas: bigint;
      gas: bigint;
    };
    expect(sentTx.nonce).toBe(PINNED_NONCE);
    expect(sentTx.gas).toBe(21_000n);
    // 1_000_000_000 * min(2, 1.25) = 1_250_000_000
    expect(sentTx.maxFeePerGas).toBe(1_250_000_000n);
  });

  it('classifies "nonce too low" as NONCE_EXPIRED', async () => {
    walletClient.sendTransaction.mockRejectedValueOnce(
      new Error('nonce too low: next nonce 6'),
    );
    expect(await send()).toMatchObject({ status: 'NONCE_EXPIRED' });
  });

  it('classifies replacement-underpriced via error.details', async () => {
    const error = new Error('replacement') as Error & { details: string };
    error.details = 'replacement transaction underpriced';
    walletClient.sendTransaction.mockRejectedValueOnce(error);
    expect(await send()).toMatchObject({ status: 'REPLACEMENT_UNDERPRICED' });
  });

  it('classifies insufficient funds', async () => {
    walletClient.sendTransaction.mockRejectedValueOnce(
      new Error('insufficient funds for gas * price + value'),
    );
    expect(await send()).toMatchObject({ status: 'INSUFFICIENT_FUNDS' });
  });

  it('returns UNPREDICTABLE_GAS_LIMIT when gas estimation fails', async () => {
    publicClient.estimateGas.mockRejectedValueOnce(
      new Error('cannot estimate'),
    );
    expect(await send()).toMatchObject({ status: 'UNPREDICTABLE_GAS_LIMIT' });
    expect(walletClient.sendTransaction).not.toHaveBeenCalled();
  });

  it('returns FAILED_TO_GET_GAS_PRICE when gas price lookup fails', async () => {
    publicClient.getGasPrice.mockRejectedValueOnce(new Error('no gas price'));
    expect(await send()).toMatchObject({ status: 'FAILED_TO_GET_GAS_PRICE' });
  });

  it('falls back to FAILED_TO_SEND_TRANSACTION for unknown send errors', async () => {
    walletClient.sendTransaction.mockRejectedValueOnce(new Error('boom'));
    expect(await send()).toMatchObject({
      status: 'FAILED_TO_SEND_TRANSACTION',
    });
  });
});

describe('getTransactionConfirmation', () => {
  const confirm = (hashes: Hash[]) =>
    primitives.getTransactionConfirmation(hashes, 8453, PINNED_NONCE, 3);

  it('returns CONFIRMED with stringified blockNumber once deep enough', async () => {
    publicClient.getBlockNumber.mockResolvedValueOnce(100n);
    publicClient.getTransactionReceipt.mockResolvedValueOnce({
      status: 'success',
      blockNumber: 98n, // 100 - 98 + 1 = 3 confirmations
    } as never);
    expect(await confirm(['0xa' as Hash])).toEqual({
      kind: 'CONFIRMED',
      winner: '0xa',
      blockNumber: '98',
      confirmations: 3,
    });
  });

  it('returns PENDING when a receipt is not yet deep enough', async () => {
    publicClient.getBlockNumber.mockResolvedValueOnce(100n);
    publicClient.getTransactionReceipt.mockResolvedValueOnce({
      status: 'success',
      blockNumber: 100n, // only 1 confirmation
    } as never);
    expect(await confirm(['0xa' as Hash])).toEqual({ kind: 'PENDING' });
  });

  it('returns REVERTED when a candidate mined but reverted', async () => {
    publicClient.getBlockNumber.mockResolvedValueOnce(100n);
    publicClient.getTransactionReceipt.mockResolvedValueOnce({
      status: 'reverted',
      blockNumber: 97n,
    } as never);
    expect(await confirm(['0xa' as Hash])).toEqual({
      kind: 'REVERTED',
      reverted: '0xa',
      blockNumber: '97',
    });
  });

  it('returns MULTIPLE_CONFIRMED defensively when two candidates mine', async () => {
    publicClient.getBlockNumber.mockResolvedValueOnce(100n);
    publicClient.getTransactionReceipt
      .mockResolvedValueOnce({ status: 'success', blockNumber: 95n } as never)
      .mockResolvedValueOnce({ status: 'success', blockNumber: 96n } as never);
    expect(await confirm(['0xa' as Hash, '0xb' as Hash])).toEqual({
      kind: 'MULTIPLE_CONFIRMED',
      winners: ['0xa', '0xb'],
    });
  });

  it('returns PENDING when nothing is mined and the nonce has not advanced', async () => {
    publicClient.getTransactionCount.mockResolvedValueOnce(PINNED_NONCE);
    expect(await confirm(['0xa' as Hash])).toEqual({ kind: 'PENDING' });
  });

  it('returns NONCE_FILLED_NO_CANDIDATE when the nonce advanced with no candidate receipt', async () => {
    publicClient.getTransactionCount.mockResolvedValueOnce(7); // > pinned 5
    expect(await confirm(['0xa' as Hash])).toEqual({
      kind: 'NONCE_FILLED_NO_CANDIDATE',
      onChainNonce: 7,
    });
  });

  it('throws on a genuine receipt transport error so Temporal can retry', async () => {
    publicClient.getTransactionReceipt.mockRejectedValueOnce(
      new Error('network unreachable'),
    );
    await expect(confirm(['0xa' as Hash])).rejects.toThrow(
      'network unreachable',
    );
  });
});
