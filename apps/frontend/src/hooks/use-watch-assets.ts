import { useCallback, useMemo } from 'react';
import { useConnectedWallets } from '@/hooks/use-user-wallet-addresses';
import {
  NAMEFI_NFT_CONTRACT_ADDRESS,
  NFSC_CONTRACT_ADDRESS,
} from '@namefi-astra/utils/contract-addresses';
type WalletWatchAssetParams =
  | {
      type: 'ERC20';
      options: {
        address: string;
        symbol: string;
        decimals: number;
        image?: string;
      };
    }
  | {
      type: 'ERC721';
      options: {
        address: string;
        tokenId: string;
      };
    };

export function useWatchAssets() {
  const { connectedEthereumWallets } = useConnectedWallets();

  const isAnyWalletConnected = useMemo(() => {
    return connectedEthereumWallets.length > 0;
  }, [connectedEthereumWallets]);
  const isMetaMask = useMemo(() => {
    return connectedEthereumWallets.some(
      (wallet) => wallet.connectorType === 'metamask',
    );
  }, [connectedEthereumWallets]);

  const watchAssetInWallet = useCallback(
    async ({
      chainId,
      walletAddress,
      asset,
    }: {
      chainId: number;
      walletAddress: string;
      asset: WalletWatchAssetParams;
    }) => {
      const connectedWallet = connectedEthereumWallets.find(
        (wallet) =>
          wallet.address.toLowerCase() === walletAddress.toLowerCase(),
      );
      if (!connectedWallet) {
        throw new Error('Connect the requested wallet to continue.');
      }

      await connectedWallet.switchChain(chainId);
      const provider = await connectedWallet.getEthereumProvider();
      const request = {
        method: 'wallet_watchAsset',
        params: asset,
      } as unknown as Parameters<typeof provider.request>[0];
      return provider.request(request);
    },
    [connectedEthereumWallets],
  );

  const watchNfscInWallet = useCallback(
    async (walletAddress: string, chainId: number) => {
      const result = await watchAssetInWallet({
        chainId,
        walletAddress,
        asset: {
          type: 'ERC20',
          options: {
            address: NFSC_CONTRACT_ADDRESS,
            symbol: 'NFSC',
            decimals: 18,
            image: 'https://namefi.io/nfsc.png',
          },
        },
      });
      return result;
    },
    [watchAssetInWallet],
  );

  const watchNamefiNftInWallet = useCallback(
    async (tokenId: string, chainId: number, walletAddress: string) => {
      const result = await watchAssetInWallet({
        chainId,
        walletAddress,
        asset: {
          type: 'ERC721',
          options: {
            address: NAMEFI_NFT_CONTRACT_ADDRESS,
            tokenId,
          },
        },
      });
      return result;
    },
    [watchAssetInWallet],
  );

  const watchBulkNamefiNftInWallet = useCallback(
    async (chainId: number, walletAddress: string, tokenIds: string[]) => {
      // wallet_watchAsset also accepts ERC721 at the RPC level even though the
      // EIP-1193 `request` types only model array params; cast to opt into it.
      const result = await Promise.allSettled(
        tokenIds.map((tokenId) =>
          watchAssetInWallet({
            chainId,
            walletAddress,
            asset: {
              type: 'ERC721',
              options: {
                address: NAMEFI_NFT_CONTRACT_ADDRESS,
                tokenId,
              },
            },
          }),
        ),
      );
      return result;
    },
    [watchAssetInWallet],
  );

  return {
    watchNfscInWallet,
    isMetaMask,
    isAnyWalletConnected,
    watchNamefiNftInWallet,
    watchBulkNamefiNftInWallet,
  };
}
