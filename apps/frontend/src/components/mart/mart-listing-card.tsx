'use client';

import { ExternalLink, Info } from 'lucide-react';
import Image from 'next/image';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { shortToken } from '@/components/my-domains/marketplace-orders/format';
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
  /**
   * Current ETH→USD price (USD per 1 ETH), or null when unavailable. Provided
   * by the parent so every card shares one oracle read. Used only to show an
   * approximate fiat value beside an ETH-denominated price.
   */
  ethUsdPrice?: number | null;
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
  ethUsdPrice,
}: Props) {
  const t = useTranslations('mart');
  const safeUrl = toSafeExternalUrl(listing.externalUrl);
  const safeImage = toSafeExternalUrl(details?.imageUrl ?? null);
  const displayName =
    details?.normalizedDomainName ??
    shortToken(listing.tokenAddress, listing.tokenId);
  const awaitingName = !details && detailsLoading;

  return (
    <Card
      className="relative h-full overflow-hidden border border-brand-primary/15 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 transition-colors hover:border-brand-primary/40"
      data-testid={`mart.card.${listing.tokenAddress}-${listing.tokenId}`}
    >
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
            <span
              className="min-w-0 truncate font-mono text-zinc-100"
              data-testid={`mart.card.name.${listing.tokenAddress}-${listing.tokenId}`}
            >
              {displayName}
            </span>
          )}
          <NetworkLogo network={chainId} className="ms-auto h-5 w-5 shrink-0" />
        </div>
        <PriceTag listing={listing} ethUsdPrice={ethUsdPrice} />
        {safeUrl ? (
          // Stretched link: `after:absolute after:inset-0` makes the whole card
          // clickable while keeping the inner info button a valid, separately
          // interactive sibling (not nested inside an <a>).
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('buyAria', {
              domain: displayName,
              marketplace: listing.source,
            })}
            className="inline-flex items-center gap-1 rounded-xs text-sm text-brand-primary after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            data-testid={`mart.card.buy.${listing.tokenAddress}-${listing.tokenId}`}
          >
            {t('buyOn', { marketplace: listing.source })}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * The asking price for a card. ETH/WETH listings render with the Ξ symbol, an
 * info tooltip explaining it, and an approximate USD value; other currencies
 * (USDC, etc.) show their own symbol and no fiat estimate. Kept on one line —
 * the amount never wraps away from its symbol.
 */
function PriceTag({
  listing,
  ethUsdPrice,
}: {
  listing: Listing;
  ethUsdPrice?: number | null;
}) {
  const t = useTranslations('mart');
  const format = useFormatter();

  // Native ETH and WETH are both denominated in ether — render with Ξ and a
  // fiat estimate. Anything else keeps its own ticker.
  const { isNative, symbol } = listing.price.currency;
  const isEther = isNative || symbol === 'ETH' || symbol === 'WETH';
  const usdValue =
    isEther && ethUsdPrice != null ? ethUsdPrice * listing.price.decimal : null;
  const usdLabel =
    usdValue != null
      ? format.number(usdValue, {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: usdValue >= 1000 ? 0 : 2,
        })
      : null;

  return (
    <div
      className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
      data-testid={`mart.card.price.${listing.tokenAddress}-${listing.tokenId}`}
    >
      <span className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-lg font-semibold text-zinc-100">
        {isEther ? (
          <>
            <span aria-hidden="true">Ξ</span>
            {listing.price.decimal.toFixed(4)}
            <Tooltip>
              <TooltipTrigger
                render={(props) => (
                  <button
                    type="button"
                    {...props}
                    aria-label={t('etherSymbolLabel')}
                    className="relative z-10 cursor-help text-zinc-500 transition-colors hover:text-zinc-300"
                  >
                    <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              />
              <TooltipContent>{t('etherSymbolTooltip')}</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            {listing.price.decimal.toFixed(4)} {symbol}
          </>
        )}
      </span>
      {usdLabel ? (
        <span className="whitespace-nowrap text-sm text-zinc-400">
          {t('approxUsd', { amount: usdLabel })}
        </span>
      ) : null}
    </div>
  );
}
