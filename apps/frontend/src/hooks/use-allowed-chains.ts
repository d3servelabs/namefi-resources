import { useTRPC } from '@/lib/trpc';
import { config } from '@/lib/env';
import { CHAINS, getChain } from '@namefi-astra/utils';
import { filter, isNotNil } from 'ramda';
import { useQuery } from '@tanstack/react-query';
import type { Chain } from 'viem';
import { useEffect, useMemo } from 'react';

const PERSISTENCE_KEY = 'allowed-chains-data';
const PERSISTENCE_EXPIRY = 1 * 60 * 60 * 1000; // 1 hour

interface PersistedData {
  chains: number[];
  timestamp: number;
}

function getPersistedChains(): number[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.sessionStorage.getItem(PERSISTENCE_KEY);
    if (!stored) return null;

    const data: PersistedData = JSON.parse(stored);
    const now = Date.now();

    // Check if data is still valid
    if (now - data.timestamp > PERSISTENCE_EXPIRY) {
      window.sessionStorage.removeItem(PERSISTENCE_KEY);
      return null;
    }

    return data.chains;
  } catch {
    return null;
  }
}

function persistChains(chains: number[]): void {
  if (typeof window === 'undefined') return;

  try {
    const data: PersistedData = {
      chains,
      timestamp: Date.now(),
    };
    window.sessionStorage.setItem(PERSISTENCE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail if sessionStorage is not available
  }
}

export function useAllowedChains() {
  const trpc = useTRPC();

  const query = useQuery(
    trpc.config.allowedChains.queryOptions(undefined, {
      staleTime: PERSISTENCE_EXPIRY,
      retry: 2,
    }),
  );
  const persistedChains = useMemo(() => getPersistedChains(), []);

  const chainIds = useMemo(
    () => query.data?.chains || persistedChains || config.ALLOWED_CHAINS,
    [query.data?.chains, persistedChains],
  );

  const allowedChains: Chain[] = useMemo(
    () =>
      filter(
        isNotNil,
        chainIds.map((chainId) => getChain(chainId) as Chain),
      ),
    [chainIds],
  );

  // Persist data when successfully fetched
  useEffect(() => {
    if (query.data?.chains && typeof window !== 'undefined') {
      persistChains(query.data.chains);
    }
  }, [query.data?.chains]);

  return {
    chains: allowedChains,
    chainIds,
    isLoading: query.isLoading && !getPersistedChains(),
    isError: query.isError && !getPersistedChains(),
  };
}

const CHAIN_ID_ORDER = [CHAINS.sepolia.id, CHAINS.base.id, CHAINS.mainnet.id];

export function useDefaultChainId() {
  const { chainIds: allowedChainIds } = useAllowedChains();
  if (Array.isArray(allowedChainIds) && allowedChainIds.length > 0) {
    const found = CHAIN_ID_ORDER.find((chainId) =>
      allowedChainIds.includes(chainId),
    );
    if (isNotNil(found)) {
      return found;
    }
  }
  return CHAINS.base.id;
}
