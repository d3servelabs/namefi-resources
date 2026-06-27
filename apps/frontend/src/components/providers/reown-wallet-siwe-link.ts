import type {
  LinkedAccountWithMetadata,
  WalletWithMetadata,
} from '@privy-io/react-auth';

export const SIWE_LINK_RETRY_COOLDOWN_MS = 60_000;

export function getWalletSiweLinkKey(userId: string, address: string): string {
  return `${userId}:${address.toLowerCase()}`;
}

export function connectedWalletMatchesTarget({
  status,
  address,
  targetAddress,
}: {
  status: string;
  address: string | undefined;
  targetAddress?: string;
}): boolean {
  if (status !== 'connected' || !address) return false;
  return (
    targetAddress === undefined ||
    address.toLowerCase() === targetAddress.toLowerCase()
  );
}

export function isEthereumWalletAlreadyLinked(
  linkedAccounts: LinkedAccountWithMetadata[] | undefined,
  lowerAddress: string,
): boolean {
  return (linkedAccounts ?? []).some(
    (account) =>
      account.type === 'wallet' &&
      (account as WalletWithMetadata).chainType === 'ethereum' &&
      (account as WalletWithMetadata).address?.toLowerCase() === lowerAddress,
  );
}

export function shouldStartSiweLink({
  hasExplicitRequest,
  hasTransientLink,
  isInFlight,
  failedAt,
  now,
  alreadyLinked,
}: {
  hasExplicitRequest: boolean;
  hasTransientLink: boolean;
  isInFlight: boolean;
  failedAt: number | undefined;
  now: number;
  alreadyLinked: boolean;
}): boolean {
  if (alreadyLinked || hasTransientLink || isInFlight || !hasExplicitRequest) {
    return false;
  }

  return (
    failedAt === undefined || now - failedAt >= SIWE_LINK_RETRY_COOLDOWN_MS
  );
}

export function shouldRecordWalletSiweLinkRequest({
  ready,
  authenticated,
  hasUser,
}: {
  ready: boolean;
  authenticated: boolean;
  hasUser: boolean;
}): boolean {
  return ready && authenticated && hasUser;
}

export function getWalletSiweLinkRequestAddress({
  connectedAddress,
  hookAddress,
  hookIsConnected,
}: {
  connectedAddress?: string;
  hookAddress?: string;
  hookIsConnected: boolean;
}): string | undefined {
  return connectedAddress ?? (hookIsConnected ? hookAddress : undefined);
}

export function clearWalletSiweLinkRequestsOnLogout({
  requestedLinkKeys,
  ready,
  authenticated,
}: {
  requestedLinkKeys: Set<string>;
  ready: boolean;
  authenticated: boolean;
}): boolean {
  if (!ready || authenticated) return false;

  requestedLinkKeys.clear();
  return true;
}

export function recordWalletSiweLinkRequest({
  requestedLinkKeys,
  key,
  ready,
  authenticated,
  hasUser,
}: {
  requestedLinkKeys: Set<string>;
  key: string;
  ready: boolean;
  authenticated: boolean;
  hasUser: boolean;
}): boolean {
  if (!shouldRecordWalletSiweLinkRequest({ ready, authenticated, hasUser })) {
    return false;
  }

  requestedLinkKeys.add(key);
  return true;
}

export function abortWalletSiweLinkIfWalletChanged({
  isSameWalletConnected,
  requestedLinkKeys,
  key,
}: {
  isSameWalletConnected: () => boolean;
  requestedLinkKeys: Set<string>;
  key: string;
}): boolean {
  if (isSameWalletConnected()) return false;

  requestedLinkKeys.delete(key);
  return true;
}
