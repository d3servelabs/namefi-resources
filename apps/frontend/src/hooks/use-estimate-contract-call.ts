import { NAMEFI_NFT_CONTRACT_ADDRESS } from '@namefi-astra/utils/contract-addresses';
import { NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils/contract-addresses';
import { NftAbi } from '@namefi-astra/utils/abis/namefi-nft';
import { NfscAbi } from '@namefi-astra/utils/abis/nfsc';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  type Abi,
  type Address,
  type ContractFunctionArgs,
  type ContractFunctionName,
  formatEther,
} from 'viem';
import { useAccount, useChainId, usePublicClient } from 'wagmi';

/**
 * State mutabilities that actually consume gas. `view`/`pure` calls don't, so
 * gas estimation is only meaningful for these.
 */
type GasMutability = 'nonpayable' | 'payable';

/**
 * Default `baseFeePerGas` multiplier for the market max-fee. EIP-1559 base fee
 * can rise at most 12.5% per block, so 2× covers ~6 blocks of upward movement —
 * the headroom a wallet bakes into the *max network fee* it shows at signing.
 * Quoting below this is what made our estimate read low versus the wallet.
 */
const DEFAULT_BASE_FEE_MULTIPLIER = 2;

/** Funded simulation params used when the user's own estimate can't run. */
type EstimateFallback = {
  /** A funded address to simulate `from`. Simulation-only — never signs. */
  account: Address;
  /** msg.value (wei) to simulate with — must clear the contract minimum. */
  value: bigint;
};

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
  /**
   * When the primary estimate (connected wallet + `value`) can't run — no
   * wallet connected, `value` omitted, or the call reverts (value below the
   * contract minimum, insufficient balance) — retry the estimate from these
   * funded params instead, so the fee still resolves to a representative
   * number. The result is flagged `isFallback`.
   */
  fallback?: EstimateFallback;
  /** Override the market `baseFeePerGas` multiplier (see the default constant). */
  baseFeeMultiplier?: number;
};

type FeeEstimate = {
  /** Estimated gas units. */
  gas: bigint;
  /** Market max-fee per gas (wei): `baseFee × multiplier + priorityFee`. */
  feePerGas: bigint;
  /** Network fee (wei): `gas × feePerGas`. */
  fee: bigint;
  /** True when the estimate used `fallback` params, not the user's. */
  isFallback: boolean;
};

/**
 * Scale a wei amount by a decimal multiplier without floating-point drift.
 * The multiplier is taken to 3 decimal places (e.g. 1.25, 2) before the
 * integer-only bigint math.
 */
function scaleByMultiplier(value: bigint, multiplier: number): bigint {
  return (value * BigInt(Math.round(multiplier * 1000))) / 1000n;
}

/**
 * Estimate the network fee (in ETH) for a contract write, type-safe against the
 * supplied ABI: `functionName` is constrained to the contract's gas-consuming
 * functions and `args` is inferred from that function's signature.
 *
 * The quote is `gas × feePerGas`, built to match the *max network fee* a wallet
 * shows at signing:
 *
 * - **Fee per gas** is market-derived — `baseFeePerGas (latest block) ×
 *   baseFeeMultiplier + maxPriorityFeePerGas` — i.e. the EIP-1559 `maxFeePerGas`
 *   a wallet would set, not the lower legacy `eth_gasPrice`. Legacy chains fall
 *   back to `eth_gasPrice`.
 * - **Gas** is estimated from the connected wallet + `value`; if that can't run
 *   (no wallet, no `value`, or a revert) it falls back to `fallback` params so
 *   the fee still resolves (flagged `isFallback`).
 *
 * Returns `null` for the fee until estimation resolves, or when neither the
 * primary nor the fallback estimate can run.
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
  fallback,
  baseFeeMultiplier = DEFAULT_BASE_FEE_MULTIPLIER,
}: EstimateContractCallParams<abi, functionName, args>) {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { address } = useAccount();

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
    data: estimate,
    isLoading,
    isFetching,
  } = useQuery<FeeEstimate | null>({
    queryKey: [
      '[action:estimateContractFee]',
      `[chain:${chainId}]`,
      `[contract:${contractAddress}][function:${functionName}][args:${serializedArgs}]`,
      `[account:${address}][value:${value?.toString() ?? ''}]`,
      `[fallback:${fallback?.account ?? ''}:${fallback?.value?.toString() ?? ''}]`,
      `[mult:${baseFeeMultiplier}]`,
    ],
    queryFn: async (): Promise<FeeEstimate | null> => {
      if (!publicClient) return null;

      // 1) Market fee-per-gas. On EIP-1559 chains derive the max-fee from the
      //    live base fee; legacy chains expose only `eth_gasPrice`.
      const block = await publicClient.getBlock({ blockTag: 'latest' });
      let feePerGas: bigint;
      if (block.baseFeePerGas != null) {
        let priorityFee = 0n;
        try {
          priorityFee = await publicClient.estimateMaxPriorityFeePerGas();
        } catch {
          // Chain reports a base fee but no priority-fee RPC — treat tip as 0.
          priorityFee = 0n;
        }
        feePerGas =
          scaleByMultiplier(block.baseFeePerGas, baseFeeMultiplier) +
          priorityFee;
      } else {
        feePerGas = await publicClient.getGasPrice();
      }

      // 2) Gas units. Try the user's params first, then the funded fallback.
      const candidates: Array<EstimateFallback & { isFallback: boolean }> = [];
      if (address && value !== undefined) {
        candidates.push({ account: address, value, isFallback: false });
      }
      if (fallback) {
        candidates.push({ ...fallback, isFallback: true });
      }

      let resolved:
        | ({ gas: bigint; isFallback: boolean } & EstimateFallback)
        | null = null;
      for (const candidate of candidates) {
        try {
          const gas = await publicClient.estimateContractGas({
            address: contractAddress,
            abi,
            functionName,
            args,
            account: candidate.account,
            value: candidate.value,
          } as unknown as Parameters<
            typeof publicClient.estimateContractGas
          >[0]);
          resolved = { ...candidate, gas };
          break;
        } catch {
          // Reverts (value below minimum, insufficient balance) are expected —
          // fall through to the next candidate.
        }
      }
      if (!resolved) return null;

      return {
        gas: resolved.gas,
        feePerGas,
        fee: resolved.gas * feePerGas,
        isFallback: resolved.isFallback,
      };
    },
    enabled: !!publicClient,
    // No retry: a revert won't succeed on an identical retry, and the fallback
    // is already tried within the query.
    retry: false,
    // Fees move per block; keep the preview reasonably fresh while shown.
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  /** Fee as a decimal ETH string, or `null` when unavailable. */
  const feeFormatted = useMemo(
    () => (estimate ? formatEther(estimate.fee) : null),
    [estimate],
  );

  return {
    gas: estimate?.gas ?? null,
    feePerGas: estimate?.feePerGas ?? null,
    fee: estimate?.fee ?? null,
    feeFormatted,
    isFallback: estimate?.isFallback ?? false,
    isLoading,
    isFetching,
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

/** Network-fee estimate for a write on the Namefi NFT contract (`NftAbi`). */
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

/** Network-fee estimate for a write on the NFSC service-credit contract (`NfscAbi`). */
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
