'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { useLinkedWalletAddresses } from '@/hooks/use-user-wallet-addresses';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { MyListingCard } from './my-listing-card';
import { MyOfferCard } from './my-offer-card';
import {
  domainDetailsKey,
  useDomainDetailsByTokenIds,
} from './use-domain-details';
import { useMyMakerListings, useMyMakerOffers } from './use-maker-orders';

/**
 * Cross-marketplace view of the user's open orders:
 *   - "My listings" — every active listing they have across OpenSea + Rarible
 *     (OKX is hidden via `getCapabilities().byMaker === false`), with the
 *     incoming bids on each listing nested inside the card.
 *   - "My offers on other domains" — every outgoing offer the user has on
 *     someone else's domain on any marketplace they're not the seller of.
 *
 * Domain details (name, image, expiry) for the rendered cards are resolved
 * in a single batch tRPC call at this level — cards just look up their own
 * entry by `(chainId, tokenAddress, tokenId)` in the resulting map.
 */
export function MarketplaceOrdersTab() {
  const t = useTranslations('domains');
  const { linkedWalletAddresses, linkedWalletsReady } =
    useLinkedWalletAddresses();
  const walletAddresses = linkedWalletAddresses as Address[];

  const listingsQuery = useMyMakerListings({
    walletAddresses,
    enabled: linkedWalletsReady,
  });
  const offersQuery = useMyMakerOffers({
    walletAddresses,
    enabled: linkedWalletsReady,
  });

  // Collect every unique (chainId, tokenAddress, tokenId) the rendered cards
  // need so the batch hook fires one tRPC call per (chainId, contract).
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
    for (const row of offersQuery.data) {
      const key = `${row.chainId}:${row.offer.tokenAddress.toLowerCase()}:${row.offer.tokenId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        chainId: row.chainId,
        tokenAddress: row.offer.tokenAddress,
        tokenId: row.offer.tokenId,
      });
    }
    return out;
  }, [listingsQuery.data, offersQuery.data]);

  const detailsQuery = useDomainDetailsByTokenIds(detailTuples);

  if (!linkedWalletsReady) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (walletAddresses.length === 0) {
    return (
      <EmptyPlaceholder>
        <EmptyPlaceholder.Title>
          {t('marketplaceOrders.noLinkedWalletsTitle')}
        </EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          {t('marketplaceOrders.noLinkedWalletsDescription')}
        </EmptyPlaceholder.Description>
      </EmptyPlaceholder>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <header>
          <h3 className="text-base font-semibold text-zinc-100">
            {t('marketplaceOrders.listingsTitle')}
          </h3>
          <p className="text-sm text-zinc-400">
            {t('marketplaceOrders.listingsDescription')}
          </p>
        </header>
        {listingsQuery.isLoading && listingsQuery.data.length === 0 ? (
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : listingsQuery.data.length === 0 ? (
          <EmptyPlaceholder>
            <EmptyPlaceholder.Title>
              {t('marketplaceOrders.noListingsTitle')}
            </EmptyPlaceholder.Title>
            <EmptyPlaceholder.Description>
              {t('marketplaceOrders.noListingsDescription')}
            </EmptyPlaceholder.Description>
          </EmptyPlaceholder>
        ) : (
          <div className="space-y-3">
            {listingsQuery.data.map((row) => (
              <MyListingCard
                key={`${row.marketplaceId}:${row.listing.id}`}
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
              />
            ))}
          </div>
        )}
        {listingsQuery.errors.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {t('marketplaceOrders.partialLoadNote')}
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <header>
          <h3 className="text-base font-semibold text-zinc-100">
            {t('marketplaceOrders.offersTitle')}
          </h3>
          <p className="text-sm text-zinc-400">
            {t('marketplaceOrders.offersDescription')}
          </p>
        </header>
        {offersQuery.isLoading && offersQuery.data.length === 0 ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : offersQuery.data.length === 0 ? (
          <EmptyPlaceholder>
            <EmptyPlaceholder.Title>
              {t('marketplaceOrders.noOffersTitle')}
            </EmptyPlaceholder.Title>
            <EmptyPlaceholder.Description>
              {t('marketplaceOrders.noOffersDescription')}
            </EmptyPlaceholder.Description>
          </EmptyPlaceholder>
        ) : (
          <div className="space-y-3">
            {offersQuery.data.map((row) => (
              <MyOfferCard
                key={`${row.marketplaceId}:${row.offer.id}`}
                chainId={row.chainId}
                marketplaceId={row.marketplaceId}
                offer={row.offer}
                details={detailsQuery.byKey.get(
                  domainDetailsKey(
                    row.chainId,
                    row.offer.tokenAddress,
                    row.offer.tokenId,
                  ),
                )}
              />
            ))}
          </div>
        )}
        {offersQuery.errors.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {t('marketplaceOrders.partialLoadNote')}
          </p>
        ) : null}
      </section>
    </div>
  );
}
