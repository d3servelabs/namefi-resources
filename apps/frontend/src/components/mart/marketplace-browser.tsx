'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import {
  domainDetailsKey,
  useDomainDetailsByTokenIds,
} from '@/components/my-domains/marketplace-orders/use-domain-details';
import { MartListingCard } from './mart-listing-card';
import { useCollectionListings } from './use-collection-listings';
import { useEthUsdPrice } from './use-eth-usd-price';

/**
 * Client island for the `/mart` page: reads OpenSea's active Namefi listings
 * across mainnet chains, resolves each token's domain name + image in one
 * batch tRPC call, and renders the buy-oriented browse grid.
 *
 * Must be mounted inside a wagmi runtime (the listing adapters need a public
 * client) — the page wraps it in `<WagmiProvider>`.
 */
export function MarketplaceBrowser() {
  const t = useTranslations('mart');
  const listingsQuery = useCollectionListings();
  const ethUsdPrice = useEthUsdPrice();

  // Collect every unique (chainId, tokenAddress, tokenId) the cards need so the
  // batch hook fires one tRPC call per (chainId, contract).
  const detailTuples = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{
      chainId: number;
      tokenAddress: Address;
      tokenId: string;
    }> = [];
    for (const row of listingsQuery.data) {
      const key = `${row.chainId}:${row.listing.tokenAddress.toLowerCase()}:${row.listing.tokenId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        chainId: row.chainId,
        tokenAddress: row.listing.tokenAddress,
        tokenId: row.listing.tokenId,
      });
    }
    return out;
  }, [listingsQuery.data]);

  const detailsQuery = useDomainDetailsByTokenIds(detailTuples);

  if (listingsQuery.isLoading && listingsQuery.data.length === 0) {
    return <MarketplaceBrowserSkeleton />;
  }

  // Surface a total-load failure only when *every* chain errored. A partial
  // failure (one chain down, another returning zero listings) must not show
  // "couldn't load listings" — the healthy chain genuinely returned empty, and
  // the failed chain's note is rendered in the empty state below.
  if (
    listingsQuery.data.length === 0 &&
    listingsQuery.allErrored &&
    listingsQuery.isFetched
  ) {
    return (
      <EmptyPlaceholder>
        <EmptyPlaceholder.Title>{t('loadFailedTitle')}</EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          {t('loadFailedDescription')}
        </EmptyPlaceholder.Description>
      </EmptyPlaceholder>
    );
  }

  if (listingsQuery.data.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyPlaceholder>
          <EmptyPlaceholder.Title>{t('emptyTitle')}</EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            {t('emptyDescription')}
          </EmptyPlaceholder.Description>
        </EmptyPlaceholder>
        {/* Some chains loaded empty but at least one failed — say so, so an
            incomplete result isn't mistaken for a confirmed "nothing listed". */}
        {listingsQuery.errors.length > 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            {t('partialLoadNote')}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('resultCount', { count: listingsQuery.data.length })}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {listingsQuery.data.map((row) => (
          <MartListingCard
            key={`${row.chainId}:${row.marketplaceId}:${row.listing.id}`}
            chainId={row.chainId}
            marketplaceId={row.marketplaceId}
            listing={row.listing}
            details={detailsQuery.byKey.get(
              domainDetailsKey(
                row.chainId,
                row.listing.tokenAddress,
                row.listing.tokenId,
              ),
            )}
            detailsLoading={detailsQuery.isLoading}
            ethUsdPrice={ethUsdPrice}
          />
        ))}
      </div>
      {listingsQuery.errors.length > 0 ? (
        <p className="text-xs text-muted-foreground">{t('partialLoadNote')}</p>
      ) : null}
    </div>
  );
}

const SKELETON_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];

export function MarketplaceBrowserSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {SKELETON_KEYS.map((key) => (
        <div
          key={key}
          className="overflow-hidden rounded-xl border border-brand-primary/15"
        >
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
