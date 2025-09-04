import {
  type ChecksumWalletAddress,
  checksumWalletAddressSchema,
} from '@namefi-astra/utils';
import { PrivyClient, type User } from '@privy-io/server-auth';
import { isNotNil } from 'ramda';
import { config, secrets } from '#lib/env';
import { getPoweredByNamefiDomainFromHostname } from '#lib/namefi-registry';
import { logger } from '#lib/logger';
import {
  db,
  usersTable,
  userPermissionsTable,
  type UserSelect,
} from '@namefi-astra/db';
import { eq, or, sql } from 'drizzle-orm';

export const privyClient = new PrivyClient(
  config.PRIVY_APP_ID,
  secrets.PRIVY_APP_SECRET,
);

/**
 * @deprecated use getPoweredByNamefiDomainFromHostname and check if the normalized domain name ends with the third party domain from the hostname instead
 * Checks if a normalized domain name is allowed for a powered by namefi domain based on the origin/hostname.
 * @param normalizedDomainName - The normalized domain name to check.
 * @param originHostname - The origin hostname to check.
 * @returns True if the normalized domain name is allowed for the origin hostname, false otherwise.
 */
export const isNormalizedDomainNameAllowedForOriginHostname = async (
  normalizedDomainName: string,
  originHostname?: string | null,
) => {
  if (!originHostname) {
    return true;
  }
  const thirdPartyDomainFromHostname =
    await getPoweredByNamefiDomainFromHostname(originHostname);
  const acceptedHostnames = [
    originHostname,
    thirdPartyDomainFromHostname ?? originHostname,
  ].filter(Boolean);
  return acceptedHostnames.some((hostname) =>
    normalizedDomainName.endsWith(hostname),
  );
};

export function getPrivyUserLinkedEthereumWalletAddresses({
  privyUser,
}: {
  privyUser: User;
}): string[] {
  const privyUserEthereumWalletAddresses = privyUser.linkedAccounts
    .map((linkedAccount) =>
      linkedAccount.type === 'wallet' && linkedAccount.chainType === 'ethereum'
        ? linkedAccount.address
        : null,
    )
    .filter((walletAddress) => isNotNil(walletAddress));

  return Array.from(new Set(privyUserEthereumWalletAddresses));
}

export function getPrivyUserLinkedEthereumChecksumWalletAddresses({
  privyUser,
}: {
  privyUser: User;
}): ChecksumWalletAddress[] {
  const privyUserLinkedChecksumWalletAddresses =
    getPrivyUserLinkedEthereumWalletAddresses({ privyUser }).map(
      (linkedWalletAddress) => {
        const checksumWalletAddress =
          checksumWalletAddressSchema.safeParse(linkedWalletAddress);
        if (!checksumWalletAddress.success) {
          throw new Error('Could not format wallet address');
        }
        return checksumWalletAddress.data;
      },
    );

  return privyUserLinkedChecksumWalletAddresses;
}

/**
 * Checks if a user is an admin type user.
 * Admin type users are users that have a permission record in the user_permissions table.
 * IE they have access to the admin panel.
 *
 * @param privyUserId - The privy user id to check.
 * @returns True if the user is an admin type user, false otherwise.
 */
export async function canUserAccessAdminPanel({
  id,
  privyUserId,
}: Pick<UserSelect, 'privyUserId' | 'id'>): Promise<boolean> {
  try {
    const user = await db.query.usersTable.findFirst({
      where: or(eq(usersTable.privyUserId, privyUserId), eq(usersTable.id, id)),
      columns: { id: true },
    });
    if (!user?.id) return false;

    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(userPermissionsTable)
      .where(eq(userPermissionsTable.userId, user.id));
    return (count ?? 0) > 0;
  } catch (error) {
    logger.error(
      { error, id, privyUserId },
      'canUserAccessAdminPanel check failed',
    );
    return false; // fail closed
  }
}
