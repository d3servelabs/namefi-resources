import {
  type ChecksumWalletAddress,
  checksumWalletAddressSchema,
} from '@namefi-astra/utils';
import { PrivyClient, type User } from '@privy-io/server-auth';
import { isNotNil } from 'ramda';
import { config, secrets } from '#lib/env';
import { getPoweredByNamefiDomainFromHostname } from '#lib/namefi-registry';
import { logger } from '#lib/logger';

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

export async function isUserAdmin(privyUserId: string): Promise<boolean> {
  try {
    const privyUser = await privyClient.getUserById(privyUserId);
    if (!privyUser) return false;
    const userWallets = getPrivyUserLinkedEthereumWalletAddresses({
      privyUser,
    }).map((a) => a.toLowerCase());
    if (userWallets.length === 0) return false;
    const adminWallets = new Set(
      (config.ADMIN_WALLET_ADDRESSES ?? []).map((a) => a.toLowerCase()),
    );
    return userWallets.some((wallet) => adminWallets.has(wallet));
  } catch (error) {
    logger.error(
      { error, privyUserId },
      'isUserAdmin failed for %s',
      privyUserId,
    );
    return false; // fail closed
  }
}
