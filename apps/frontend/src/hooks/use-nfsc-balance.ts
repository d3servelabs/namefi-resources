import { NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils/contract-addresses';
import { useAccount, useBalance, useChainId } from 'wagmi';

export default function useConnectedWalletBalances() {
  const { address } = useAccount();
  const chainId = useChainId();

  const {
    data: balance,
    isLoading: isNativeLoading,
    refetch: refetchNativeBalance,
  } = useBalance({
    address: address,
  });

  const {
    data: nfscBalance,
    isLoading: isNfscLoading,
    refetch: refetchNfscBalance,
  } = useBalance({
    query: {
      enabled: !!address,
    },
    address: address,
    token: NFSC_CONTRACT_ADDRESS,
    chainId,
  });

  const refetchBalances = async () => {
    await Promise.all([refetchNativeBalance(), refetchNfscBalance()]);
  };

  return {
    nfscBalance,
    nativeBalance: balance,
    isLoading: isNativeLoading || isNfscLoading,
    refetch: refetchBalances,
  };
}
