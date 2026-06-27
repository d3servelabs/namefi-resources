export interface WagmiAccountSnapshot {
  status: string;
  address?: string;
  chainId?: number;
}

export interface SiweLoginTarget {
  address: string;
  caip2ChainId: `eip155:${number}`;
}

export interface WalletSignInConnectFlowResult {
  openedWalletModal: boolean;
  completedSiweLogin: boolean;
}

export function getAlreadyConnectedSiweTarget(
  account: WagmiAccountSnapshot,
): SiweLoginTarget | null {
  if (
    account.status !== 'connected' ||
    !account.address ||
    account.chainId === undefined
  ) {
    return null;
  }

  return {
    address: account.address,
    caip2ChainId: `eip155:${account.chainId}`,
  };
}

export function isSameSiweLoginTarget(
  current: SiweLoginTarget | null,
  expected: SiweLoginTarget,
): boolean {
  return (
    current !== null &&
    current.caip2ChainId === expected.caip2ChainId &&
    current.address.toLowerCase() === expected.address.toLowerCase()
  );
}

export async function runWalletSignInConnectFlow({
  readAccount,
  openWalletModal,
  waitForConnectFlowSettled,
  completeSiweLogin,
}: {
  readAccount: () => WagmiAccountSnapshot;
  openWalletModal: () => Promise<unknown>;
  waitForConnectFlowSettled: () => Promise<void>;
  completeSiweLogin: (target: SiweLoginTarget) => Promise<void>;
}): Promise<WalletSignInConnectFlowResult> {
  const alreadyConnected = getAlreadyConnectedSiweTarget(readAccount());
  if (alreadyConnected) {
    await completeSiweLogin(alreadyConnected);
    return { openedWalletModal: false, completedSiweLogin: true };
  }

  await openWalletModal();
  await waitForConnectFlowSettled();
  const connected = getAlreadyConnectedSiweTarget(readAccount());
  if (!connected) {
    return { openedWalletModal: true, completedSiweLogin: false };
  }

  await completeSiweLogin(connected);
  return { openedWalletModal: true, completedSiweLogin: true };
}
