'use client';

import { useCallback } from 'react';
import { type Address, getAddress, isAddressEqual } from 'viem';
import {
  type Config,
  useConfig,
  type UseConfigParameters,
  useSwitchChain,
} from 'wagmi';
import { getAccount, getWalletClient, watchAccount } from 'wagmi/actions';

const DEFAULT_ACCOUNT_READY_TIMEOUT_MS = 5000;

export interface ResolveWalletActionClientOptions {
  chainId: number;
  expectedAddress?: string;
  accountReadyTimeoutMs?: number;
}

interface ResolveWalletActionClientDeps
  extends ResolveWalletActionClientOptions {
  config: Config;
  switchChainAsync: (parameters: { chainId: number }) => Promise<unknown>;
}

const normalizeExpectedAddress = (address: string | undefined) =>
  address ? getAddress(address as Address) : undefined;

async function waitForAccountReady({
  config,
  expectedAddress,
  expectedChainId,
  timeoutMs,
}: {
  config: Config;
  expectedAddress: Address | undefined;
  expectedChainId?: number | undefined;
  timeoutMs: number;
}) {
  const isReady = () => {
    const account = getAccount(config);
    if (account.status !== 'connected' || !account.address) {
      return false;
    }
    const addressMatches = expectedAddress
      ? isAddressEqual(account.address, expectedAddress)
      : true;
    const chainMatches =
      expectedChainId === undefined || account.chainId === expectedChainId;
    return addressMatches && chainMatches;
  };

  if (isReady()) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    let unwatch: () => void = () => undefined;
    const timeout = globalThis.setTimeout(() => {
      unwatch();
      reject(new Error('Wallet connection did not become ready in time.'));
    }, timeoutMs);

    unwatch = watchAccount(config, {
      onChange() {
        if (!isReady()) {
          return;
        }
        globalThis.clearTimeout(timeout);
        unwatch();
        resolve();
      },
    });

    if (isReady()) {
      globalThis.clearTimeout(timeout);
      unwatch();
      resolve();
    }
  });
}

export async function resolveWalletActionClient({
  config,
  switchChainAsync,
  chainId,
  expectedAddress,
  accountReadyTimeoutMs = DEFAULT_ACCOUNT_READY_TIMEOUT_MS,
}: ResolveWalletActionClientDeps) {
  const normalizedExpectedAddress = normalizeExpectedAddress(expectedAddress);

  await waitForAccountReady({
    config,
    expectedAddress: normalizedExpectedAddress,
    timeoutMs: accountReadyTimeoutMs,
  });

  await switchChainAsync({ chainId });
  await waitForAccountReady({
    config,
    expectedAddress: normalizedExpectedAddress,
    expectedChainId: chainId,
    timeoutMs: accountReadyTimeoutMs,
  });

  const account = getAccount(config);
  // Re-read after the async wait/switch path; wallet state can change between
  // readiness and client resolution.
  if (account.status !== 'connected' || !account.address) {
    throw new Error('Wallet connection did not become ready in time.');
  }
  if (
    normalizedExpectedAddress &&
    !isAddressEqual(account.address, normalizedExpectedAddress)
  ) {
    throw new Error('Connected wallet does not match the requested wallet.');
  }
  if (account.chainId !== chainId) {
    throw new Error('Connected wallet is on the wrong network.');
  }

  const walletClient = await getWalletClient(config, {
    chainId,
    account: account.address,
  });

  if (!walletClient.account) {
    throw new Error('Wallet client did not provide an active account.');
  }

  if (!isAddressEqual(walletClient.account.address, account.address)) {
    throw new Error('Connected wallet does not match the requested wallet.');
  }

  if (!walletClient.chain || walletClient.chain.id !== chainId) {
    throw new Error('Connected wallet is on the wrong network.');
  }

  return walletClient;
}

export function useWalletActionClient(
  parameters?: UseConfigParameters<Config> | undefined,
) {
  const config = useConfig(parameters);
  const { switchChainAsync } = useSwitchChain({ config });

  return useCallback(
    (options: ResolveWalletActionClientOptions) =>
      resolveWalletActionClient({
        ...options,
        config,
        switchChainAsync,
      }),
    [config, switchChainAsync],
  );
}
