import { NAMEFI_NFT_CONTRACT_ADDRESS } from '@namefi-astra/utils/contract-addresses';
import { NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils/contract-addresses';
import { NftAbi } from '@namefi-astra/utils/abis/namefi-nft';
import { NfscAbi } from '@namefi-astra/utils/abis/nfsc';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  type Abi,
  type ContractFunctionArgs,
  type ContractFunctionName,
  formatEther,
} from 'viem';
import {
  useAccount,
  useChainId,
  useEstimateFeesPerGas,
  usePublicClient,
} from 'wagmi';

/**
 * State mutabilities that actually consume gas. `view`/`pure` calls don't, so
 * gas estimation is only meaningful for these.
 */
type GasMutability = 'nonpayable' | 'payable';

type EstimateContractCallParams<
  abi extends Abi,
  functionName extends ContractFunctionName<abi, GasMutability>,
  args extends ContractFunctionArgs<abi, GasMutability, functionName>,
> = {
  contractAddress: `0x${string}`;
  abi: abi;
  functionName: functionName;
  args?: args;
  /** msg.value (wei) for payable calls — gas for a payable fn depends on it. */
  value?: bigint;
};

/**
 * Estimate the gas fee (in ETH) for a contract write, type-safe against the
 * supplied ABI: `functionName` is constrained to the contract's gas-consuming
 * functions and `args` is inferred from that function's signature.
 *
 * The fee is `estimated gas units × max fee-per-gas`, both read from the chain
 * selected by the connected wallet (`useChainId`). `maxFeePerGas` (EIP-1559) is
 * used — not the lower legacy `eth_gasPrice` — so the quote matches the *max
 * network fee* a wallet shows in its confirmation prompt. Returns `null` for
 * the fee until both resolve, or when estimation reverts (e.g. value below the
 * contract minimum, or insufficient balance) — those are expected user states.
 */
export function useEstimateContractCall<
  const abi extends Abi,
  functionName extends ContractFunctionName<abi, GasMutability>,
  args extends ContractFunctionArgs<abi, GasMutability, functionName>,
>({
  contractAddress,
  abi,
  functionName,
  args,
  value,
}: EstimateContractCallParams<abi, functionName, args>) {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { address } = useAccount();

  // Match the fee basis a wallet uses for its *max network fee*: on EIP-1559
  // chains that's `maxFeePerGas` (≈ 2×baseFee + priority), with a legacy
  // `gasPrice` fallback. Pricing off `eth_gasPrice` instead made our quote read
  // an order of magnitude below the wallet's confirmation prompt on busy chains.
  const { data: feeData, isLoading: feeDataIsLoading } =
    useEstimateFeesPerGas();
  const feePerGas = feeData?.maxFeePerGas ?? feeData?.gasPrice ?? null;

  const serializedArgs = useMemo(
    () =>
      args === undefined
        ? ''
        : JSON.stringify(args, (_key, val) =>
            typeof val === 'bigint' ? val.toString() : val,
          ),
    [args],
  );

  const {
    data: gas,
    isLoading: gasIsLoading,
    isFetching: gasIsFetching,
  } = useQuery({
    queryKey: [
      '[action:estimateGas]',
      `[chain:${chainId}]`,
      `[contract:${contractAddress}][function:${functionName}][account:${address}][args:${serializedArgs}][value:${value?.toString() ?? ''}]`,
    ],
    queryFn: async () => {
      if (!publicClient || !address) return null;
      try {
        return await publicClient.estimateContractGas({
          address: contractAddress,
          abi,
          functionName,
          args,
          account: address,
          value,
        } as Parameters<typeof publicClient.estimateContractGas>[0]);
      } catch {
        // Estimation reverts (value below the contract minimum, insufficient
        // balance) are expected user states — resolve to `null` so consumers
        // see "fee unavailable", not query error-state noise.
        return null;
      }
    },
    enabled: !!publicClient && !!address,
    // No retry: a revert won't succeed on a second identical call.
    retry: false,
  });

  /** Estimated fee in wei: gas units × fee-per-gas. `null` until both resolve. */
  const fee = useMemo(() => {
    if (gas == null || feePerGas == null) return null;
    return gas * feePerGas;
  }, [gas, feePerGas]);

  /** Estimated fee as a decimal ETH string, or `null` when unavailable. */
  const feeFormatted = useMemo(
    () => (fee == null ? null : formatEther(fee)),
    [fee],
  );

  return {
    gas,
    feePerGas,
    fee,
    feeFormatted,
    isLoading: gasIsLoading || feeDataIsLoading,
    isFetching: gasIsFetching,
  };
}

type BoundEstimateParams<
  abi extends Abi,
  functionName extends ContractFunctionName<abi, GasMutability>,
  args extends ContractFunctionArgs<abi, GasMutability, functionName>,
> = Omit<
  EstimateContractCallParams<abi, functionName, args>,
  'contractAddress' | 'abi'
>;

/** Gas-fee estimate for a write on the Namefi NFT contract (`NftAbi`). */
export function useEstimateNamefiNftCall<
  functionName extends ContractFunctionName<typeof NftAbi, GasMutability>,
  args extends ContractFunctionArgs<typeof NftAbi, GasMutability, functionName>,
>(params: BoundEstimateParams<typeof NftAbi, functionName, args>) {
  return useEstimateContractCall({
    contractAddress: NAMEFI_NFT_CONTRACT_ADDRESS,
    abi: NftAbi,
    ...params,
  });
}

/** Gas-fee estimate for a write on the NFSC service-credit contract (`NfscAbi`). */
export function useEstimateNamefiNfscCall<
  functionName extends ContractFunctionName<typeof NfscAbi, GasMutability>,
  args extends ContractFunctionArgs<
    typeof NfscAbi,
    GasMutability,
    functionName
  >,
>(params: BoundEstimateParams<typeof NfscAbi, functionName, args>) {
  return useEstimateContractCall({
    contractAddress: NFSC_CONTRACT_ADDRESS,
    abi: NfscAbi,
    ...params,
  });
}
