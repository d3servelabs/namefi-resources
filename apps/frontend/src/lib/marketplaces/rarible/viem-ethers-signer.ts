import type { ethers } from 'ethers';
import type { WalletClient } from 'viem';
import { providers } from 'ethers';
import { useMemo } from 'react';
import { type Config, useClient, useConnectorClient } from 'wagmi';
import type { Account, Chain, Client, Transport } from 'viem';

export function clientToSigner<
  C extends Client<Transport, Chain | undefined, Account | undefined>,
>(client: C) {
  const { account, chain, transport } = client;
  if (!chain || !account) {
    throw new Error('Client is missing account or chain information');
  }
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new providers.Web3Provider(transport, network);
  const signer = provider.getSigner(account.address);
  return signer;
}

/** Hook to convert a Viem Client to an ethers.js Signer. */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient<Config>({ chainId });
  return useMemo(() => (client ? clientToSigner(client) : undefined), [client]);
}

export function clientToProvider(client: Client<Transport, Chain>) {
  const { chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  if (transport.type === 'fallback')
    return new providers.FallbackProvider(
      (transport.transports as ReturnType<Transport>[]).map(
        ({ value }) => new providers.JsonRpcProvider(value?.url, network),
      ),
    );
  return new providers.JsonRpcProvider(transport.url, network);
}

/** Hook to convert a viem Client to an ethers.js Provider. */
export function useEthersProvider({
  chainId,
}: {
  chainId?: number | undefined;
} = {}) {
  const client = useClient<Config>({ chainId });
  return useMemo(
    () => (client ? clientToProvider(client) : undefined),
    [client],
  );
}

/**
 * @deprecated
 * Bridge a viem `WalletClient` to an ethers v5 `Web3Provider`.
 *
 * The Rarible SDK (`@rarible/sdk` / `@rarible/ethers-ethereum`) is ethers-only,
 * but this app is viem/wagmi. viem's `transport` is an EIP-1193 provider
 * (`{ request }`), which ethers v5's `Web3Provider` accepts as an external
 * provider — wagmi's documented "Ethers.js Adapters" pattern.
 *
 * `ethers` is loaded with a runtime dynamic `import()` (the static import is
 * type-only, erased at build time) so neither ethers nor the Rarible SDK chunk
 * that consumes the result enters the marketplace read-path bundle.
 */
export async function walletClientToEthersWeb3Provider(
  walletClient: WalletClient,
): Promise<{
  provider: ethers.providers.Web3Provider;
  address: `0x${string}`;
}> {
  const { ethers: ethersRuntime } = await import('ethers');
  const { account, chain, transport } = walletClient;
  if (!account) {
    throw new Error('Wallet client has no account — connect a wallet first.');
  }
  if (!chain) {
    throw new Error('Wallet client has no chain.');
  }
  const provider = new ethersRuntime.providers.Web3Provider(
    transport as unknown as ethers.providers.ExternalProvider,
    { chainId: chain.id, name: chain.name },
  );
  return { provider, address: account.address };
}
