import {
  type Abi,
  type Address,
  type Hash,
  type Hex,
  type PublicClient,
  type TransactionReceipt,
  encodeFunctionData,
  getAddress,
} from 'viem';
import { describe, expect, it, vi } from 'vitest';
import {
  type ConsumingTx,
  checkCallNotSent,
  checkNonceConsumed,
  scanBlocksForSignerNonce,
} from './nonce-collision-detection';

const SIGNER = '0x1111111111111111111111111111111111111111' as Address;
const CONTRACT = '0x2222222222222222222222222222222222222222' as Address;
const OTHER = '0x3333333333333333333333333333333333333333' as Address;
const DATA = '0xdeadbeef' as Hex;
const OTHER_DATA = '0xcafebabe' as Hex;
const TX_HASH = '0xabc' as Hash;

const MINT_ABI = [
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [],
  },
] as const satisfies Abi;

function makeClient() {
  const getTransactionCount = vi.fn(async () => 0);
  const getTransactionReceipt = vi.fn(
    async () => ({ status: 'success' }) as TransactionReceipt,
  );
  const getBlockNumber = vi.fn(async () => 100n);
  const getBlock = vi.fn(
    async (_args: { blockNumber: bigint; includeTransactions: boolean }) => ({
      transactions: [] as unknown[],
    }),
  );
  const client = {
    getTransactionCount,
    getTransactionReceipt,
    getBlockNumber,
    getBlock,
  } as unknown as PublicClient;
  return {
    client,
    getTransactionCount,
    getTransactionReceipt,
    getBlockNumber,
    getBlock,
  };
}

const consuming = (over: Partial<ConsumingTx> = {}): ConsumingTx => ({
  hash: TX_HASH,
  to: CONTRACT,
  input: DATA,
  nonce: 7,
  ...over,
});

