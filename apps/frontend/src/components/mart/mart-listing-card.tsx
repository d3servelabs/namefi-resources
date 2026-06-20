'use client';

import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import {
  shortToken,
  useExpiryLabel,
} from '@/components/my-domains/marketplace-orders/format';
import { toSafeExternalUrl } from '@/components/domain-and-dns-managment/panels/marketplace/safe-external-url';
import { NetworkLogo } from '@/components/network-logo';
import type { DomainDetails } from '@/components/my-domains/marketplace-orders/use-domain-details';
import { MARKETPLACE_ICONS } from '@/lib/marketplaces/factory';
import type { Listing, MarketplaceId } from '@/lib/marketplaces/types';

interface Props {
  chainId: number;
  marketplaceId: MarketplaceId;
  listing: Listing;
  /**
   * Resolved domain details (name, image) for `listing.tokenAddress` +
   * `listing.tokenId`, provided by the parent via a single batch tRPC call.
   * `undefined` while the batch is in flight or when the token isn't a Namefi
   * domain — the card falls back to the short-token label and a placeholder.
   */
  details?: DomainDetails;
  /** True while the parent's domain-details batch is still resolving. */
  detailsLoading?: boolean;
}

/**
 * A single buy-oriented card in the `/mart` browse grid. Shows the domain's
 * NFT image, name, asking price and a deep link to complete the purchase on
 * the listing's marketplace. Read-only — no wallet interaction happens here;
 * the buy flow lives on the marketplace.
 */
export function MartListingCard({
  chainId,
  marketplaceId,
  listing,
  details,
  detailsLoading,
}: Props) {
  const t = useTranslations('mart');
  const expiryLabel = useExpiryLabel();
  const safeUrl = toSafeExternalUrl(listing.externalUrl);
  const safeImage = toSafeExternalUrl(details?.imageUrl ?? null);
  const displayName =
    details?.normalizedDomainName ??
    shortToken(listing.tokenAddress, listing.tokenId);
  const awaitingName = !details && detailsLoading;

  const card = (
    <Card className="h-full overflow-hidden border border-brand-primary/15 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 transition-colors hover:border-brand-primary/40">
      <div className="relative aspect-square w-full bg-zinc-900">
        {safeImage ? (
          <Image
            src={safeImage}
            alt={details?.normalizedDomainName ?? t('nftAlt')}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
          />
        ) : awaitingName ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <div className="h-full w-full bg-zinc-900" />
        )}
        <Badge
          variant="outline"
          className="absolute end-2 top-2 gap-1.5 bg-background/80 px-2 py-1 backdrop-blur"
        >
          <Image
            src={MARKETPLACE_ICONS[marketplaceId]}
            alt=""
            width={14}
            height={14}
            unoptimized
          />
          {listing.source}
        </Badge>
      </div>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center gap-2">
          {awaitingName ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <span className="min-w-0 truncate font-mono text-zinc-100">
              {displayName}
            </span>
          )}
          <NetworkLogo network={chainId} className="ms-auto h-5 w-5 shrink-0" />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-lg font-semibold text-zinc-100">
            {listing.price.decimal.toFixed(4)} {listing.price.currency.symbol}
          </span>
          <span
            className="text-xs text-zinc-500"
            title={listing.expirationTime}
          >
            {expiryLabel(listing.expirationTime)}
          </span>
        </div>
        {safeUrl ? (
          <span className="inline-flex items-center gap-1 text-sm text-brand-primary">
            {t('buyOn', { marketplace: listing.source })}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </span>
        ) : null}
      </CardContent>
    </Card>
  );

  if (!safeUrl) {
    return card;
  }

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('buyAria', {
        domain: displayName,
        marketplace: listing.source,
      })}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
    >
      {card}
    </a>
  );
}
