import { CHAINS, NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils';
import { useMemo } from 'react';
import { formatUnits } from 'viem';
import { multicall } from 'viem/actions';
import { useClient, type UseClientReturnType, useConfig } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { NfscAbi } from '@namefi-astra/utils/abis/nfsc';
import { useAllowedChains } from './use-allowed-chains';

const CHAIN_PRIORITY = [
  CHAINS.sepolia.id as number,
  CHAINS.base.id as number,
  CHAINS.mainnet.id as number,
];

const getWalletMultiChainNfscBalance = async (
  clients: Record<number, UseClientReturnType>,
  chainIds: number[],
  walletAddresses: `0x${string}`[],
) => {
  if (!clients) {
    throw new Error('Client not found');
  }
  if (!walletAddresses) {
    throw new Error('Wallet addresses not found');
  }
  const balances: Record<
    `0x${string}`,
    Record<number, bigint | undefined>
  > = Object.fromEntries(
    walletAddresses.map((walletAddress) => [
      walletAddress,
      Object.fromEntries(chainIds.map((chainId) => [chainId, undefined])),
    ]),
  );

  for (const chainId of chainIds) {
    if (!clients[chainId]) {
      throw new Error(`Client not found for chain ${chainId}`);
    }
    const balance = await multicall(clients[chainId], {
      contracts: walletAddresses.map((walletAddress) => ({
        address: NFSC_CONTRACT_ADDRESS as `0x${string}`,
        abi: NfscAbi,
        functionName: 'balanceOf',
        args: [walletAddress],
        chainId,
      })),
    });

    walletAddresses.forEach((walletAddress, index) => {
      balances[walletAddress][chainId] = balance[index].result
        ? BigInt(balance[index].result)
        : undefined;
    });
  }

  return balances;
};

export interface ChainBalance {
  chainId: number;
  chainName: string;
  walletAddress: `0x${string}`;
  balanceInUsdCents: number;
  paymentProvider: 'NFSC_BASE' | 'NFSC_ETHEREUM' | 'NFSC_ETHEREUM_SEPOLIA';
}

export interface UseUserChainBalancesOptions {
  enabled?: boolean;
  walletAddresses?: `0x${string}`[];
}

export interface UseUserChainBalancesReturn {
  chainBalances: ChainBalance[];
  totalBalanceInUsdCents: number;
  canUseBalance: boolean;
  isLoadingBalance: boolean;
  refetchBalances: () => Promise<void>;
}

export function useUserChainBalances(
  options: UseUserChainBalancesOptions = {},
): UseUserChainBalancesReturn {
  const { enabled = true, walletAddresses = [] } = options;
  const config = useConfig();
  const baseClient = useClient({ chainId: CHAINS.base.id, config });
  const mainnetClient = useClient({ chainId: CHAINS.mainnet.id, config });
  const sepoliaClient = useClient({ chainId: CHAINS.sepolia.id, config });

  // Simplify: just use the first wallet for balance queries
  const primaryWallet = walletAddresses[0];

  // Chain priority: [Sepolia, Base, Ethereum]
  const { chainIds, isLoading } = useAllowedChains();

  const q = useQuery({
    queryKey: ['wallet-multi-chain-nfsc-balance', walletAddresses, chainIds],
    queryFn: () =>
      getWalletMultiChainNfscBalance(
        {
          [CHAINS.base.id]: baseClient,
          [CHAINS.mainnet.id]: mainnetClient,
          [CHAINS.sepolia.id]: sepoliaClient,
        },
        chainIds,
        walletAddresses,
      ),
    enabled: enabled && !!primaryWallet && !isLoading,
  });

  // Calculate chain balances
  const chainBalances = useMemo((): ChainBalance[] => {
    if (!enabled || !primaryWallet) return [];

    const balances: ChainBalance[] = [];
    if (q.data) {
      for (const [walletAddress, chainBalances] of Object.entries(q.data)) {
        for (const [chainId, balance] of Object.entries(chainBalances)) {
          const balanceInUsdCents = balance
            ? Number(
                formatUnits(
                  balance,
                  18 - 2 /** NFSC decimals -2 because it's in cents*/,
                ),
              )
            : 0;
          if (balanceInUsdCents > 0) {
            balances.push({
              chainId: Number(chainId),
              chainName: getChainName(Number(chainId)),
              walletAddress: walletAddress as `0x${string}`,
              balanceInUsdCents,
              paymentProvider: getPaymentProviderForChain(Number(chainId)),
            });
          }
        }
      }
    }

    return balances;
  }, [enabled, primaryWallet, q.data]);

  const totalBalanceInUsdCents = useMemo(
    () => chainBalances.reduce((sum, cb) => sum + cb.balanceInUsdCents, 0),
    [chainBalances],
  );

  const canUseBalance = useMemo(
    () => totalBalanceInUsdCents > 0,
    [totalBalanceInUsdCents],
  );

  return {
    chainBalances,
    totalBalanceInUsdCents,
    canUseBalance,
    isLoadingBalance: q.isLoading || isLoading,
    refetchBalances: async () => {
      await q.refetch();
    },
  };
}

/**
 * Get payment provider for a given chain ID
 */
export function getPaymentProviderForChain(
  chainId: number,
): 'NFSC_BASE' | 'NFSC_ETHEREUM' | 'NFSC_ETHEREUM_SEPOLIA' {
  switch (chainId) {
    case CHAINS.base.id:
      return 'NFSC_BASE';
    case CHAINS.mainnet.id:
      return 'NFSC_ETHEREUM';
    case CHAINS.sepolia.id:
    default:
      return 'NFSC_ETHEREUM_SEPOLIA';
  }
}
/**
 * Get chain name for display
 */
export function getChainName(chainId: number): string {
  switch (chainId) {
    case CHAINS.base.id:
      return 'Base';
    case CHAINS.mainnet.id:
      return 'Ethereum';
    case CHAINS.sepolia.id:
      return 'Sepolia';
    default:
      return 'Unknown Chain';
  }
}
