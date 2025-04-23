import { NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils';
import { useAccount, useBalance, useChainId } from 'wagmi';

export default function useNFSCBalance() {
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
    refetch: refetchNfcsBalance,
  } = useBalance({
    query: {
      enabled: !!address,
    },
    address: address,
    token: NFSC_CONTRACT_ADDRESS,
    chainId,
  });

  const refecthBalances = async () => {
    await Promise.all([refetchNativeBalance(), refetchNfcsBalance()]);
  };

  return {
    nfscBalance,
    nativeBalance: balance,
    isLoading: isNativeLoading || isNfscLoading,
    refetch: refecthBalances,
  };
}
