import { describe, expect, it } from 'vitest';
import {
  abortWalletSiweLinkIfWalletChanged,
  clearWalletSiweLinkRequestsOnLogout,
  connectedWalletMatchesTarget,
  getWalletSiweLinkRequestAddress,
  getWalletSiweLinkKey,
  isEthereumWalletAlreadyLinked,
  recordWalletSiweLinkRequest,
  shouldRecordWalletSiweLinkRequest,
  shouldStartSiweLink,
  SIWE_LINK_RETRY_COOLDOWN_MS,
} from './reown-wallet-siwe-link';

describe('wallet SIWE link gating', () => {
  it('does not start SIWE for a passively restored unlinked wallet', () => {
    expect(
      shouldStartSiweLink({
        hasExplicitRequest: false,
        hasTransientLink: false,
        isInFlight: false,
        failedAt: undefined,
        now: 1_000,
        alreadyLinked: false,
      }),
    ).toBe(false);
  });

  it('starts SIWE when the user explicitly requested wallet linking', () => {
    expect(
      shouldStartSiweLink({
        hasExplicitRequest: true,
        hasTransientLink: false,
        isInFlight: false,
        failedAt: undefined,
        now: 1_000,
        alreadyLinked: false,
      }),
    ).toBe(true);
  });

  it('records explicit link intent only for a ready authenticated Privy user', () => {
    expect(
      shouldRecordWalletSiweLinkRequest({
        ready: true,
        authenticated: true,
        hasUser: true,
      }),
    ).toBe(true);

    expect(
      shouldRecordWalletSiweLinkRequest({
        ready: false,
        authenticated: true,
        hasUser: true,
      }),
    ).toBe(false);
    expect(
      shouldRecordWalletSiweLinkRequest({
        ready: true,
        authenticated: false,
        hasUser: true,
      }),
    ).toBe(false);
    expect(
      shouldRecordWalletSiweLinkRequest({
        ready: true,
        authenticated: true,
        hasUser: false,
      }),
    ).toBe(false);
  });

  it('stores explicit link intent in the caller-owned request set', () => {
    const requestedLinkKeys = new Set<string>();

    expect(
      recordWalletSiweLinkRequest({
        requestedLinkKeys,
        key: 'user-1:0xabc',
        ready: true,
        authenticated: true,
        hasUser: true,
      }),
    ).toBe(true);
    expect(requestedLinkKeys.has('user-1:0xabc')).toBe(true);

    expect(
      recordWalletSiweLinkRequest({
        requestedLinkKeys,
        key: 'user-1:0xdef',
        ready: true,
        authenticated: false,
        hasUser: true,
      }),
    ).toBe(false);
    expect(requestedLinkKeys.has('user-1:0xdef')).toBe(false);
  });

  it('uses the freshly settled account address before stale hook state', () => {
    const connectedAddress = '0x00000000000000000000000000000000000000aA';

    expect(
      getWalletSiweLinkRequestAddress({
        connectedAddress,
        hookAddress: undefined,
        hookIsConnected: false,
      }),
    ).toBe(connectedAddress);
    expect(
      getWalletSiweLinkRequestAddress({
        connectedAddress,
        hookAddress: '0x00000000000000000000000000000000000000bb',
        hookIsConnected: true,
      }),
    ).toBe(connectedAddress);
    expect(
      getWalletSiweLinkRequestAddress({
        hookAddress: connectedAddress,
        hookIsConnected: true,
      }),
    ).toBe(connectedAddress);
  });

  it('clears pending explicit link requests when Privy is logged out', () => {
    const requestedLinkKeys = new Set(['user-1:0xabc', 'user-1:0xdef']);

    expect(
      clearWalletSiweLinkRequestsOnLogout({
        requestedLinkKeys,
        ready: false,
        authenticated: false,
      }),
    ).toBe(false);
    expect(requestedLinkKeys.size).toBe(2);

    expect(
      clearWalletSiweLinkRequestsOnLogout({
        requestedLinkKeys,
        ready: true,
        authenticated: true,
      }),
    ).toBe(false);
    expect(requestedLinkKeys.size).toBe(2);

    expect(
      clearWalletSiweLinkRequestsOnLogout({
        requestedLinkKeys,
        ready: true,
        authenticated: false,
      }),
    ).toBe(true);
    expect(requestedLinkKeys.size).toBe(0);
  });

  it('does not start SIWE for linked, transiently linked, or in-flight wallets', () => {
    const base = {
      hasExplicitRequest: true,
      hasTransientLink: false,
      isInFlight: false,
      failedAt: undefined,
      now: 1_000,
      alreadyLinked: false,
    };

    expect(shouldStartSiweLink({ ...base, alreadyLinked: true })).toBe(false);
    expect(shouldStartSiweLink({ ...base, hasTransientLink: true })).toBe(
      false,
    );
    expect(shouldStartSiweLink({ ...base, isInFlight: true })).toBe(false);
  });

  it('honors the retry cooldown only after an explicit request', () => {
    expect(
      shouldStartSiweLink({
        hasExplicitRequest: true,
        hasTransientLink: false,
        isInFlight: false,
        failedAt: 1_000,
        now: 1_000 + SIWE_LINK_RETRY_COOLDOWN_MS - 1,
        alreadyLinked: false,
      }),
    ).toBe(false);

    expect(
      shouldStartSiweLink({
        hasExplicitRequest: true,
        hasTransientLink: false,
        isInFlight: false,
        failedAt: 1_000,
        now: 1_000 + SIWE_LINK_RETRY_COOLDOWN_MS,
        alreadyLinked: false,
      }),
    ).toBe(true);
  });

  it('normalizes SIWE link keys and linked wallet matching', () => {
    const address = '0x00000000000000000000000000000000000000aA';

    expect(getWalletSiweLinkKey('user-1', address)).toBe(
      'user-1:0x00000000000000000000000000000000000000aa',
    );
    expect(
      isEthereumWalletAlreadyLinked(
        [
          {
            type: 'wallet',
            chainType: 'ethereum',
            address,
          },
        ] as never,
        '0x00000000000000000000000000000000000000aa',
      ),
    ).toBe(true);
  });

  it('matches connected wallet requests only when the active address is the target', () => {
    const activeAddress = '0x00000000000000000000000000000000000000aA';
    const targetAddress = '0x00000000000000000000000000000000000000bb';

    expect(
      connectedWalletMatchesTarget({
        status: 'connected',
        address: activeAddress,
      }),
    ).toBe(true);
    expect(
      connectedWalletMatchesTarget({
        status: 'connected',
        address: activeAddress,
        targetAddress: activeAddress.toLowerCase(),
      }),
    ).toBe(true);
    expect(
      connectedWalletMatchesTarget({
        status: 'connected',
        address: activeAddress,
        targetAddress,
      }),
    ).toBe(false);
    expect(
      connectedWalletMatchesTarget({
        status: 'disconnected',
        address: activeAddress,
        targetAddress: activeAddress,
      }),
    ).toBe(false);
  });

  it('drops the explicit link request when the wallet changes mid-SIWE', () => {
    const requestedLinkKeys = new Set(['user-1:0xabc']);

    expect(
      abortWalletSiweLinkIfWalletChanged({
        isSameWalletConnected: () => false,
        requestedLinkKeys,
        key: 'user-1:0xabc',
      }),
    ).toBe(true);
    expect(requestedLinkKeys.has('user-1:0xabc')).toBe(false);
  });

  it('keeps the explicit link request while the same wallet is still connected', () => {
    const requestedLinkKeys = new Set(['user-1:0xabc']);

    expect(
      abortWalletSiweLinkIfWalletChanged({
        isSameWalletConnected: () => true,
        requestedLinkKeys,
        key: 'user-1:0xabc',
      }),
    ).toBe(false);
    expect(requestedLinkKeys.has('user-1:0xabc')).toBe(true);
  });
});
