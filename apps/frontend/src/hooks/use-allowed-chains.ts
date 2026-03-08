'use client';

import { useOrigin } from '@/components/providers/origin';
import { config } from '@/lib/env';
import { useTRPC } from '@/lib/trpc';
import {
  type AllowedChainsDetails,
  getAllowedChainsForDnsServingNft,
  getAllowedChainsForNft,
  getAllowedChainsForNfscBalance,
  normalizeAllowedChainsParentDomain,
  pickPreferredAllowedChainId,
} from '@namefi-astra/utils/allowed-chains';
import { CHAINS, getChain } from '@namefi-astra/utils/chains';
import { useQuery } from '@tanstack/react-query';
import { filter, isNotNil } from 'ramda';
import { useEffect, useMemo } from 'react';
import type { Chain } from 'viem';

const PERSISTENCE_KEY = 'allowed-chains-config';
const PERSISTENCE_EXPIRY = 60 * 60 * 1000;
const NFT_DEFAULT_CHAIN_ID_ORDER = [
  CHAINS.sepolia.id,
  CHAINS.robinhoodTestnet.id,
  CHAINS.base.id,
  CHAINS.mainnet.id,
] as const;
const NFSC_BALANCE_DEFAULT_CHAIN_ID_ORDER = [
  CHAINS.base.id,
  CHAINS.sepolia.id,
  CHAINS.mainnet.id,
] as const;

interface PersistedData {
  allowedChains: AllowedChainsDetails;
  timestamp: number;
}

function getPersistedAllowedChains(): AllowedChainsDetails | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(PERSISTENCE_KEY);
    if (!stored) {
      return null;
    }

    const data: PersistedData = JSON.parse(stored);
    if (Date.now() - data.timestamp > PERSISTENCE_EXPIRY) {
      window.sessionStorage.removeItem(PERSISTENCE_KEY);
      return null;
    }

    return data.allowedChains;
  } catch {
    return null;
  }
}

function persistAllowedChains(allowedChains: AllowedChainsDetails): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(
      PERSISTENCE_KEY,
      JSON.stringify({
        allowedChains,
        timestamp: Date.now(),
      } satisfies PersistedData),
    );
  } catch {
    return;
  }
}

function getChains(chainIds: readonly number[]): Chain[] {
  return filter(
    isNotNil,
    chainIds.map((chainId) => getChain(chainId) as Chain),
  );
}

export function useAllowedChains(parentDomain?: string) {
  const trpc = useTRPC();
  const origin = useOrigin();
  const resolvedParentDomain = normalizeAllowedChainsParentDomain(
    parentDomain ?? origin.thirdPartyHostname,
  );

  const query = useQuery(
    trpc.config.allowedChains.queryOptions(undefined, {
      staleTime: PERSISTENCE_EXPIRY,
      retry: 2,
    }),
  );

  const persistedAllowedChains = useMemo(() => getPersistedAllowedChains(), []);

  const allowedChains = useMemo<AllowedChainsDetails>(
    () => query.data ?? persistedAllowedChains ?? config.ALLOWED_CHAINS,
    [persistedAllowedChains, query.data],
  );

  useEffect(() => {
    if (query.data && typeof window !== 'undefined') {
      persistAllowedChains(query.data);
    }
  }, [query.data]);

  const nftChainIds = useMemo(
    () => getAllowedChainsForNft(allowedChains, resolvedParentDomain),
    [allowedChains, resolvedParentDomain],
  );
  const dnsServingNftChainIds = useMemo(
    () => getAllowedChainsForDnsServingNft(allowedChains),
    [allowedChains],
  );
  const nfscBalanceChainIds = useMemo(
    () => getAllowedChainsForNfscBalance(allowedChains, resolvedParentDomain),
    [allowedChains, resolvedParentDomain],
  );

  const nftChains = useMemo(() => getChains(nftChainIds), [nftChainIds]);
  const dnsServingNftChains = useMemo(
    () => getChains(dnsServingNftChainIds),
    [dnsServingNftChainIds],
  );
  const nfscBalanceChains = useMemo(
    () => getChains(nfscBalanceChainIds),
    [nfscBalanceChainIds],
  );

  const defaultNftChainId = useMemo(
    () =>
      pickPreferredAllowedChainId(
        nftChainIds,
        NFT_DEFAULT_CHAIN_ID_ORDER,
        CHAINS.base.id,
      ),
    [nftChainIds],
  );
  const defaultNfscBalanceChainId = useMemo(
    () =>
      pickPreferredAllowedChainId(
        nfscBalanceChainIds,
        NFSC_BALANCE_DEFAULT_CHAIN_ID_ORDER,
        CHAINS.base.id,
      ),
    [nfscBalanceChainIds],
  );

  return {
    allowedChains,
    parentDomain: resolvedParentDomain,
    nftChainIds,
    nftChains,
    dnsServingNftChainIds,
    dnsServingNftChains,
    nfscBalanceChainIds,
    nfscBalanceChains,
    defaultNftChainId,
    defaultNfscBalanceChainId,
    isLoading: query.isLoading && !persistedAllowedChains,
    isError: query.isError && !persistedAllowedChains,
  };
}
