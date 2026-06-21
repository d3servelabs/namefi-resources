'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { NAMEFI_NFT_CONTRACT_ADDRESS } from '@namefi-astra/utils/contract-addresses';
import { Tag, X } from 'lucide-react';
import { useState } from 'react';
import { type Address, getAddress } from 'viem';
import { DomainName } from '@/components/domain-name';
import { CreateListingModal } from '@/components/domain-and-dns-managment/panels/marketplace/create-listing-modal';
import { MARKETPLACE_SUPPORTED_CHAINS } from '@/lib/marketplaces/chains';

export interface ListableDomain {
  fullDomain: string;
  tokenId: string;
  chainId: number;
}

interface Props {
  /**
   * Domains just minted to the buyer that can be listed. Callers should pass
   * only minted items (`hasMintedNft`) with a resolved `tokenId` — listing a
   * not-yet-minted token fails because the marketplace can't find the NFT.
   */
  domains: ListableDomain[];
  /** On-chain holder of the freshly minted NFTs (the order's NFT wallet). */
  ownerAddress: string;
}

/**
 * Post-registration "list for sale" entry on the order completion page. Pure
 * surfacing of the existing single-domain {@link CreateListingModal} — no bulk,
 * no new network calls on mount (the modal lazily reads listings when opened).
 * Dismissible, and only renders for marketplace-supported chains.
 *
 * Expects a wagmi runtime from its parent (the order page has none, so it's
 * rendered via {@link ListOnMarketplaceEntryRuntime}, which adds one).
 */
export function ListOnMarketplaceEntry({ domains, ownerAddress }: Props) {
  const [dismissed, setDismissed] = useState(false);

  const listable = domains.filter((d) =>
    MARKETPLACE_SUPPORTED_CHAINS.includes(d.chainId),
  );

  let owner: Address | null = null;
  try {
    owner = getAddress(ownerAddress);
  } catch {
    owner = null;
  }

  if (dismissed || listable.length === 0 || !owner) {
    return null;
  }

  const multiple = listable.length > 1;

  return (
    <section
      className="mb-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5"
      data-testid="orders.list-for-sale"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Tag className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Ready to sell?
            </h3>
            <p className="text-xs text-zinc-400">
              List your new {multiple ? 'domains' : 'domain'} on a marketplace
              in a few clicks.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="h-7 w-7 shrink-0 text-zinc-500 hover:text-zinc-300"
          data-testid="orders.list-for-sale.dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {listable.map((d) => (
          <li
            key={d.fullDomain}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2"
            data-testid={`orders.list-for-sale.item.${d.fullDomain}`}
          >
            <DomainName
              domain={d.fullDomain}
              className="font-mono text-sm text-zinc-200"
            />
            <CreateListingModal
              domain={d.fullDomain}
              chainId={d.chainId}
              tokenAddress={NAMEFI_NFT_CONTRACT_ADDRESS}
              tokenId={d.tokenId}
              ownerAddress={owner}
              triggerLabel="List on Marketplace"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
