import {
  type UserSelect,
  db,
  namefiNftOwnersCte,
  namefiNftOwnersView,
} from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient,
} from '../utils';
import { getViemPublicClient } from '#lib/crypto/viem-clients';
import { parseAbi } from 'viem';

/**
 * Helper function to verify if the authenticated user is the owner of a domain NFT
 * @param normalizedDomainName - The normalized domain name to check ownership for
 * @param user - The authenticated user object
 */
export async function assertAuthenticatedUserIsDomainOwner(
  normalizedDomainName: NamefiNormalizedDomain,
  user: UserSelect,
): Promise<void> {
  // Verify user has permission to manage DNS records for this domain
  const isUserDomainOwner = await IsUserDomainOwner(normalizedDomainName, user);

  if (!isUserDomainOwner) {
    const signer = await privyClient.getUserById(user.privyUserId);
    const wallets = getPrivyUserLinkedEthereumChecksumWalletAddresses({
      privyUser: signer,
    });
    const hasDelegatedAccess = await areAnyAddressAnApprovedSigner(
      normalizedDomainName,
      wallets,
    );

    if (hasDelegatedAccess) {
      return;
    }

    throw new TRPCError({
      code: 'FORBIDDEN',
      message:
        'You do not have permission to manage DNS records for this domain',
    });
  }
}

export async function IsUserDomainOwner(
  normalizedDomainName: NamefiNormalizedDomain,
  user: UserSelect,
) {
  // Verify user has permission to manage DNS records for this domain
  const nft = await db
    .with(namefiNftOwnersCte)
    .select()
    .from(namefiNftOwnersView)
    .where(eq(namefiNftOwnersView.normalizedDomainName, normalizedDomainName))
    .limit(1);

  if (!nft[0]) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Domain NFT not found',
    });
  }

  const nftOwnerUser = await privyClient.getUserByWalletAddress(
    nft[0].ownerAddress,
  );

  return nftOwnerUser?.id === user.privyUserId;
}

const abi = parseAbi([
  'event SignerAdded(address indexed signer)',
  'event SignerRemoved(address indexed signer)',
  'function approvedSigners(address signer) view returns (bool)',
]);

export async function areAnyAddressAnApprovedSigner(
  normalizedDomainName: NamefiNormalizedDomain,
  challengingAddresses: string[],
): Promise<string | boolean> {
  // Verify user has permission to manage DNS records for this domain
  const nfts = await db
    .with(namefiNftOwnersCte)
    .select()
    .from(namefiNftOwnersView)
    .where(eq(namefiNftOwnersView.normalizedDomainName, normalizedDomainName))
    .limit(1);
  const nft = nfts[0];

  if (!nft) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Domain NFT not found',
    });
  }
  const nftOwnerAddress = nft.ownerAddress as `0x${string}`;

  const publicClient = getViemPublicClient(nft.chainId);
  for (const address of challengingAddresses) {
    try {
      const value = await publicClient.readContract({
        address: nftOwnerAddress,
        abi,
        functionName: 'approvedSigners',
        args: [address as `0x${string}`],
      });
      if (value) {
        return address;
      }
    } catch (e) {}
  }

  return false;
}
