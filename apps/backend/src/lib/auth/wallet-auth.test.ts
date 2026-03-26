import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockReadContractByChain = new Map<number, ReturnType<typeof vi.fn>>();
const mockGetViemPublicClient = vi.fn((chainId: number) => ({
  readContract:
    mockReadContractByChain.get(chainId) ?? vi.fn().mockResolvedValue(false),
}));

vi.mock('@namefi-astra/db', () => ({
  db: {
    query: {
      usersTable: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
  },
  usersTable: {
    privyUserId: 'privy_user_id',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}));

vi.mock('#lib/crypto/viem-clients', () => ({
  getViemPublicClient: (chainId: number) => mockGetViemPublicClient(chainId),
}));

vi.mock('#lib/logger', () => ({
  logger: {
    trace: vi.fn(),
  },
}));

vi.mock('#trpc/utils', () => ({
  privyClient: {
    getUserByWalletAddress: vi.fn(),
    importUser: vi.fn(),
  },
}));

const {
  ERC1271_ACCOUNT_HEADER,
  EIP1271_ACCOUNT_HEADER,
  EIP7702_ACCOUNT_HEADER,
  findFirstApprovedSignerAddress,
  getDelegatedAccountHeaderValue,
  parseEip7702AccountAddress,
  resolveAuthenticatedWalletAddress,
} = await import('./wallet-auth');

const signerAddress = '0x000000000000000000000000000000000000dEaD';
const delegatorAddress = '0x000000000000000000000000000000000000bEEF';

describe('wallet auth delegation helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadContractByChain = new Map();
  });

  it('parses a missing EIP-7702 account header as null', () => {
    expect(parseEip7702AccountAddress(undefined)).toEqual({
      valid: true,
      accountAddress: null,
    });
  });

  it('rejects an invalid EIP-7702 account header', () => {
    expect(parseEip7702AccountAddress('not-an-address')).toEqual({
      valid: false,
      error: `Invalid ${EIP7702_ACCOUNT_HEADER} or ${ERC1271_ACCOUNT_HEADER} or ${EIP1271_ACCOUNT_HEADER} header`,
    });
  });

  it('prefers the EIP-7702 header when both delegated account headers are set', () => {
    expect(
      getDelegatedAccountHeaderValue({
        [EIP1271_ACCOUNT_HEADER]: delegatorAddress,
        [EIP7702_ACCOUNT_HEADER]: signerAddress,
      }),
    ).toBe(signerAddress);
  });

  it('prefers the ERC-1271 header over the EIP-1271 legacy alias', () => {
    expect(
      getDelegatedAccountHeaderValue({
        [EIP1271_ACCOUNT_HEADER]: delegatorAddress,
        [ERC1271_ACCOUNT_HEADER]: signerAddress,
      }),
    ).toBe(signerAddress);
  });

  it('falls back to the ERC-1271 header when the EIP-7702 header is absent', () => {
    expect(
      getDelegatedAccountHeaderValue({
        [ERC1271_ACCOUNT_HEADER]: delegatorAddress,
      }),
    ).toBe(delegatorAddress);
  });

  it('falls back to the EIP-1271 legacy alias when newer headers are absent', () => {
    expect(
      getDelegatedAccountHeaderValue({
        [EIP1271_ACCOUNT_HEADER]: delegatorAddress,
      }),
    ).toBe(delegatorAddress);
  });

  it('returns the first approved signer found across the provided chains', async () => {
    mockReadContractByChain.set(1, vi.fn().mockResolvedValue(false));
    mockReadContractByChain.set(8453, vi.fn().mockResolvedValue(true));

    const approvedSignerAddress = await findFirstApprovedSignerAddress({
      delegatorAddress,
      challengingAddresses: [signerAddress],
      chainIds: [1, 8453],
    });

    expect(approvedSignerAddress).toBe(signerAddress);
    expect(mockGetViemPublicClient).toHaveBeenNthCalledWith(1, 1);
    expect(mockGetViemPublicClient).toHaveBeenNthCalledWith(2, 8453);
  });

  it('keeps the signer as the authenticated wallet when no delegator header is set', async () => {
    await expect(
      resolveAuthenticatedWalletAddress({
        signerAddress,
        chainIds: [8453],
      }),
    ).resolves.toEqual({
      valid: true,
      walletAddress: signerAddress,
    });
  });

  it('maps the authenticated wallet to the delegator when the signer is approved', async () => {
    mockReadContractByChain.set(8453, vi.fn().mockResolvedValue(true));

    await expect(
      resolveAuthenticatedWalletAddress({
        signerAddress,
        delegatorAddress,
        chainIds: [8453],
      }),
    ).resolves.toEqual({
      valid: true,
      walletAddress: delegatorAddress,
    });
  });

  it('fails closed when the signer is not approved for the delegator', async () => {
    mockReadContractByChain.set(8453, vi.fn().mockResolvedValue(false));

    await expect(
      resolveAuthenticatedWalletAddress({
        signerAddress,
        delegatorAddress,
        chainIds: [8453],
      }),
    ).resolves.toEqual({
      valid: false,
      error: `Signer is not an approved signer for ${EIP7702_ACCOUNT_HEADER} or ${ERC1271_ACCOUNT_HEADER} or ${EIP1271_ACCOUNT_HEADER}`,
    });
  });
});
