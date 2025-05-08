import {
  type ChecksumWalletAddress,
  checksumWalletAddressSchema,
} from '@namefi-astra/utils';
import { PrivyClient, type User } from '@privy-io/server-auth';
import { isNotNil } from 'ramda';
import { config, secrets } from '#lib/env';

export const privyClient = new PrivyClient(
  config.PRIVY_APP_ID,
  secrets.PRIVY_APP_SECRET,
);

export const isNormalizedDomainNameAllowedForOriginHostname = (
  normalizedDomainName: string,
  originHostname?: string | null,
) => {
  if (!originHostname) {
    return true;
  }
  const acceptedHostnames = [
    originHostname,
    config.ADDITIONAL_HOSTNAME_MAP[originHostname],
  ].filter(Boolean);
  return acceptedHostnames.some((hostname) =>
    normalizedDomainName.endsWith(hostname),
  );
};

export function getPrivyUserLinkedEthereumWalletAddresses({
  privyUser,
}: { privyUser: User }): string[] {
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
}: { privyUser: User }): ChecksumWalletAddress[] {
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
