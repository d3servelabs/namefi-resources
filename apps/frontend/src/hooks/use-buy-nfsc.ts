import { NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils/contract-addresses';
import { NfscAbi } from '@namefi-astra/utils/abis/nfsc';
import { resolveSwapSigner } from '@/hooks/use-buy-nfsc-utils';
import { useMutation } from '@tanstack/react-query';
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWalletClient,
} from 'wagmi';

type Props = {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
};

export function useBuyNfsc(props: Props) {
  const { onSuccess, onError } = props;
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const {
    data: signer,
    isLoading: isSignerLoading,
    refetch: refetchWalletClient,
  } = useWalletClient();
  const client = usePublicClient();

  const {
    data: txHash,
    mutate: writeContract,
    mutateAsync: writeContractAsync,
    error,
    isPending,
    reset,
  } = useMutation({
    mutationFn: async (value: bigint) => {
      // The wallet client can lag behind the connection — especially now that
      // the wallet runtime is mounted lazily (deferred wallet bundles), where
      // the signer may not be hydrated at the moment of click. resolveSwapSigner
      // refetches on demand before giving up so a momentary gap doesn't surface
      // as an instant no-op (the old "Signer not found" path that flickered the
      // Swap button with no MetaMask prompt).
      const activeSigner = await resolveSwapSigner({
        client,
        signer,
        refetchWalletClient,
      });

      if (!client) {
        throw new Error('Network client unavailable. Please try again.');
      }

      const { request } = await client.simulateContract({
        address: NFSC_CONTRACT_ADDRESS,
        abi: NfscAbi,
        functionName: 'buyWithEthers',
        account: activeSigner.account,
        value: value,
      });

      return activeSigner.writeContract(request);
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
    /** A wallet is connected and its signer is available to sign a swap. */
    isWalletReady: isConnected && Boolean(signer),
    /** Connected but the signer (wallet client) is still hydrating. */
    isWalletConnecting: isConnected && !signer && isSignerLoading,
  };
}
