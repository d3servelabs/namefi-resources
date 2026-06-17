import { NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils/contract-addresses';
import { getAddress, isAddress, type Address } from 'viem';
import { useAccount, useBalance, useChainId } from 'wagmi';

export default function useNfscBalance(walletAddress?: string | null) {
  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const targetAddress: Address | undefined = walletAddress
    ? isAddress(walletAddress)
      ? getAddress(walletAddress)
      : undefined
    : connectedAddress;

  const {
    data: balance,
    isLoading: isNativeLoading,
    refetch: refetchNativeBalance,
  } = useBalance({
    query: {
      enabled: !!targetAddress,
    },
    address: targetAddress,
  });

  const {
    data: nfscBalance,
    isLoading: isNfscLoading,
    refetch: refetchNfscBalance,
  } = useBalance({
    query: {
      enabled: !!targetAddress,
    },
    address: targetAddress,
    token: NFSC_CONTRACT_ADDRESS,
    chainId,
  });

  const refetchBalances = async () => {
    if (!targetAddress) return;

    await Promise.all([refetchNativeBalance(), refetchNfscBalance()]);
  };

  return {
    nfscBalance,
    nativeBalance: balance,
    isLoading: isNativeLoading || isNfscLoading,
    refetch: refetchBalances,
  };
}
