'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  formatUnits,
  type Address,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { useConfig, usePublicClient } from 'wagmi';
import { getPublicClient, getWalletClient } from 'wagmi/actions';
import { getMarketplacesSupportedOnChain } from '@/lib/marketplaces/chains';
import { getMarketplace } from '@/lib/marketplaces/factory';
import { marketplaceProxyClient } from '@/lib/marketplaces/proxy/trpc-client';
import type {
  Listing,
  ListingInput,
  MarketplaceId,
  Offer,
} from '@/lib/marketplaces/types';

function listingsQueryKey(args: {
  chainId: number;
  tokenAddress: Address;
  tokenId: string;
}) {
  return [
    'marketplace-listings',
    args.chainId,
    args.tokenAddress.toLowerCase(),
    args.tokenId,
  ] as const;
}

function offersQueryKey(args: {
  chainId: number;
  tokenAddress: Address;
  tokenId: string;
}) {
  return [
    'marketplace-offers',
    args.chainId,
    args.tokenAddress.toLowerCase(),
    args.tokenId,
  ] as const;
}

/**
 * Reads listings from all adapters supported on the current chain in parallel and
 * dedupes by listing id.
 */
export function useListings(args: {
  chainId: number;
  tokenAddress: Address;
  tokenId: string;
  enabled?: boolean;
}) {
  const publicClient = usePublicClient({ chainId: args.chainId });
  const supported = getMarketplacesSupportedOnChain(args.chainId);

  return useQuery({
    queryKey: listingsQueryKey(args),
    enabled: Boolean(publicClient) && (args.enabled ?? true),
    queryFn: async () => {
      if (!publicClient) return [] as Listing[];
      const results = await Promise.allSettled(
        supported.map(async (id) => {
          const adapter = await getMarketplace({
            id,
            chainId: args.chainId,
            publicClient,
          });
          return adapter.getExistingListings({
            tokenAddress: args.tokenAddress,
            tokenId: args.tokenId,
          });
        }),
      );
      const fulfilled = results.filter(
        (r): r is PromiseFulfilledResult<Listing[]> => r.status === 'fulfilled',
      );
      if (results.length > 0 && fulfilled.length === 0) {
        // Don't silently render an empty listings table when every adapter errored.
        throw (
          firstRejectionReason(results) ??
          new Error('Failed to load listings from all marketplaces.')
        );
      }
      return dedupeAndSort(fulfilled.flatMap((r) => r.value));
    },
  });
}

/**
 * Reads incoming offers/bids from all supported adapters in parallel.
 */
export function useOffers(args: {
  chainId: number;
  tokenAddress: Address;
  tokenId: string;
  enabled?: boolean;
}) {
  const publicClient = usePublicClient({ chainId: args.chainId });
  const supported = getMarketplacesSupportedOnChain(args.chainId);

  return useQuery({
    queryKey: offersQueryKey(args),
    enabled: Boolean(publicClient) && (args.enabled ?? true),
    queryFn: async () => {
      if (!publicClient) return [] as Offer[];
      const results = await Promise.allSettled(
        supported.map(async (id) => {
          const adapter = await getMarketplace({
            id,
            chainId: args.chainId,
            publicClient,
          });
          return adapter.getOffersForListing({
            tokenAddress: args.tokenAddress,
            tokenId: args.tokenId,
          });
        }),
      );
      const fulfilled = results.filter(
        (r): r is PromiseFulfilledResult<Offer[]> => r.status === 'fulfilled',
      );
      if (results.length > 0 && fulfilled.length === 0) {
        throw (
          firstRejectionReason(results) ??
          new Error('Failed to load offers from all marketplaces.')
        );
      }
      // Sort offers by price desc — top bid first.
      return dedupeOffers(fulfilled.flatMap((r) => r.value)).sort((a, b) => {
        const diff = BigInt(b.price.raw) - BigInt(a.price.raw);
        if (diff > 0n) return 1;
        if (diff < 0n) return -1;
        return 0;
      });
    },
  });
}

interface CreateListingArgs {
  marketplaceId: MarketplaceId;
  input: ListingInput;
}

export function useCreateListing(args: {
  domain?: string;
  chainId: number;
  tokenAddress: Address;
  tokenId: string;
  onSuccess?: (listing: Listing) => void;
}) {
  const queryClient = useQueryClient();
  const config = useConfig();

  return useMutation({
    mutationFn: async ({ marketplaceId, input }: CreateListingArgs) => {
      // Fetch the clients fresh inside the mutation (not from a render-time hook)
      // so a chain switch that just completed in the UI is already reflected —
      // no stale wallet/public client bound to the previous chain.
      const publicClient = getPublicClient(config, { chainId: args.chainId });
      const walletClient = await getWalletClient(config, {
        chainId: args.chainId,
      }).catch(() => undefined);
      assertReady(publicClient, walletClient);
      const adapter = await getMarketplace({
        id: marketplaceId,
        chainId: args.chainId,
        publicClient,
        walletClient,
      });
      const listing = await adapter.createListing(input);
      void syncCreatedListingWithNamefiFeed({
        domain: args.domain,
        chainId: args.chainId,
        listing,
      });
      return listing;
    },
    onSuccess: (listing) => {
      queryClient.invalidateQueries({ queryKey: listingsQueryKey(args) });
      args.onSuccess?.(listing);
    },
  });
}

interface CancelListingArgs {
  listing: Listing;
}

