import { useCallback, useMemo } from 'react';
import { useConnectedWallets } from './use-user-wallet-addresses';
import { NAMEFI_NFT_CONTRACT_ADDRESS } from '@namefi-astra/utils';
import { useConfig, useWatchAsset } from 'wagmi';

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

  const watchNfscInWallet = useCallback(async () => {
    if (!isAnyWalletConnected) {
      return;
    }
    const result = await watchAssetAsync({
      type: 'ERC20',
      options: {
        address: NAMEFI_NFT_CONTRACT_ADDRESS,
        symbol: 'NFSC',
        decimals: 18,
      },
    });
    return result;
  }, [isAnyWalletConnected, watchAssetAsync]);

  return { watchNfscInWallet, isMetaMask, isAnyWalletConnected };
}
