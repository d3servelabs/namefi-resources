'use client';

import { useQueries } from '@tanstack/react-query';
import { NAMEFI_NFT_CONTRACT_ADDRESS } from '@namefi-astra/utils/contract-addresses';
import { useConfig } from 'wagmi';
import { getPublicClient } from 'wagmi/actions';
import {
  BASE_MAINNET_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
} from '@/lib/marketplaces/chains';
import { getMarketplace } from '@/lib/marketplaces/factory';
import type { Listing, MarketplaceId } from '@/lib/marketplaces/types';

/**
 * Marketplace the `/mart` browser reads from. Scoped to OpenSea: the page's
 * brief is "Namefi NFTs currently listed on OpenSea", and OpenSea is the only
 * adapter whose `getCapabilities().byCollection` is true (it exposes the
 * "all listings in a collection" endpoint the page needs).
 */
const MART_MARKETPLACE_ID: MarketplaceId = 'opensea';

/**
 * Mainnet chains the Namefi NFT singleton is traded on. Testnets are excluded
 * from this public browse surface — buyers shop real listings only.
 */
const MART_CHAIN_IDS: readonly number[] = [
  ETHEREUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
] as const;

/**
 * One row of the browse grid. `chainId` is carried alongside the listing so
 * downstream domain-detail resolution and network badges have the chain —
 * `Listing` itself doesn't carry a chainId field.
 */
export interface CollectionListingRow {
  chainId: number;
  marketplaceId: MarketplaceId;
  listing: Listing;
}

export interface AggregatedCollectionListings {
  data: CollectionListingRow[];
  isLoading: boolean;
  /** True once at least one chain has returned (so the grid can render early). */
  isFetched: boolean;
  errors: Error[];
}

/**
 * Fan out OpenSea's collection-scoped `getListingsByCollection` across every
 * mainnet chain the Namefi NFT lives on, then merge + dedupe into a single
 * grid feed sorted cheapest-first.
 *
 * Each chain is its own React Query so one slow/failed chain doesn't block the
 * other from rendering — partial results still populate the grid, and the
 * failures surface via `errors` for a non-blocking notice.
 */
export function useCollectionListings(
  enabled = true,
): AggregatedCollectionListings {
  const config = useConfig();

  return useQueries({
    queries: MART_CHAIN_IDS.map((chainId) => ({
      queryKey: ['mart-collection-listings', MART_MARKETPLACE_ID, chainId],
      enabled,
      // Listings change on the order of minutes; a short cache keeps the grid
      // snappy across navigations without serving stale prices for long.
      staleTime: 60 * 1000,
      queryFn: async (): Promise<CollectionListingRow[]> => {
        const publicClient = getPublicClient(config, { chainId });
        if (!publicClient) return [];
        const adapter = await getMarketplace({
          id: MART_MARKETPLACE_ID,
          chainId,
          publicClient,
        });
        if (!adapter.getCapabilities().byCollection) return [];
        const listings = await adapter.getListingsByCollection({
          collectionAddress: NAMEFI_NFT_CONTRACT_ADDRESS,
        });
        return listings.map((listing) => ({
          chainId,
          marketplaceId: MART_MARKETPLACE_ID,
          listing,
        }));
      },
    })),
    combine: combineResults,
  });
}

/**
 * Merge the per-chain query results into the aggregated feed: flatten rows,
 * dedupe, sort cheapest-first, and roll up the loading/fetched/error state.
 */
function combineResults(
  results: ReadonlyArray<{
    data?: CollectionListingRow[];
    error?: unknown;
    isLoading: boolean;
    isFetched: boolean;
  }>,
): AggregatedCollectionListings {
  const all: CollectionListingRow[] = [];
  let isLoading = false;
  let isFetched = false;
  const errors: Error[] = [];
  for (const r of results) {
    if (r.isLoading) isLoading = true;
    if (r.isFetched) isFetched = true;
    if (r.error) {
      errors.push(
        r.error instanceof Error ? r.error : new Error(String(r.error)),
      );
    }
    if (r.data) all.push(...r.data);
  }
  return {
    data: sortCheapestFirst(dedupeRows(all)),
    isLoading,
    isFetched,
    errors,
  };
}

/**
 * Dedupe by `(chainId, listing id)`. The Seaport order hash is unique per
 * order, but the same hash can recur across chains in principle, so the chain
 * is part of the key.
 */
function dedupeRows(rows: CollectionListingRow[]): CollectionListingRow[] {
  const seen = new Set<string>();
  const deduped: CollectionListingRow[] = [];
  for (const row of rows) {
    const key = `${row.chainId}:${row.listing.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  return deduped;
}

/**
 * Sort cheapest-first by raw wei. Prices are compared as BigInt within a
 * single currency's wei; cross-currency rows (e.g. an ETH vs USDC listing)
 * are still ordered by raw magnitude, which keeps native-ETH listings — the
 * common case — correctly ranked among themselves.
 */
function sortCheapestFirst(
  rows: CollectionListingRow[],
): CollectionListingRow[] {
  return [...rows].sort((a, b) => {
    const diff = BigInt(a.listing.price.raw) - BigInt(b.listing.price.raw);
    if (diff < 0n) return -1;
    if (diff > 0n) return 1;
    return 0;
  });
}
