'use client';

import { NAMEFI_NFT_CONTRACT_ADDRESS } from '@namefi-astra/utils/contract-addresses';
import { getTokenIdFromDomainName } from '@namefi-astra/utils/nft-hash';
import { useMemo } from 'react';
import { ListingBadge } from '@/components/marketplace/listing-badge';
import { WagmiProvider } from '@/components/providers/wagmi';
import { MARKETPLACE_SUPPORTED_CHAINS } from '@/lib/marketplaces/chains';
import { useListings } from './panels/marketplace/use-listings';

function DomainListingBadgeInner({
  domain,
  chainId,
}: {
  domain: string;
  chainId: number;
}) {
  const tokenId = useMemo(() => getTokenIdFromDomainName(domain), [domain]);
  const { data } = useListings({
    chainId,
    tokenAddress: NAMEFI_NFT_CONTRACT_ADDRESS,
    tokenId: tokenId ?? '',
    enabled: !!tokenId,
  });
  const listing = data?.[0];
  return listing ? <ListingBadge listing={listing} /> : null;
}

/**
 * Compact "Listed · <price>" badge shown next to the domain title on the detail
 * page, so a listing is visible without opening the Marketplace tab. Reads the
 * same `useListings` data the Marketplace panel uses; renders nothing when the
 * domain isn't listed or the chain isn't marketplace-supported.
 */
export function DomainListingBadge({
  domain,
  chainId,
}: {
  domain: string;
  chainId: number | bigint;
}) {
  const numChainId = Number(chainId);
  if (!MARKETPLACE_SUPPORTED_CHAINS.includes(numChainId)) {
    return null;
  }
  return (
    <WagmiProvider>
      <DomainListingBadgeInner domain={domain} chainId={numChainId} />
    </WagmiProvider>
  );
}
