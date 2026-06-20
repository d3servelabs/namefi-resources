'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { cn } from '@namefi-astra/ui/lib/cn';
import {
  type BestListing,
  fetchBestListing,
  type ParkChainName,
} from '@/lib/opensea-listing';

export interface InstantBuyProps {
  /** NamefiNFT contract address. */
  contract: string;
  /** Decimal tokenId of the parked domain's NFT. */
  tokenId: string;
  /** Chain the NFT lives on (drives the OpenSea API host + slug). */
  chain: ParkChainName;
  /** OpenSea item URL where the buyer completes the purchase. */
  itemUrl: string;
  /**
   * Listing reader, injectable for stories/tests. Defaults to the real
   * client-side OpenSea read.
   */
  fetcher?: typeof fetchBestListing;
}

type State =
  | { status: 'loading' }
  | { status: 'listed'; listing: BestListing }
  | { status: 'none' };

/**
 * Progressive "Instant Buy" CTA for the parking page. On mount it asks OpenSea
 * (directly, client-side) whether the domain has an active listing; while that's
 * in flight it shows a subtle "Checking price…" pill, then either swaps in a
 * prominent "Instant Buy · <price>" button or renders nothing (not listed /
 * unavailable). It never blocks the server render — the page paints first and
 * this fills in.
 */
export function InstantBuy({
  contract,
  tokenId,
  chain,
  itemUrl,
  fetcher = fetchBestListing,
}: InstantBuyProps) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    fetcher({ contract, tokenId, chain, itemUrl })
      .then((listing) => {
        if (!active) return;
        setState(listing ? { status: 'listed', listing } : { status: 'none' });
      })
      .catch(() => {
        if (active) setState({ status: 'none' });
      });
    return () => {
      active = false;
    };
  }, [contract, tokenId, chain, itemUrl, fetcher]);

  if (state.status === 'none') return null;

  if (state.status === 'loading') {
    return (
      <span
        aria-busy="true"
        className="inline-flex h-11 animate-pulse items-center rounded-full border border-brand-primary/30 bg-background/72 px-7 text-[0.98rem] font-semibold text-foreground/55 sm:h-12 sm:px-9 sm:text-[1.05rem]"
      >
        Checking price…
      </span>
    );
  }

  return (
    <Link
      href={state.listing.itemUrl}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        'inline-flex h-11 items-center rounded-full bg-brand-primary px-7 text-[0.98rem] font-semibold text-black shadow-none transition hover:bg-brand-primary/90 sm:h-12 sm:px-9 sm:text-[1.05rem]',
      )}
    >
      Instant Buy
      <span className="ms-2 opacity-80">· {state.listing.priceLabel}</span>
    </Link>
  );
}
