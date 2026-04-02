import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Address, Hex } from 'viem';

const ERC1271_MAGIC_VALUE = '0x1626ba7e';
const NON_MAGIC_VALUE = '0xffffffff';

let mockReadContractByChain = new Map<number, ReturnType<typeof vi.fn>>();
const mockGetViemPublicClient = vi.fn((chainId: number) => ({
  readContract:
    mockReadContractByChain.get(chainId) ??
    vi.fn().mockRejectedValue(new Error('Contract call failed')),
}));

vi.mock('#lib/crypto/viem-clients', () => ({
  getViemPublicClient: (chainId: number) => mockGetViemPublicClient(chainId),
}));

vi.mock('#lib/env/allowed-chains', () => ({
  getConfiguredAllowedChainIds: vi.fn(() => [1, 8453]),
}));

vi.mock('#lib/logger', () => ({
  logger: {
    trace: vi.fn(),
  },
}));

const mockVerifyTypedData = vi.fn();
const mockVerifyMessage = vi.fn();
const mockHashTypedData = vi.fn().mockReturnValue('0xabcdef1234567890');
const mockHashMessage = vi.fn().mockReturnValue('0x1234567890abcdef');

vi.mock('viem', () => ({
  verifyTypedData: (...args: unknown[]) => mockVerifyTypedData(...args),
  verifyMessage: (...args: unknown[]) => mockVerifyMessage(...args),
  hashTypedData: (...args: unknown[]) => mockHashTypedData(...args),
  hashMessage: (...args: unknown[]) => mockHashMessage(...args),
  parseAbi: (strs: string[]) => strs,
  getAddress: (addr: string) => addr,
}));

const {
  callIsValidSignature,
  verifyTypedDataWithEip1271,
  verifyMessageWithEip1271,
} = await import('./eip1271-verify');

const contractAddress = '0x000000000000000000000000000000000000bEEF' as Address;
const signerAddress = '0x000000000000000000000000000000000000dEaD' as Address;
const testHash = '0xabcdef1234567890' as Hex;
const testSignature = '0xdeadbeef' as Hex;

const typedDataParams = {
  address: signerAddress,
  domain: { name: 'Namefi', version: '1' },
  types: {
    Primary: [
      { name: 'timestamp', type: 'uint256' },
      { name: 'nonce', type: 'string' },
    ],
  } as Record<string, readonly { name: string; type: string }[]>,
  primaryType: 'Primary',
  message: { timestamp: 123, nonce: 'abc' },
  signature: testSignature,
};

describe('callIsValidSignature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadContractByChain = new Map();
  });

  it('returns true when contract returns the magic value', async () => {
    mockReadContractByChain.set(
      1,
      vi.fn().mockResolvedValue(ERC1271_MAGIC_VALUE),
    );

    const result = await callIsValidSignature({
      contractAddress,
      hash: testHash,
      signature: testSignature,
      chainIds: [1],
    });

    expect(result).toBe(true);
    expect(mockGetViemPublicClient).toHaveBeenCalledWith(1);
  });

  it('returns false when contract returns a non-magic value', async () => {
    mockReadContractByChain.set(1, vi.fn().mockResolvedValue(NON_MAGIC_VALUE));

    const result = await callIsValidSignature({
      contractAddress,
      hash: testHash,
      signature: testSignature,
      chainIds: [1],
    });

    expect(result).toBe(false);
  });

  it('iterates chains and returns true on the first match', async () => {
    mockReadContractByChain.set(1, vi.fn().mockResolvedValue(NON_MAGIC_VALUE));
    mockReadContractByChain.set(
      8453,
      vi.fn().mockResolvedValue(ERC1271_MAGIC_VALUE),
    );

    const result = await callIsValidSignature({
      contractAddress,
      hash: testHash,
      signature: testSignature,
      chainIds: [1, 8453],
    });

    expect(result).toBe(true);
    expect(mockGetViemPublicClient).toHaveBeenCalledWith(1);
    expect(mockGetViemPublicClient).toHaveBeenCalledWith(8453);
  });

  it('returns false when all chains fail', async () => {
    mockReadContractByChain.set(
      1,
      vi.fn().mockRejectedValue(new Error('revert')),
    );
    mockReadContractByChain.set(
      8453,
      vi.fn().mockRejectedValue(new Error('revert')),
    );

    const result = await callIsValidSignature({
      contractAddress,
      hash: testHash,
      signature: testSignature,
      chainIds: [1, 8453],
    });

    expect(result).toBe(false);
  });

  it('uses configured chain IDs when none are provided', async () => {
    mockReadContractByChain.set(
      1,
      vi.fn().mockResolvedValue(ERC1271_MAGIC_VALUE),
    );

    const result = await callIsValidSignature({
      contractAddress,
      hash: testHash,
      signature: testSignature,
    });

    expect(result).toBe(true);
  });

  it('deduplicates chain IDs', async () => {
    mockReadContractByChain.set(1, vi.fn().mockResolvedValue(NON_MAGIC_VALUE));

    await callIsValidSignature({
      contractAddress,
      hash: testHash,
      signature: testSignature,
      chainIds: [1, 1, 1],
    });

    expect(mockGetViemPublicClient).toHaveBeenCalledTimes(1);
  });
});

