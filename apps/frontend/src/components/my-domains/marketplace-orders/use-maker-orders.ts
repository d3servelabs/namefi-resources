'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { Address } from 'viem';
import { useConfig } from 'wagmi';
import { getPublicClient } from 'wagmi/actions';
import {
  MARKETPLACE_SUPPORTED_CHAINS,
  getMarketplacesSupportedOnChain,
} from '@/lib/marketplaces/chains';
import { getMarketplace } from '@/lib/marketplaces/factory';
import type { Listing, MarketplaceId, Offer } from '@/lib/marketplaces/types';

/**
 * One row of the (chain, listing) tuple returned by `useMyMakerListings`. The
 * `chainId` is carried alongside the listing so the per-listing offers query
 * (`useOffers`) can fire with the correct chain — `Listing` itself doesn't
 * carry a chainId field.
 */
export interface MakerListingRow {
  chainId: number;
  marketplaceId: MarketplaceId;
  listing: Listing;
}

export interface MakerOfferRow {
  chainId: number;
  marketplaceId: MarketplaceId;
  offer: Offer;
}

interface QueryArgs {
  walletAddresses: readonly Address[];
  enabled?: boolean;
}

interface AggregatedListings {
  data: MakerListingRow[];
  isLoading: boolean;
  errors: Error[];
}

interface AggregatedOffers {
  data: MakerOfferRow[];
  isLoading: boolean;
  errors: Error[];
}

/**
 * Fan out `getListingsByMaker` across the cross product of:
 *   - every supported chain in `MARKETPLACE_SUPPORTED_CHAINS`
 *   - every supplied wallet address
 *   - every marketplace adapter on that chain whose `getCapabilities().byMaker`
 *     is true
 *
 * Dedupes by `(marketplace:id)` — Reservoir-style aggregators surface the same
 * Seaport order hash across marketplaces, and we want a single card per order.
 */
export function useMyMakerListings({
  walletAddresses,
  enabled = true,
}: QueryArgs): AggregatedListings {
  const config = useConfig();

  const tuples = useMemo(() => buildTuples(walletAddresses), [walletAddresses]);

  return useQueries({
    queries: tuples.map(({ chainId, marketplaceId, walletAddress }) => ({
      queryKey: [
        'my-maker-listings',
        chainId,
        marketplaceId,
        walletAddress.toLowerCase(),
      ] as const,
      enabled: enabled && walletAddresses.length > 0,
      queryFn: async (): Promise<MakerListingRow[]> => {
        const publicClient = getPublicClient(config, { chainId });
        if (!publicClient) return [];
        const adapter = await getMarketplace({
          id: marketplaceId,
          chainId,
          publicClient,
        });
        if (!adapter.getCapabilities().byMaker) return [];
        const listings = await adapter.getListingsByMaker({
          makerAddress: walletAddress,
        });
        return listings.map((listing) => ({
          chainId,
          marketplaceId,
          listing,
        }));
      },
    })),
    combine: (results) => combineListingResults(results),
  });
}

/** Same as `useMyMakerListings` but for outgoing offers. */
export function useMyMakerOffers({
  walletAddresses,
  enabled = true,
}: QueryArgs): AggregatedOffers {
  const config = useConfig();

  const tuples = useMemo(() => buildTuples(walletAddresses), [walletAddresses]);

  return useQueries({
    queries: tuples.map(({ chainId, marketplaceId, walletAddress }) => ({
      queryKey: [
        'my-maker-offers',
        chainId,
        marketplaceId,
        walletAddress.toLowerCase(),
      ] as const,
      enabled: enabled && walletAddresses.length > 0,
      queryFn: async (): Promise<MakerOfferRow[]> => {
        const publicClient = getPublicClient(config, { chainId });
        if (!publicClient) return [];
        const adapter = await getMarketplace({
          id: marketplaceId,
          chainId,
          publicClient,
        });
        if (!adapter.getCapabilities().byMaker) return [];
        const offers = await adapter.getOffersByMaker({
          makerAddress: walletAddress,
        });
        return offers.map((offer) => ({ chainId, marketplaceId, offer }));
      },
    })),
    combine: (results) => combineOfferResults(results),
  });
}

interface Tuple {
  chainId: number;
  marketplaceId: MarketplaceId;
  walletAddress: Address;
}

function buildTuples(walletAddresses: readonly Address[]): Tuple[] {
  const tuples: Tuple[] = [];
  for (const chainId of MARKETPLACE_SUPPORTED_CHAINS) {
    for (const marketplaceId of getMarketplacesSupportedOnChain(chainId)) {
      for (const walletAddress of walletAddresses) {
        tuples.push({ chainId, marketplaceId, walletAddress });
      }
    }
  }
  return tuples;
}

function combineListingResults(
  results: ReadonlyArray<{
    data?: MakerListingRow[];
    error?: unknown;
    isLoading: boolean;
  }>,
): AggregatedListings {
  const all: MakerListingRow[] = [];
  let isLoading = false;
  const errors: Error[] = [];
  for (const r of results) {
    if (r.isLoading) isLoading = true;
    if (r.error) {
      errors.push(
        r.error instanceof Error ? r.error : new Error(String(r.error)),
      );
    }
    if (r.data) all.push(...r.data);
  }
  return {
    data: dedupeListings(all).sort((a, b) =>
      a.listing.expirationTime.localeCompare(b.listing.expirationTime),
    ),
    isLoading,
    errors,
  };
}

function combineOfferResults(
  results: ReadonlyArray<{
    data?: MakerOfferRow[];
    error?: unknown;
    isLoading: boolean;
  }>,
): AggregatedOffers {
  const all: MakerOfferRow[] = [];
  let isLoading = false;
  const errors: Error[] = [];
  for (const r of results) {
    if (r.isLoading) isLoading = true;
    if (r.error) {
      errors.push(
        r.error instanceof Error ? r.error : new Error(String(r.error)),
      );
    }
    if (r.data) all.push(...r.data);
  }
  return {
    data: dedupeOffers(all).sort((a, b) => {
      const diff = BigInt(b.offer.price.raw) - BigInt(a.offer.price.raw);
      if (diff > 0n) return 1;
      if (diff < 0n) return -1;
      return 0;
    }),
    isLoading,
    errors,
  };
}

function dedupeListings(rows: MakerListingRow[]): MakerListingRow[] {
  const seen = new Set<string>();
  const deduped: MakerListingRow[] = [];
  for (const row of rows) {
    const key = `${row.marketplaceId}:${row.listing.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  return deduped;
}

function dedupeOffers(rows: MakerOfferRow[]): MakerOfferRow[] {
  const seen = new Set<string>();
  const deduped: MakerOfferRow[] = [];
  for (const row of rows) {
    const key = `${row.marketplaceId}:${row.offer.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  return deduped;
}
