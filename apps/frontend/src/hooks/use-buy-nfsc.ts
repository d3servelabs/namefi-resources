import { NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils/contract-addresses';
import { NfscAbi } from '@namefi-astra/utils/abis/nfsc';
import { useWalletActionClient } from '@/hooks/use-wallet-action-client';
import { useMutation } from '@tanstack/react-query';
import { type Address, isAddressEqual } from 'viem';
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWaitForTransactionReceipt,
} from 'wagmi';

type Props = {
  walletAddress?: string;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
};

export function useBuyNfsc(props: Props) {
  const { walletAddress, onSuccess, onError } = props;
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const client = usePublicClient();
  const resolveWalletClient = useWalletActionClient();

  const {
    data: txHash,
    mutate: writeContract,
    mutateAsync: writeContractAsync,
    error,
    isPending,
    reset,
  } = useMutation({
    mutationFn: async (value: bigint) => {
      if (!client) {
        throw new Error('Network client unavailable. Please try again.');
      }
      if (!chainId) {
        throw new Error('Wallet network unavailable. Please try again.');
      }

      const walletClient = await resolveWalletClient({
        chainId,
        expectedAddress: walletAddress,
      });

      const { request } = await client.simulateContract({
        address: NFSC_CONTRACT_ADDRESS,
        abi: NfscAbi,
        functionName: 'buyWithEthers',
        account: walletClient.account,
        value: value,
      });

      return walletClient.writeContract(request);
    },
    onSuccess,
    onError,
    retry: false,
  });

  const result = useWaitForTransactionReceipt({
    chainId,
    hash: txHash,
  });

  return {
    txHash,
    writeContract,
    writeContractAsync,
    error,
    isPending,
    reset,
    result,
    /** A wallet is connected and, when required, it is the wallet being funded. */
    isWalletReady:
      isConnected &&
      (!walletAddress ||
        (address ? isAddressEqual(address, walletAddress as Address) : false)),
    /** Account recovery is handled by the enabled Connect Wallet button. */
    isWalletConnecting: false,
  };
}