describe('verifyTypedDataWithEip1271', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadContractByChain = new Map();
  });

  it('uses isValidSignature when eip1271Account is provided', async () => {
    mockReadContractByChain.set(
      1,
      vi.fn().mockResolvedValue(ERC1271_MAGIC_VALUE),
    );

    const result = await verifyTypedDataWithEip1271({
      ...typedDataParams,
      eip1271Account: contractAddress,
      chainIds: [1],
    });

    expect(result).toBe(true);
    expect(mockHashTypedData).toHaveBeenCalledWith({
      domain: typedDataParams.domain,
      types: typedDataParams.types,
      primaryType: typedDataParams.primaryType,
      message: typedDataParams.message,
    });
    expect(mockVerifyTypedData).not.toHaveBeenCalled();
  });

  it('delegates to viem verifyTypedData when eip1271Account is not provided', async () => {
    mockVerifyTypedData.mockResolvedValue(true);

    const result = await verifyTypedDataWithEip1271(typedDataParams);

    expect(result).toBe(true);
    expect(mockVerifyTypedData).toHaveBeenCalled();
    expect(mockHashTypedData).not.toHaveBeenCalled();
  });

  it('returns false when eip1271Account contract rejects signature', async () => {
    mockReadContractByChain.set(1, vi.fn().mockResolvedValue(NON_MAGIC_VALUE));

    const result = await verifyTypedDataWithEip1271({
      ...typedDataParams,
      eip1271Account: contractAddress,
      chainIds: [1],
    });

    expect(result).toBe(false);
  });
});

describe('verifyMessageWithEip1271', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadContractByChain = new Map();
  });

  it('uses isValidSignature when eip1271Account is provided', async () => {
    mockReadContractByChain.set(
      1,
      vi.fn().mockResolvedValue(ERC1271_MAGIC_VALUE),
    );

    const result = await verifyMessageWithEip1271({
      address: signerAddress,
      message: 'Sign in to Namefi',
      signature: testSignature,
      eip1271Account: contractAddress,
      chainIds: [1],
    });

    expect(result).toBe(true);
    expect(mockHashMessage).toHaveBeenCalledWith('Sign in to Namefi');
    expect(mockVerifyMessage).not.toHaveBeenCalled();
  });

  it('delegates to viem verifyMessage when eip1271Account is not provided', async () => {
    mockVerifyMessage.mockResolvedValue(true);

    const result = await verifyMessageWithEip1271({
      address: signerAddress,
      message: 'Sign in to Namefi',
      signature: testSignature,
    });

    expect(result).toBe(true);
    expect(mockVerifyMessage).toHaveBeenCalled();
    expect(mockHashMessage).not.toHaveBeenCalled();
  });

  it('returns false when eip1271Account contract rejects signature', async () => {
    mockReadContractByChain.set(1, vi.fn().mockResolvedValue(NON_MAGIC_VALUE));

    const result = await verifyMessageWithEip1271({
      address: signerAddress,
      message: 'Sign in to Namefi',
      signature: testSignature,
      eip1271Account: contractAddress,
      chainIds: [1],
    });

    expect(result).toBe(false);
  });
});
