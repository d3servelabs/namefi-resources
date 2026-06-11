import type { Address, Hash, Hex, TransactionReceipt } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const log = { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() };
const checkNonceConsumed = vi.fn();
const getViemPublicClient = vi.fn(() => ({ tag: 'mint-public' }));
const getViemWalletClient = vi.fn(async () => ({
  account: { address: '0xMintSigner' as Address },
}));
const getX402PublicClient = vi.fn(() => ({ tag: 'x402-public' }));
const getX402WalletClient = vi.fn(async () => ({
  account: { address: '0xX402Signer' as Address },
}));

vi.mock('@temporalio/activity', () => ({
  Context: { current: () => ({ log }) },
}));
vi.mock('#lib/crypto/nonce-collision-detection', () => ({
  checkNonceConsumed,
}));
vi.mock('#lib/crypto/viem-clients', () => ({
  getViemPublicClient,
  getViemWalletClient,
}));
vi.mock('#lib/crypto/x402-viem-clients', () => ({
  getX402PublicClient,
  getX402WalletClient,
}));

const { checkNonceAlreadySent } = await import('./nonce-collision.activities');

const CONTRACT = '0x2222222222222222222222222222222222222222' as Address;
const DATA = '0xdeadbeef' as Hex;
const TXH = '0xabc' as Hash;

const baseInput = {
  signerKind: 'mint' as const,
  chainId: 8453,
  nonce: 7,
  expectedData: DATA,
  contractAddress: CONTRACT,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('checkNonceAlreadySent', () => {
  it('passes the mint signer address + a parsed fromBlock to checkNonceConsumed', async () => {
    checkNonceConsumed.mockResolvedValue({ status: 'unused' });

    const res = await checkNonceAlreadySent({ ...baseInput, fromBlock: '123' });

    expect(res).toEqual({ status: 'unused' });
    expect(getViemPublicClient).toHaveBeenCalledWith(8453);
    expect(checkNonceConsumed).toHaveBeenCalledWith(expect.anything(), {
      signer: '0xMintSigner',
      nonce: 7,
      expectedData: DATA,
      contractAddress: CONTRACT,
      fromBlock: 123n,
    });
  });

  it("routes to the x402 signer when signerKind is 'x402'", async () => {
    checkNonceConsumed.mockResolvedValue({ status: 'unused' });

    await checkNonceAlreadySent({ ...baseInput, signerKind: 'x402' });

    expect(getX402PublicClient).toHaveBeenCalledWith(8453);
    expect(getX402WalletClient).toHaveBeenCalledWith(8453);
    expect(getViemPublicClient).not.toHaveBeenCalled();
    expect(checkNonceConsumed).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ signer: '0xX402Signer', fromBlock: undefined }),
    );
  });

  it('flattens a matched result to a bigint-free, serializable shape', async () => {
    checkNonceConsumed.mockResolvedValue({
      status: 'matched',
      txHash: TXH,
      receipt: { status: 'success', blockNumber: 100n } as TransactionReceipt,
    });

    const res = await checkNonceAlreadySent(baseInput);

    expect(res).toEqual({
      status: 'matched',
      txHash: TXH,
      receiptStatus: 'success',
      blockNumber: '100',
    });
  });

  it('maps a null receipt (matched, receipt fetch failed) without throwing', async () => {
    checkNonceConsumed.mockResolvedValue({
      status: 'matched',
      txHash: TXH,
      receipt: null,
    });

    const res = await checkNonceAlreadySent(baseInput);

    expect(res).toEqual({
      status: 'matched',
      txHash: TXH,
      receiptStatus: null,
      blockNumber: null,
    });
  });

  it('passes through conflict and consumed_unidentified', async () => {
    checkNonceConsumed.mockResolvedValueOnce({
      status: 'conflict',
      txHash: TXH,
      to: CONTRACT,
      onChainData: '0xcafe',
    });
    expect(await checkNonceAlreadySent(baseInput)).toEqual({
      status: 'conflict',
      txHash: TXH,
      to: CONTRACT,
      onChainData: '0xcafe',
    });

    checkNonceConsumed.mockResolvedValueOnce({
      status: 'consumed_unidentified',
      nonce: 7,
      onChainNonce: 9,
    });
    expect(await checkNonceAlreadySent(baseInput)).toEqual({
      status: 'consumed_unidentified',
      nonce: 7,
      onChainNonce: 9,
    });
  });
});
