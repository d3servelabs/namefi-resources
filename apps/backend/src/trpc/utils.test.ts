import type { ChecksumWalletAddress } from '@namefi-astra/utils';
import type { User, WalletWithMetadata } from '@privy-io/server-auth';
import { zeroAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  getPrivyUserLinkedEthereumWalletAddresses,
} from './utils';

describe('getPrivyUserLinkedEthereumWalletAddresses', () => {
  const basePrivyUser = {
    id: 'testPrivyUser',
    createdAt: new Date(),
    isGuest: false,
    customMetadata: {},
    linkedAccounts: [],
  };

  const baseWallet = {
    type: 'wallet' as WalletWithMetadata['type'],
    firstVerifiedAt: new Date(),
    verifiedAt: new Date(),
    latestVerifiedAt: new Date(),
  };

  it('should return empty list for no wallets', async () => {
    const privyUser: User = {
      ...basePrivyUser,
      linkedAccounts: [],
    };

    const result = await getPrivyUserLinkedEthereumWalletAddresses({
      privyUser,
    });

    // Assert: Check the structure of the response
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toEqual(0);
  });

  it('should return only Ethereum wallet addresses', async () => {
    const privyUser: User = {
      ...basePrivyUser,
      linkedAccounts: [
        {
          ...baseWallet,
          address: zeroAddress,
          chainType: 'ethereum',
        },
        {
          ...baseWallet,
          address: '0x0000000000000000000000000000000000000001',
          chainType: 'ethereum',
        },
        {
          ...baseWallet,
          address: '00000000000000000000000000000000',
          chainType: 'solana',
        },
        {
          ...baseWallet,
          address: '000000000000000000000000000000001',
          chainType: 'solana',
        },
      ],
    };

    const result = await getPrivyUserLinkedEthereumWalletAddresses({
      privyUser,
    });

    // Assert: Check the structure of the response
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toEqual(2);

    expect(result.includes(zeroAddress)).toBe(true);
    expect(result.includes('0x0000000000000000000000000000000000000001')).toBe(
      true,
    );

    expect(result.includes('0x0000000000000000000000000000000000000002')).toBe(
      false,
    );
    expect(result.includes('0x0000000000000000000000000000000000000003')).toBe(
      false,
    );
  });

  it('should return wallet addresses with duplicates removed', async () => {
    const privyUser: User = {
      ...basePrivyUser,
      linkedAccounts: [
        {
          ...baseWallet,
          address: zeroAddress,
          chainType: 'ethereum',
        },
        {
          ...baseWallet,
          address: '0x0000000000000000000000000000000000000001',
          chainType: 'ethereum',
        },
        {
          ...baseWallet,
          address: zeroAddress,
          chainType: 'ethereum',
        },
      ],
    };

    const result = await getPrivyUserLinkedEthereumWalletAddresses({
      privyUser,
    });

    // Assert: Check the structure of the response
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toEqual(2);

    expect(result.includes(zeroAddress)).toBe(true);
    expect(result.includes('0x0000000000000000000000000000000000000001')).toBe(
      true,
    );
  });
});

describe('getPrivyUserLinkedEthereumChecksumWalletAddresses', () => {
  const basePrivyUser = {
    id: 'testPrivyUser',
    createdAt: new Date(),
    isGuest: false,
    customMetadata: {},
    linkedAccounts: [],
  };

  const baseWallet = {
    type: 'wallet' as WalletWithMetadata['type'],
    firstVerifiedAt: new Date(),
    verifiedAt: new Date(),
    latestVerifiedAt: new Date(),
  };

  it('should return Ethereum wallet addresses as ChecksumWalletAddresses', async () => {
    const privyUser: User = {
      ...basePrivyUser,
      linkedAccounts: [
        {
          ...baseWallet,
          address: zeroAddress,
          chainType: 'ethereum',
        },
        {
          ...baseWallet,
          address: '0x0000000000000000000000000000000000000001',
          chainType: 'ethereum',
        },
      ],
    };

    const result = await getPrivyUserLinkedEthereumChecksumWalletAddresses({
      privyUser,
    });

    // Assert: Check the structure of the response
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toEqual(2);

    expect(result.includes(zeroAddress as ChecksumWalletAddress)).toBe(true);
    expect(
      result.includes(
        '0x0000000000000000000000000000000000000001' as ChecksumWalletAddress,
      ),
    ).toBe(true);
  });

  it('should throw an error if any wallet fails the ChecksumWalletAddress parsing', async () => {
    const privyUser: User = {
      ...basePrivyUser,
      wallet: {
        ...baseWallet,
        address: zeroAddress,
        chainType: 'ethereum',
      },
      linkedAccounts: [
        {
          ...baseWallet,
          address: 'foobar',
          chainType: 'ethereum',
        },
      ],
    };

    let errorMessage = '';
    try {
      const _result = await getPrivyUserLinkedEthereumChecksumWalletAddresses({
        privyUser,
      });
    } catch (e) {
      const error = e as Error;
      errorMessage = error.message;
    }

    // Assert: Check the structure of the response
    expect(errorMessage).toEqual('Could not format wallet address');
  });
});
