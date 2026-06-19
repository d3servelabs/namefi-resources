'use client';

import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { useOffers } from '@/components/domain-and-dns-managment/panels/marketplace/use-listings';
import { toSafeExternalUrl } from '@/components/domain-and-dns-managment/panels/marketplace/safe-external-url';
import { NetworkLogo } from '@/components/network-logo';
import { MARKETPLACE_ICONS } from '@/lib/marketplaces/factory';
import type { Listing, MarketplaceId } from '@/lib/marketplaces/types';
import { shortAddress, shortToken, useExpiryLabel } from './format';
import type { DomainDetails } from './use-domain-details';

interface Props {
  chainId: number;
  marketplaceId: MarketplaceId;
  listing: Listing;
  /**
   * Resolved domain details (name, image, owner) for `listing.tokenAddress` +
   * `listing.tokenId`. Provided by the parent panel via a single batch tRPC
   * call so cards don't need to fetch individually. `undefined` when the
   * batch hasn't returned yet or when the token isn't a Namefi domain.
   */
  details?: DomainDetails;
}

/**
 * Card for a single "my listing" on a specific marketplace, with the active
 * incoming bids nested inside. Bids are fetched per-listing via the existing
 * token-scoped `useOffers` hook — cached by `(chainId, tokenAddress, tokenId)`,
 * so two listings of the same token on different marketplaces share a fetch.
 */
export function MyListingCard({
  chainId,
  marketplaceId,
  listing,
  details,
}: Props) {
  const t = useTranslations('domains');
  const tCommon = useTranslations('common');
  const expiryLabel = useExpiryLabel();
  const offersQuery = useOffers({
    chainId,
    tokenAddress: listing.tokenAddress,
    tokenId: listing.tokenId,
  });
  const safeUrl = toSafeExternalUrl(listing.externalUrl);
  const safeImage = toSafeExternalUrl(details?.imageUrl ?? null);
  const displayName =
    details?.normalizedDomainName ??
    shortToken(listing.tokenAddress, listing.tokenId);

  return (
    <Card className="border border-brand-primary/15 bg-gradient-to-r from-brand-primary/5 via-transparent to-brand-secondary/5">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {safeImage ? (
              <Image
                src={safeImage}
                alt={
                  details?.normalizedDomainName ?? t('marketplaceOrders.nftAlt')
                }
                width={48}
                height={48}
                unoptimized
                className="rounded-md border border-zinc-800 bg-zinc-900"
              />
            ) : (
              <div className="h-12 w-12 rounded-md border border-zinc-800 bg-zinc-900" />
            )}
            <div className="space-y-1.5 min-w-0">
              <CardTitle className="flex flex-wrap items-center gap-2 text-zinc-100">
                <span className="font-mono truncate">{displayName}</span>
                <Badge
                  variant="outline"
                  className="h-auto gap-1.5 px-2 py-1 text-zinc-200"
                >
                  <Image
                    src={MARKETPLACE_ICONS[marketplaceId]}
                    alt=""
                    width={16}
                    height={16}
                    unoptimized
                  />
                  {listing.source}
                </Badge>
                <NetworkLogo network={chainId} className="w-5 h-5" />
              </CardTitle>
              <div className="text-sm text-zinc-300 flex flex-wrap gap-x-4 gap-y-1">
                <span className="font-mono">
                  {listing.price.decimal.toFixed(4)}{' '}
                  {listing.price.currency.symbol}
                </span>
                <span title={listing.expirationTime}>
                  {expiryLabel(listing.expirationTime)}
                </span>
              </div>
            </div>
          </div>
          {safeUrl ? (
            <a
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-zinc-300 hover:text-zinc-100"
            >
              {tCommon('actions.view')}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <h4 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
          {t('marketplaceOrders.incomingBids')}
        </h4>
        {offersQuery.isLoading ? (
          <Skeleton className="h-8 w-full" />
        ) : offersQuery.error ? (
          <p className="text-sm text-red-400">
            {t('marketplaceOrders.loadBidsFailed', {
              error: errorToMessage(offersQuery.error),
            })}
          </p>
        ) : !offersQuery.data || offersQuery.data.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {t('marketplaceOrders.noBidsYet')}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {offersQuery.data.map((offer) => {
              const offerUrl = toSafeExternalUrl(offer.externalUrl);
              // The bid link in this row is icon-only; an explicit
              // `aria-label` gives screen readers a useful announcement.
              const bidLinkLabel = t('marketplaceOrders.viewBidAria', {
                source: offer.source,
                domain: displayName,
              });
              return (
                <li
                  key={`${offer.marketplace}:${offer.id}`}
                  className="flex flex-wrap items-center gap-3 text-sm text-zinc-300 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-1.5"
                >
                  <Image
                    src={MARKETPLACE_ICONS[offer.marketplace]}
                    alt=""
                    width={14}
                    height={14}
                    unoptimized
                  />
                  <span className="font-mono text-zinc-100">
                    {offer.price.decimal.toFixed(4)}{' '}
                    {offer.price.currency.symbol}
                  </span>
                  <span className="text-zinc-500 font-mono">
                    {shortAddress(offer.bidder)}
                  </span>
                  <span
                    className="text-zinc-500 ms-auto"
                    title={offer.expirationTime}
                  >
                    {expiryLabel(offer.expirationTime)}
                  </span>
                  {offerUrl ? (
                    <a
                      href={offerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={bidLinkLabel}
                      title={bidLinkLabel}
                      className="inline-flex items-center gap-1 text-zinc-300 hover:text-zinc-100"
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function errorToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
