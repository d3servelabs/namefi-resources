import { NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils';
import { NfscAbi } from '@namefi-astra/utils/abis/nfsc';
import { useMemo } from 'react';
import { type Hex, formatUnits, parseUnits, zeroAddress } from 'viem';
import { useReadContract } from 'wagmi';
import { mainnet } from 'wagmi/chains';

type Props = {
  paymentToken?: Hex;
};

export default function useGetNfscExchangeRate(props: Props = {}) {
  const { paymentToken = zeroAddress } = props;

  const {
    data: rawPrice,
    isLoading,
    refetch,
  } = useReadContract({
    address: NFSC_CONTRACT_ADDRESS,
    abi: NfscAbi,
    functionName: 'price',
    args: [paymentToken],
    chainId: mainnet.id, // estimation doesn't work on testnet
  });

  const exchangeRate = useMemo(() => {
    return rawPrice ? calculateExchangeRate(rawPrice) : null;
  }, [rawPrice]);

  return {
    data: exchangeRate,
    rawPrice,
    isLoading,
    refetch,
  };
}

// Transform the raw price data into the actual exchange rate
function calculateExchangeRate(rawPrice: bigint): string {
  try {
    const oneEth = parseUnits('1', 18);
    if (rawPrice === 0n) {
      return '0';
    }
    const intermediateResult = oneEth / rawPrice;
    return formatUnits(intermediateResult, 9);
  } catch (error) {
    console.error('Error calculating exchange rate:', error);
    return '0';
  }
}