describe('checkNonceConsumed', () => {
  it('returns unused when the nonce is at or beyond the confirmed count', async () => {
    const { client, getTransactionCount } = makeClient();
    getTransactionCount.mockResolvedValue(5);
    const findConsumingTx = vi.fn();

    const res = await checkNonceConsumed(
      client,
      {
        signer: SIGNER,
        nonce: 5,
        expectedData: DATA,
        contractAddress: CONTRACT,
      },
      { findConsumingTx },
    );

    expect(res).toEqual({ status: 'unused' });
    expect(findConsumingTx).not.toHaveBeenCalled();
  });

  it('returns matched (with receipt) when the consuming tx is our exact call', async () => {
    const { client, getTransactionCount, getTransactionReceipt } = makeClient();
    getTransactionCount.mockResolvedValue(10);
    getTransactionReceipt.mockResolvedValue({
      status: 'success',
    } as TransactionReceipt);
    const findConsumingTx = vi.fn(async () => consuming());

    const res = await checkNonceConsumed(
      client,
      {
        signer: SIGNER,
        nonce: 7,
        expectedData: DATA,
        contractAddress: CONTRACT,
      },
      { findConsumingTx },
    );

    expect(res).toEqual({
      status: 'matched',
      txHash: TX_HASH,
      receipt: { status: 'success' },
    });
    expect(getTransactionReceipt).toHaveBeenCalledWith({ hash: TX_HASH });
  });

  it('surfaces a reverted receipt on a matched send', async () => {
    const { client, getTransactionCount, getTransactionReceipt } = makeClient();
    getTransactionCount.mockResolvedValue(10);
    getTransactionReceipt.mockResolvedValue({
      status: 'reverted',
    } as TransactionReceipt);
    const findConsumingTx = vi.fn(async () => consuming());

    const res = await checkNonceConsumed(
      client,
      {
        signer: SIGNER,
        nonce: 7,
        expectedData: DATA,
        contractAddress: CONTRACT,
      },
      { findConsumingTx },
    );

    expect(res.status).toBe('matched');
    if (res.status === 'matched') {
      expect(res.receipt?.status).toBe('reverted');
    }
  });

  it('returns conflict when the nonce was consumed by different calldata', async () => {
    const { client, getTransactionCount } = makeClient();
    getTransactionCount.mockResolvedValue(10);
    const findConsumingTx = vi.fn(async () => consuming({ input: OTHER_DATA }));

    const res = await checkNonceConsumed(
      client,
      {
        signer: SIGNER,
        nonce: 7,
        expectedData: DATA,
        contractAddress: CONTRACT,
      },
      { findConsumingTx },
    );

    expect(res).toEqual({
      status: 'conflict',
      txHash: TX_HASH,
      to: CONTRACT,
      onChainData: OTHER_DATA,
    });
  });

  it('returns conflict when the nonce hit a different contract', async () => {
    const { client, getTransactionCount } = makeClient();
    getTransactionCount.mockResolvedValue(10);
    const findConsumingTx = vi.fn(async () => consuming({ to: OTHER }));

    const res = await checkNonceConsumed(
      client,
      {
        signer: SIGNER,
        nonce: 7,
        expectedData: DATA,
        contractAddress: CONTRACT,
      },
      { findConsumingTx },
    );

    expect(res.status).toBe('conflict');
  });

  it('matches case-insensitively on `to` and calldata', async () => {
    const { client, getTransactionCount } = makeClient();
    getTransactionCount.mockResolvedValue(10);
    // On-chain values reported with different casing than the expected ones.
    const findConsumingTx = vi.fn(async () =>
      consuming({
        to: getAddress(CONTRACT), // checksummed
        input: '0xDEADBEEF' as Hex, // upper-cased
      }),
    );

    const res = await checkNonceConsumed(
      client,
      {
        signer: SIGNER,
        nonce: 7,
        expectedData: DATA, // lower-cased
        contractAddress: CONTRACT,
      },
      { findConsumingTx },
    );

    expect(res.status).toBe('matched');
  });

  it('returns consumed_unidentified when the consuming tx cannot be located', async () => {
    const { client, getTransactionCount } = makeClient();
    getTransactionCount.mockResolvedValue(10);
    const findConsumingTx = vi.fn(async () => null);

    const res = await checkNonceConsumed(
      client,
      {
        signer: SIGNER,
        nonce: 7,
        expectedData: DATA,
        contractAddress: CONTRACT,
      },
      { findConsumingTx },
    );

    expect(res).toEqual({
      status: 'consumed_unidentified',
      nonce: 7,
      onChainNonce: 10,
    });
  });

  it('still reports matched (receipt null) when the receipt fetch fails', async () => {
    const { client, getTransactionCount, getTransactionReceipt } = makeClient();
    getTransactionCount.mockResolvedValue(10);
    getTransactionReceipt.mockRejectedValue(new Error('transport error'));
    const findConsumingTx = vi.fn(async () => consuming());

    const res = await checkNonceConsumed(
      client,
      {
        signer: SIGNER,
        nonce: 7,
        expectedData: DATA,
        contractAddress: CONTRACT,
      },
      { findConsumingTx },
    );

    expect(res).toEqual({ status: 'matched', txHash: TX_HASH, receipt: null });
  });

  it('uses the block scanner by default (no injected finder)', async () => {
    const { client, getTransactionCount, getBlockNumber, getBlock } =
      makeClient();
    getTransactionCount.mockResolvedValue(8); // nonce 7 < 8 → consumed
    getBlockNumber.mockResolvedValue(0n);
    getBlock.mockResolvedValue({
      transactions: [
        { from: SIGNER, nonce: 7, to: CONTRACT, input: DATA, hash: TX_HASH },
      ] as unknown[],
    });

    const res = await checkNonceConsumed(client, {
      signer: SIGNER,
      nonce: 7,
      expectedData: DATA,
      contractAddress: CONTRACT,
      fromBlock: 0n,
    });

    expect(res.status).toBe('matched');
    expect(getBlock).toHaveBeenCalledWith({
      blockNumber: 0n,
      includeTransactions: true,
    });
  });
});

describe('checkCallNotSent', () => {
  it('encodes the call and matches our own send', async () => {
    const { client, getTransactionCount } = makeClient();
    getTransactionCount.mockResolvedValue(10);
    const expected = encodeFunctionData({
      abi: MINT_ABI,
      functionName: 'mint',
      args: [OTHER, 1n],
    });
    const findConsumingTx = vi.fn(async () => consuming({ input: expected }));

    const res = await checkCallNotSent(
      client,
      {
        signer: SIGNER,
        nonce: 7,
        contractAddress: CONTRACT,
        abi: MINT_ABI,
        functionName: 'mint',
        args: [OTHER, 1n],
      },
      { findConsumingTx },
    );

    expect(res.status).toBe('matched');
  });

  it('is insensitive to argument address casing (encoding normalizes)', async () => {
    const lower = OTHER.toLowerCase() as Address;
    const checksummed = getAddress(OTHER);
    const dataLower = encodeFunctionData({
      abi: MINT_ABI,
      functionName: 'mint',
      args: [lower, 1n],
    });
    const dataChecksummed = encodeFunctionData({
      abi: MINT_ABI,
      functionName: 'mint',
      args: [checksummed, 1n],
    });
    // Same bytes regardless of input casing — the identity check is valid.
    expect(dataLower).toBe(dataChecksummed);

    const { client, getTransactionCount } = makeClient();
    getTransactionCount.mockResolvedValue(10);
    const findConsumingTx = vi.fn(async () => consuming({ input: dataLower }));

    const res = await checkCallNotSent(
      client,
      {
        signer: SIGNER,
        nonce: 7,
        contractAddress: CONTRACT,
        abi: MINT_ABI,
        functionName: 'mint',
        args: [checksummed, 1n],
      },
      { findConsumingTx },
    );

    expect(res.status).toBe('matched');
  });
});

