import {
  type UserInsert,
  type UserSelect,
  db,
  usersTable,
} from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { type Address, getAddress, parseAbi } from 'viem';
import { getViemPublicClient } from '#lib/crypto/viem-clients';
import { logger } from '#lib/logger';
import { privyClient } from '#trpc/utils';

export const EIP7702_ACCOUNT_HEADER = 'x-namefi-eip7702-account' as const;
export const EIP1271_ACCOUNT_HEADER = 'x-namefi-eip1271-account' as const;
export const ERC1271_ACCOUNT_HEADER = 'x-namefi-erc1271-account' as const;
export const DELEGATED_ACCOUNT_HEADERS = [
  EIP7702_ACCOUNT_HEADER,
  ERC1271_ACCOUNT_HEADER,
  EIP1271_ACCOUNT_HEADER,
] as const;

function getDelegatedAccountHeaderLabel(): string {
  return DELEGATED_ACCOUNT_HEADERS.join(' or ');
}

const approvedSignerAbi = parseAbi([
  'function approvedSigners(address signer) view returns (bool)',
]);

async function getUserRowOrCreate(
  userInsert: UserInsert,
): Promise<UserSelect | null> {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.privyUserId, userInsert.privyUserId),
  });

  if (user) {
    return user;
  }

  const newUser = await db
    .insert(usersTable)
    .values({
      ...userInsert,
      lastSignInAt: new Date(),
      lastAccessedSessionAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (newUser[0]) {
    return newUser[0];
  }

  return (
    (await db.query.usersTable.findFirst({
      where: eq(usersTable.privyUserId, userInsert.privyUserId),
    })) ?? null
  );
}

async function getPrivyUserOrCreateByWalletAddress(walletAddress: string) {
  const normalizedWalletAddress = getAddress(walletAddress).toLowerCase();

  let privyUser = await privyClient.getUserByWalletAddress(
    normalizedWalletAddress,
  );

  if (!privyUser) {
    privyUser = await privyClient.importUser({
      linkedAccounts: [
        {
          type: 'wallet',
          chainType: 'ethereum',
          address: normalizedWalletAddress,
        },
      ],
    });
  }

  return privyUser ?? null;
}

function getUniqueChecksumAddresses(addresses: readonly string[]): Address[] {
  return Array.from(new Set(addresses.map((address) => getAddress(address))));
}

export async function getUserOrCreateByWalletAddress(
  walletAddress: string,
): Promise<UserSelect | null> {
  const privyUser = await getPrivyUserOrCreateByWalletAddress(walletAddress);
  if (!privyUser) {
    return null;
  }

  return await getUserRowOrCreate({
    privyUserId: privyUser.id,
  });
}

export function getDelegatedAccountHeaderValue(
  headers: Record<string, string | undefined>,
): string | undefined {
  return (
    headers[EIP7702_ACCOUNT_HEADER] ??
    headers[ERC1271_ACCOUNT_HEADER] ??
    headers[EIP1271_ACCOUNT_HEADER] ??
    undefined
  );
}

export function parseEip7702AccountAddress(accountAddress: string | undefined):
  | {
      valid: true;
      accountAddress: Address | null;
    }
  | {
      valid: false;
      error: string;
    } {
  if (!accountAddress) {
    return {
      valid: true,
      accountAddress: null,
    };
  }

  try {
    return {
      valid: true,
      accountAddress: getAddress(accountAddress),
    };
  } catch {
    return {
      valid: false,
      error: `Invalid ${getDelegatedAccountHeaderLabel()} header`,
    };
  }
}

/**
 * @deprecated Use EIP-1271 verification via `verifyTypedDataWithEip1271` or
 * `verifyMessageWithEip1271` from `#lib/auth/eip1271-verify` instead.
 * Retained for `assert-domain-owner.ts` which needs address-only checks
 * without a signature.
 */
export async function findFirstApprovedSignerAddress(params: {
  delegatorAddress: string;
  challengingAddresses: readonly string[];
  chainIds: readonly number[];
}): Promise<Address | null> {
  const normalizedDelegatorAddress = getAddress(params.delegatorAddress);
  const normalizedChallengingAddresses = getUniqueChecksumAddresses(
    params.challengingAddresses,
  );

  for (const chainId of new Set(params.chainIds)) {
    const publicClient = getViemPublicClient(chainId);

    for (const challengingAddress of normalizedChallengingAddresses) {
      try {
        const isApprovedSigner = await publicClient.readContract({
          address: normalizedDelegatorAddress,
          abi: approvedSignerAbi,
          functionName: 'approvedSigners',
          args: [challengingAddress],
        });

        if (isApprovedSigner) {
          return challengingAddress;
        }
      } catch (error) {
        logger.trace(
          {
            chainId,
            delegatorAddress: normalizedDelegatorAddress,
            challengingAddress,
            error,
          },
          'Approved signer check failed',
        );
      }
    }
  }

  return null;
}

/**
 * @deprecated Auth callers should migrate to EIP-1271 wrappers from
 * `#lib/auth/eip1271-verify` which validate signatures directly on-chain
 * via `isValidSignature`, eliminating the need for `approvedSigners` checks.
 */
export async function resolveAuthenticatedWalletAddress(params: {
  signerAddress: string;
  delegatorAddress?: string | null;
  chainIds: readonly number[];
}): Promise<
  | {
      valid: true;
      walletAddress: Address;
    }
  | {
      valid: false;
      error: string;
    }
> {
  const normalizedSignerAddress = getAddress(params.signerAddress);

  if (!params.delegatorAddress) {
    return {
      valid: true,
      walletAddress: normalizedSignerAddress,
    };
  }

  const parsedDelegatorAddress = parseEip7702AccountAddress(
    params.delegatorAddress,
  );

  if (!parsedDelegatorAddress.valid) {
    return parsedDelegatorAddress;
  }

  if (!parsedDelegatorAddress.accountAddress) {
    return {
      valid: true,
      walletAddress: normalizedSignerAddress,
    };
  }

  if (parsedDelegatorAddress.accountAddress === normalizedSignerAddress) {
    return {
      valid: true,
      walletAddress: parsedDelegatorAddress.accountAddress,
    };
  }

  const approvedSignerAddress = await findFirstApprovedSignerAddress({
    delegatorAddress: parsedDelegatorAddress.accountAddress,
    challengingAddresses: [normalizedSignerAddress],
    chainIds: params.chainIds,
  });

  if (!approvedSignerAddress) {
    return {
      valid: false,
      error: `Signer is not an approved signer for ${getDelegatedAccountHeaderLabel()}`,
    };
  }

  return {
    valid: true,
    walletAddress: parsedDelegatorAddress.accountAddress,
  };
}
