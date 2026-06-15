import { CHAINS, getChain } from '@namefi-astra/utils/chains';
import { NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils/contract-addresses';
import { useMemo } from 'react';
import { createPublicClient, formatUnits, http } from 'viem';
import {
  getPaymentProviderForChain,
  getChainName,
} from '@/components/payment-method/hybrid-payment-utils';
import { useQuery } from '@tanstack/react-query';
import { NfscAbi } from '@namefi-astra/utils/abis/nfsc';
import { useAllowedChains } from './use-allowed-chains';
import { getAlchemyHttpRpcUrl } from '@namefi-astra/utils/alchemy';
import { clientSideEnv } from '@/lib/env';

const getConfiguredAlchemyRpcUrl =
  clientSideEnv.NEXT_PUBLIC_ALCHEMY_FRONTEND_API_KEY
    ? getAlchemyHttpRpcUrl(clientSideEnv.NEXT_PUBLIC_ALCHEMY_FRONTEND_API_KEY)
    : null;

const CHAIN_PRIORITY = [
  CHAINS.sepolia.id as number,
  CHAINS.robinhoodTestnet.id as number,
  CHAINS.base.id as number,
  CHAINS.mainnet.id as number,
];

const sortBalancesByChainPriority = (chainBalances: ChainBalance[]) => {
  return chainBalances
    .filter((cb) => cb.balanceInUsdCents > 0)
    .sort((a, b) => {
      const _aPriority = CHAIN_PRIORITY.indexOf(a.chainId);
      const _bPriority = CHAIN_PRIORITY.indexOf(b.chainId);

      const aPriority =
        _aPriority === -1 ? Number.MAX_SAFE_INTEGER : _aPriority;
      const bPriority =
        _bPriority === -1 ? Number.MAX_SAFE_INTEGER : _bPriority;
      return aPriority - bPriority;
    });
};

const sortChainsIdsByPriority = (chainIds: number[]) => {
  return chainIds.sort((a, b) => {
    const _aPriority = CHAIN_PRIORITY.indexOf(a);
    const _bPriority = CHAIN_PRIORITY.indexOf(b);

    const aPriority = _aPriority === -1 ? Number.MAX_SAFE_INTEGER : _aPriority;
    const bPriority = _bPriority === -1 ? Number.MAX_SAFE_INTEGER : _bPriority;
    return aPriority - bPriority;
  });
};

function getConfiguredRpcUrl(chainId: number) {
  if (!getConfiguredAlchemyRpcUrl) return undefined;

  try {
    return getConfiguredAlchemyRpcUrl(chainId);
  } catch {
    return undefined;
  }
}

function createBalancePublicClient(chainId: number) {
  const chain = getChain(chainId);
  if (!chain) {
    throw new Error(`Chain not found for chain ${chainId}`);
  }

  const rpcUrl = getConfiguredRpcUrl(chainId);
  return createPublicClient({
    chain,
    transport: rpcUrl ? http(rpcUrl) : http(),
  });
}

type BalancePublicClient = ReturnType<typeof createBalancePublicClient>;

const balanceClientCache = new Map<number, BalancePublicClient>();

function getBalancePublicClient(chainId: number): BalancePublicClient {
  const cached = balanceClientCache.get(chainId);
  if (cached) return cached;

  const client = createBalancePublicClient(chainId);

  balanceClientCache.set(chainId, client);
  return client;
}

const getWalletMultiChainNfscBalance = async (
  _chainIds: number[],
  walletAddresses: `0x${string}`[],
) => {
  if (!walletAddresses) {
    throw new Error('Wallet addresses not found');
  }
  const chainIds = sortChainsIdsByPriority(_chainIds);
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
    const balance = await getBalancePublicClient(chainId).multicall({
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
  parentDomain?: string;
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
  const { enabled = true, walletAddresses = [], parentDomain } = options;

  // Simplify: just use the first wallet for balance queries
  const primaryWallet = walletAddresses[0];

  // Chain priority: [Sepolia, Base, Ethereum]
  const { nfscBalanceChainIds: chainIds, isLoading } =
    useAllowedChains(parentDomain);

  const q = useQuery({
    queryKey: ['wallet-multi-chain-nfsc-balance', walletAddresses, chainIds],
    queryFn: () => getWalletMultiChainNfscBalance(chainIds, walletAddresses),
    enabled: enabled && !!primaryWallet && !isLoading,
  });

  // Calculate chain balances
  const _chainBalances = useMemo((): ChainBalance[] => {
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

    return sortBalancesByChainPriority(balances);
  }, [enabled, primaryWallet, q.data]);
  const chainBalancesHash = useMemo(() => {
    return JSON.stringify(
      _chainBalances.map((cb) => ({
        chainId: cb.chainId,
        walletAddress: cb.walletAddress,
        balanceInUsdCents: cb.balanceInUsdCents,
      })),
    );
  }, [_chainBalances]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: using hash to avoid re-rendering
  const chainBalances = useMemo((): ChainBalance[] => {
    return _chainBalances;
  }, [chainBalancesHash]);

  const totalBalanceInUsdCents = useMemo(
    () => chainBalances.reduce((sum, cb) => sum + cb.balanceInUsdCents, 0),
    [chainBalances],
  );

  const canUseBalance = useMemo(
    () => totalBalanceInUsdCents >= 1,
    [totalBalanceInUsdCents],
  );

  return {
    chainBalances,
    totalBalanceInUsdCents,
    canUseBalance,
    isLoadingBalance: primaryWallet ? q.isLoading || isLoading : false, // if no primary wallet, then query is not enabled, so it's not loading
    refetchBalances: async () => {
      await q.refetch();
    },
  };
}