export function useCancelListing(args: {
  domain?: string;
  chainId: number;
  tokenAddress: Address;
  tokenId: string;
  onSuccess?: (listing: Listing) => void;
}) {
  const queryClient = useQueryClient();
  const config = useConfig();

  return useMutation({
    mutationFn: async ({ listing }: CancelListingArgs) => {
      const publicClient = getPublicClient(config, { chainId: args.chainId });
      const walletClient = await getWalletClient(config, {
        chainId: args.chainId,
      }).catch(() => undefined);
      assertReady(publicClient, walletClient);
      const adapter = await getMarketplace({
        id: listing.marketplace,
        chainId: args.chainId,
        publicClient,
        walletClient,
      });
      await adapter.cancelListing(listing);
      void syncCancelledListingWithNamefiFeed({
        domain: args.domain,
        chainId: args.chainId,
        listing,
      });
      return listing;
    },
    onSuccess: (listing) => {
      queryClient.invalidateQueries({ queryKey: listingsQueryKey(args) });
      args.onSuccess?.(listing);
    },
  });
}

async function syncCreatedListingWithNamefiFeed({
  domain,
  chainId,
  listing,
}: {
  domain: string | undefined;
  chainId: number;
  listing: Listing;
}) {
  if (!domain) {
    return;
  }

  try {
    await marketplaceProxyClient.mls.recordNamefiMarketplaceListingCreated.mutate(
      {
        domainName: domain,
        marketplaceId: listing.marketplace,
        chainId,
        tokenAddress: listing.tokenAddress,
        tokenId: listing.tokenId,
        listingId: listing.id,
        sellerAddress: listing.seller,
        priceRaw: listing.price.raw,
        priceDecimal: formatListingPriceDecimal(listing),
        currencySymbol: listing.price.currency.symbol,
        currencyAddress: listing.price.currency.contract,
        listingUrl: listing.externalUrl,
        listedAt: listing.createdAt,
        expiresAt: listing.expirationTime,
      },
    );
  } catch {
    // Namefi feed sync is best-effort and must not roll back marketplace success.
  }
}

async function syncCancelledListingWithNamefiFeed({
  domain,
  chainId,
  listing,
}: {
  domain: string | undefined;
  chainId: number;
  listing: Listing;
}) {
  if (!domain) {
    return;
  }

  try {
    await marketplaceProxyClient.mls.recordNamefiMarketplaceListingCancelled.mutate(
      {
        domainName: domain,
        marketplaceId: listing.marketplace,
        chainId,
        tokenAddress: listing.tokenAddress,
        tokenId: listing.tokenId,
        listingId: listing.id,
        sellerAddress: listing.seller,
        listingUrl: listing.externalUrl,
      },
    );
  } catch {
    // Namefi feed sync is best-effort and must not roll back marketplace success.
  }
}

function formatListingPriceDecimal(listing: Listing) {
  try {
    return formatUnits(
      BigInt(listing.price.raw),
      listing.price.currency.decimals,
    );
  } catch {
    return String(listing.price.decimal);
  }
}

interface AcceptOfferArgs {
  offer: Offer;
}

export function useAcceptOffer(args: {
  chainId: number;
  tokenAddress: Address;
  tokenId: string;
  onSuccess?: (offer: Offer) => void;
}) {
  const queryClient = useQueryClient();
  const config = useConfig();

  return useMutation({
    mutationFn: async ({ offer }: AcceptOfferArgs) => {
      const publicClient = getPublicClient(config, { chainId: args.chainId });
      const walletClient = await getWalletClient(config, {
        chainId: args.chainId,
      }).catch(() => undefined);
      assertReady(publicClient, walletClient);
      const adapter = await getMarketplace({
        id: offer.marketplace,
        chainId: args.chainId,
        publicClient,
        walletClient,
      });
      await adapter.approveOffer(offer);
      return offer;
    },
    onSuccess: (offer) => {
      queryClient.invalidateQueries({ queryKey: offersQueryKey(args) });
      queryClient.invalidateQueries({ queryKey: listingsQueryKey(args) });
      args.onSuccess?.(offer);
    },
  });
}

function dedupeAndSort(listings: Listing[]): Listing[] {
  // Dedupe by the Seaport order hash — Reservoir surfaces OpenSea-orderbook listings
  // under the same hash, so keying by id alone (rather than `${id}:${marketplace}`)
  // collapses them into a single row.
  const seen = new Set<string>();
  const deduped: Listing[] = [];
  for (const listing of listings) {
    if (seen.has(listing.id)) continue;
    seen.add(listing.id);
    deduped.push(listing);
  }
  deduped.sort((a, b) => a.expirationTime.localeCompare(b.expirationTime));
  return deduped;
}

function dedupeOffers(offers: Offer[]): Offer[] {
  const seen = new Set<string>();
  const deduped: Offer[] = [];
  for (const offer of offers) {
    if (seen.has(offer.id)) continue;
    seen.add(offer.id);
    deduped.push(offer);
  }
  return deduped;
}

function assertReady(
  publicClient: PublicClient | undefined,
  walletClient: WalletClient | undefined | null,
): asserts publicClient is PublicClient {
  if (!publicClient) {
    throw new Error('Public client is not ready — try again in a moment.');
  }
  if (!walletClient) {
    throw new Error('Connect a wallet to continue.');
  }
}

function firstRejectionReason(
  results: PromiseSettledResult<unknown>[],
): Error | undefined {
  for (const r of results) {
    if (r.status === 'rejected') {
      return r.reason instanceof Error ? r.reason : new Error(String(r.reason));
    }
  }
  return undefined;
}
