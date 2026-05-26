'use client';

import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { toSafeExternalUrl } from '@/components/domain-and-dns-managment/panels/marketplace/safe-external-url';
import { NetworkLogo } from '@/components/network-logo';
import { MARKETPLACE_ICONS } from '@/lib/marketplaces/factory';
import type { MarketplaceId, Offer } from '@/lib/marketplaces/types';
import { formatExpiry, shortToken } from './format';
import type { DomainDetails } from './use-domain-details';

interface Props {
  chainId: number;
  marketplaceId: MarketplaceId;
  offer: Offer;
  /** Resolved details for the target NFT (see `MyListingCard.Props.details`). */
  details?: DomainDetails;
}

/**
 * Card for a single outgoing offer the user has placed on someone else's
 * domain. Read-only — cancelling an offer is a wallet-side action that
 * happens on the marketplace UI itself; we just deep-link to it.
 */
export function MyOfferCard({ chainId, marketplaceId, offer, details }: Props) {
  const safeUrl = toSafeExternalUrl(offer.externalUrl);
  const safeImage = toSafeExternalUrl(details?.imageUrl ?? null);

  return (
    <Card className="border border-zinc-800 bg-zinc-900/50">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {safeImage ? (
              <Image
                src={safeImage}
                alt={details?.normalizedDomainName ?? 'NFT'}
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
                <span className="font-mono truncate">
                  {details?.normalizedDomainName ??
                    shortToken(offer.tokenAddress, offer.tokenId)}
                </span>
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
                  {offer.source}
                </Badge>
                <NetworkLogo network={chainId} className="w-5 h-5" />
              </CardTitle>
              <div className="text-sm text-zinc-300 flex flex-wrap gap-x-4 gap-y-1">
                <span className="font-mono">
                  {offer.price.decimal.toFixed(4)} {offer.price.currency.symbol}
                </span>
                <span title={offer.expirationTime}>
                  {formatExpiry(offer.expirationTime)}
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
              View
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0 text-xs text-zinc-500">
        Your offer is open and waiting for the seller to accept.
      </CardContent>
    </Card>
  );
}
