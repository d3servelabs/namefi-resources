'use client';

import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import Image from 'next/image';
import { MARKETPLACE_ICONS } from '@/lib/marketplaces/factory';
import type { Listing } from '@/lib/marketplaces/types';

/**
 * Presentational "Listed · <price>" badge for an active marketplace listing,
 * linking to the listing on the marketplace. Shared by the domains-table cell
 * and the domain-details header. Callers decide when to render it (i.e. only
 * when a listing exists); this component always renders the badge.
 */
export function ListingBadge({ listing }: { listing: Listing }) {
  const { price, externalUrl } = listing;
  const badge = (
    <Badge
      variant="outline"
      className="gap-1 border-emerald-500/30 text-emerald-300"
    >
      <Image
        src={MARKETPLACE_ICONS[listing.marketplace]}
        alt={listing.source}
        width={14}
        height={14}
        unoptimized
        className="rounded-[3px]"
      />
      {price.decimal} {price.currency.symbol}
    </Badge>
  );

  // externalUrl comes from the marketplace adapter (OpenSea); only linkify https.
  if (externalUrl.startsWith('https://')) {
    return (
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="View listing on the marketplace"
      >
        {badge}
      </a>
    );
  }
  return badge;
}
