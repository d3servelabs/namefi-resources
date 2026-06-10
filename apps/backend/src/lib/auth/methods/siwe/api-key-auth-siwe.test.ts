import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockGetSiweDetailsFromToken = vi.fn();
let mockGetUserOrCreateByWalletAddress = vi.fn();

vi.mock('#lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('#lib/auth/wallet-auth', () => ({
  getUserOrCreateByWalletAddress: (...args: unknown[]) =>
    mockGetUserOrCreateByWalletAddress(...args),
}));

vi.mock('./api-key-siwe', () => ({
  SIWE_SIGNATURE_HEADER_HEADERS: {
    TOKEN: 'x-namefi-siwe-token',
  },
  SIWE_SIGNATURE_HEADER_METHOD_ID: 'siwe',
  getSiweDetailsFromToken: (...args: unknown[]) =>
    mockGetSiweDetailsFromToken(...args),
}));

const { authenticateWithSiweTokenFromHeader } = await import(
  './api-key-auth-siwe'
);

describe('authenticateWithSiweTokenFromHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiweDetailsFromToken = vi.fn();
    mockGetUserOrCreateByWalletAddress = vi.fn();
  });

  it('authenticates as the delegator when the SIWE session stores one', async () => {
    const user = { id: 'user-1', privyUserId: 'privy-1' };

    mockGetSiweDetailsFromToken.mockResolvedValue({
      token: 'token-1',
      session: {
        address: '0x000000000000000000000000000000000000dEaD',
        delegatorAddress: '0x000000000000000000000000000000000000bEEF',
        chainId: 8453,
        createdAt: new Date().toISOString(),
        maxAgeSeconds: 3600,
      },
    });
    mockGetUserOrCreateByWalletAddress.mockResolvedValue(user);

    const result = await authenticateWithSiweTokenFromHeader({
      headers: {
        'x-namefi-siwe-token': 'token-1',
      },
      rawBody: '',
      path: '/v-next/test',
      method: 'GET',
      clientIp: null,
      origin: null,
    });

    expect(mockGetUserOrCreateByWalletAddress).toHaveBeenCalledWith(
      '0x000000000000000000000000000000000000bEEF',
    );
    expect(result).toEqual({
      success: true,
      user,
      chainId: 8453,
    });
  });

  it('falls back to the signer when no delegator is stored on the session', async () => {
    const user = { id: 'user-2', privyUserId: 'privy-2' };

    mockGetSiweDetailsFromToken.mockResolvedValue({
      token: 'token-2',
      session: {
        address: '0x000000000000000000000000000000000000dEaD',
        delegatorAddress: null,
        chainId: 8453,
        createdAt: new Date().toISOString(),
        maxAgeSeconds: 3600,
      },
    });
    mockGetUserOrCreateByWalletAddress.mockResolvedValue(user);

    const result = await authenticateWithSiweTokenFromHeader({
      headers: {
        'x-namefi-siwe-token': 'token-2',
      },
      rawBody: '',
      path: '/v-next/test',
      method: 'GET',
      clientIp: null,
      origin: null,
    });

    expect(mockGetUserOrCreateByWalletAddress).toHaveBeenCalledWith(
      '0x000000000000000000000000000000000000dEaD',
    );
    expect(result).toEqual({
      success: true,
      user,
      chainId: 8453,
    });
  });
});
