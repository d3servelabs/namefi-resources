import { NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils';
import { NfscAbi } from '@namefi-astra/utils/abis/nfsc';
import { useMutation } from '@tanstack/react-query';
import {
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
  const { data: signer } = useWalletClient();
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
      if (!client) {
        throw new Error('Client not found');
      }
      if (!signer) {
        throw new Error('Signer not found');
      }

      const { request } = await client.simulateContract({
        address: NFSC_CONTRACT_ADDRESS,
        abi: NfscAbi,
        functionName: 'buyWithEthers',
        account: signer.account,
        value: value,
      });

      return signer.writeContract(request);
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
  };
}