describe('scanBlocksForSignerNonce', () => {
  it('finds the signer tx carrying the target nonce', async () => {
    const { client, getBlock, getBlockNumber } = makeClient();
    getBlockNumber.mockResolvedValue(3n);
    const byBlock: Record<string, { transactions: unknown[] }> = {
      '0': {
        transactions: [
          { from: OTHER, nonce: 0, to: CONTRACT, input: '0x', hash: '0xb0' },
        ],
      },
      '1': {
        transactions: [
          { from: SIGNER, nonce: 6, to: CONTRACT, input: '0x', hash: '0xb1' },
        ],
      },
      '2': {
        transactions: [
          { from: SIGNER, nonce: 7, to: CONTRACT, input: DATA, hash: TX_HASH },
        ],
      },
      '3': { transactions: [] },
    };
    getBlock.mockImplementation(
      async ({ blockNumber }: { blockNumber: bigint }) =>
        byBlock[blockNumber.toString()],
    );

    const res = await scanBlocksForSignerNonce(client, {
      signer: SIGNER,
      nonce: 7,
      fromBlock: 0n,
    });

    expect(res).toEqual({
      hash: TX_HASH,
      to: CONTRACT,
      input: DATA,
      nonce: 7,
    });
  });

  it('stops early once it passes the target nonce', async () => {
    const { client, getBlock, getBlockNumber } = makeClient();
    getBlockNumber.mockResolvedValue(10n);
    getBlock.mockResolvedValue({
      transactions: [
        { from: SIGNER, nonce: 8, to: CONTRACT, input: '0x', hash: '0xhi' },
      ] as unknown[],
    });

    const res = await scanBlocksForSignerNonce(client, {
      signer: SIGNER,
      nonce: 7,
      fromBlock: 0n,
    });

    expect(res).toBeNull();
    expect(getBlock).toHaveBeenCalledTimes(1);
  });

  it('returns null when the target nonce is not in the scanned range', async () => {
    const { client, getBlock, getBlockNumber } = makeClient();
    getBlockNumber.mockResolvedValue(1n);
    getBlock.mockResolvedValue({ transactions: [] as unknown[] });

    const res = await scanBlocksForSignerNonce(client, {
      signer: SIGNER,
      nonce: 7,
      fromBlock: 0n,
    });

    expect(res).toBeNull();
  });

  it('anchors the default window to recent blocks when fromBlock is omitted (lookback > cap)', async () => {
    const { client, getBlock, getBlockNumber } = makeClient();
    getBlockNumber.mockResolvedValue(1000n);
    // lookback 2000 > maxBlocksScanned 4 → window = cap-1 = 3 → scan [997..1000],
    // NOT the stale [latest-2000 ..] window. The tx sits at the recent end.
    getBlock.mockImplementation(
      async ({ blockNumber }: { blockNumber: bigint }) =>
        blockNumber === 999n
          ? {
              transactions: [
                {
                  from: SIGNER,
                  nonce: 7,
                  to: CONTRACT,
                  input: DATA,
                  hash: TX_HASH,
                },
              ],
            }
          : { transactions: [] },
    );

    const res = await scanBlocksForSignerNonce(client, {
      signer: SIGNER,
      nonce: 7,
      lookbackBlocks: 2000n,
      maxBlocksScanned: 4,
    });

    expect(res).toEqual({
      hash: TX_HASH,
      to: CONTRACT,
      input: DATA,
      nonce: 7,
    });
    // Window anchored at the recent end: started at 1000 - (4 - 1) = 997.
    expect(getBlock).toHaveBeenCalledWith({
      blockNumber: 997n,
      includeTransactions: true,
    });
  });
});
