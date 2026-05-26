'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { Address } from 'viem';
import { useTRPC } from '@/lib/trpc';

/**
 * The shape a card consumes — mirrors one element of the
 * `registryContract.getDomainDetailsByTokenIds` output, made non-nullable.
 */
export interface DomainDetails {
  tokenId: string;
  chainId: number;
  normalizedDomainName: string;
  expirationTime: Date | null;
  ownerAddress: string;
  isLocked: boolean;
  imageUrl: string;
  metadataUrl: string;
}

/**
 * Key used to look up a single domain's details in the resolved map. Lower-case
 * the contract address so callers don't need to remember the casing convention.
 */
export function domainDetailsKey(
  chainId: number,
  tokenAddress: Address,
  tokenId: string,
): string {
  return `${chainId}:${tokenAddress.toLowerCase()}:${tokenId}`;
}

interface Tuple {
  chainId: number;
  tokenAddress: Address;
  tokenId: string;
}

interface AggregatedDetails {
  /** Lookup keyed by `domainDetailsKey(...)`. Missing entries = not found. */
  byKey: ReadonlyMap<string, DomainDetails>;
  isLoading: boolean;
}

/**
 * Resolve Namefi domain details for a batch of NFT `(chainId, tokenAddress,
 * tokenId)` tuples via the `registry.getDomainDetailsByTokenIds` tRPC
 * procedure. Groups inputs by `(chainId, contractAddress)` so each grouping
 * issues a single batch query.
 *
 * Cards in the panel call `byKey.get(domainDetailsKey(chainId, addr, id))`
 * to look up their own row. Misses return `undefined` and the card falls
 * back to the short-token display.
 */
export function useDomainDetailsByTokenIds(
  tuples: readonly Tuple[],
): AggregatedDetails {
  const trpc = useTRPC();

  // Group tuples by `(chainId, contractAddress)` so each group is one query.
  // Sort tokenIds inside each group to keep the query key stable across
  // re-renders that produce the same set in a different order.
  const groups = useMemo(() => {
    const map = new Map<
      string,
      { chainId: number; contractAddress: Address; tokenIds: string[] }
    >();
    for (const t of tuples) {
      const key = `${t.chainId}:${t.tokenAddress.toLowerCase()}`;
      const existing = map.get(key);
      if (existing) {
        if (!existing.tokenIds.includes(t.tokenId)) {
          existing.tokenIds.push(t.tokenId);
        }
      } else {
        map.set(key, {
          chainId: t.chainId,
          contractAddress: t.tokenAddress,
          tokenIds: [t.tokenId],
        });
      }
    }
    for (const group of map.values()) group.tokenIds.sort();
    return Array.from(map.values());
  }, [tuples]);

  return useQueries({
    queries: groups.map((group) => ({
      ...trpc.registry.getDomainDetailsByTokenIds.queryOptions({
        chainId: group.chainId,
        contractAddress: group.contractAddress,
        tokenIds: group.tokenIds,
      }),
      enabled: group.tokenIds.length > 0,
      // Domain details (name, expiry, owner) change rarely on the time
      // scale of a panel session — a 5-minute cache avoids re-querying as
      // cards mount/unmount during scroll.
      staleTime: 5 * 60 * 1000,
    })),
    combine: (results): AggregatedDetails => {
      const byKey = new Map<string, DomainDetails>();
      let isLoading = false;
      results.forEach((r, idx) => {
        if (r.isLoading) isLoading = true;
        if (!r.data) return;
        const group = groups[idx];
        for (const row of r.data.results) {
          if (!row) continue;
          // Key off `row.tokenId` directly — it's the canonical decimal
          // form the backend handler emits, so it survives any input
          // encoding (`"001"`, `"0x1"`, …) and doesn't assume the
          // response preserves input order.
          byKey.set(
            domainDetailsKey(group.chainId, group.contractAddress, row.tokenId),
            {
              tokenId: row.tokenId,
              chainId: row.chainId,
              normalizedDomainName: row.normalizedDomainName,
              expirationTime: row.expirationTime,
              ownerAddress: row.ownerAddress,
              isLocked: row.isLocked,
              imageUrl: row.imageUrl,
              metadataUrl: row.metadataUrl,
            },
          );
        }
      });
      return { byKey, isLoading };
    },
  });
}
