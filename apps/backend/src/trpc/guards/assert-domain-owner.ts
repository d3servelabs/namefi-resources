import { type UserSelect, db, namefiNftOwnersView } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { privyClient } from '../utils';

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
