import { useCallback, useMemo } from 'react';
import { useConnectedWallets } from './use-user-wallet-addresses';
import {
  NAMEFI_NFT_CONTRACT_ADDRESS,
  NFSC_CONTRACT_ADDRESS,
} from '@namefi-astra/utils/contract-addresses';
import { useConfig, useWatchAsset, useSwitchChain } from 'wagmi';

export function useWatchAssets() {
  const { connectedEthereumWallets } = useConnectedWallets();

  const isAnyWalletConnected = useMemo(() => {
    return connectedEthereumWallets.length > 0;
  }, [connectedEthereumWallets]);
  const config = useConfig();

  const isMetaMask = useMemo(() => {
    return connectedEthereumWallets.some(
      (wallet) => wallet.connectorType === 'metamask',
    );
  }, [connectedEthereumWallets]);

  const { watchAssetAsync } = useWatchAsset({ config: config });
  const { switchChainAsync } = useSwitchChain();

  const watchNfscInWallet = useCallback(async () => {
    if (!isAnyWalletConnected) {
      return;
    }
    const result = await watchAssetAsync({
      type: 'ERC20',
      options: {
        address: NFSC_CONTRACT_ADDRESS,
        symbol: 'NFSC',
        decimals: 18,
        image: 'https://namefi.io/nfsc.png',
      },
    });
    return result;
  }, [isAnyWalletConnected, watchAssetAsync]);

  const watchNamefiNftInWallet = useCallback(
    async (tokenId: string, chainId: number) => {
      if (!isAnyWalletConnected) {
        return;
      }

      // wallet_watchAsset operates against the wallet's currently selected
      // chain, so switch to the NFT's chain first or the prompt would attach
      // the asset to the wrong network.
      await switchChainAsync({ chainId });

      // wagmi's `watchAsset` types only model ERC20 (per EIP-747's original
      // scope), even though MetaMask's underlying `wallet_watchAsset` RPC also
      // accepts ERC721. We cast to `any` to opt into that provider-level
      // capability — drop the cast once wagmi widens the parameter type.
      const result = await watchAssetAsync({
        type: 'ERC721',
        options: {
          address: NAMEFI_NFT_CONTRACT_ADDRESS,
          tokenId,
        },
      } as any);
      return result;
    },
    [isAnyWalletConnected, switchChainAsync, watchAssetAsync],
  );

  const watchBulkNamefiNftInWallet = useCallback(
    async (chainId: number, walletAddress: string, tokenIds: string[]) => {
      if (!isAnyWalletConnected) {
        return;
      }
      const connectedWallet = connectedEthereumWallets.find(
        (wallet) =>
          wallet.address.toLowerCase() === walletAddress.toLowerCase(),
      );
      if (!connectedWallet) {
        console.warn(
          `Wallet address ${walletAddress} not found among connected wallets.`,
        );
        return;
      }

      // Talk to the target wallet's provider directly instead of wagmi's
      // active-wallet `walletClient`: `useWalletClient` only refreshes on the
      // next render, so a client captured in this callback would still point at
      // the previously active wallet after a switch. `switchChain` does not
      // mutate existing provider instances, so request the provider afterwards.
      await connectedWallet.switchChain(chainId);
      const provider = await connectedWallet.getEthereumProvider();

      // wallet_watchAsset also accepts ERC721 at the RPC level even though the
      // EIP-1193 `request` types only model array params; cast to opt into it.
      const result = await Promise.allSettled(
        tokenIds.map((tokenId) =>
          provider.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC721',
              options: {
                address: NAMEFI_NFT_CONTRACT_ADDRESS,
                tokenId,
              },
            },
          } as any),
        ),
      );
      return result;
    },
    [isAnyWalletConnected, connectedEthereumWallets],
  );

  return {
    watchNfscInWallet,
    isMetaMask,
    isAnyWalletConnected,
    watchNamefiNftInWallet,
    watchBulkNamefiNftInWallet,
  };
}
