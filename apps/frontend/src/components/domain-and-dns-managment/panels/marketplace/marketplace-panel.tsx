'use client';

import { useMemo } from 'react';
import { NAMEFI_NFT_CONTRACT_ADDRESS } from '@namefi-astra/utils/contract-addresses';
import { getTokenIdFromDomainName } from '@namefi-astra/utils/nft-hash';
import { MARKETPLACE_SUPPORTED_CHAINS } from '@/lib/marketplaces/chains';
import { CreateListingCard } from './create-listing-card';
import { CurrentListingsCard } from './current-listings-card';
import { OffersCard } from './offers-card';
import { UnsupportedChainEmptyState } from './unsupported-chain-empty-state';

interface Props {
  domain: string;
  /** Chain ID the NFT lives on. Comes from `trpc.domainConfig.getDomainOwnerWallet`. */
  nftChainId: number | bigint;
}

export function MarketplacePanel({ domain, nftChainId }: Props) {
  const chainId = Number(nftChainId);
  const tokenId = useMemo(() => getTokenIdFromDomainName(domain), [domain]);

  if (!tokenId || !MARKETPLACE_SUPPORTED_CHAINS.includes(chainId)) {
    return <UnsupportedChainEmptyState chainId={chainId} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <CurrentListingsCard
        domain={domain}
        chainId={chainId}
        tokenAddress={NAMEFI_NFT_CONTRACT_ADDRESS}
        tokenId={tokenId}
      />
      <OffersCard
        chainId={chainId}
        tokenAddress={NAMEFI_NFT_CONTRACT_ADDRESS}
        tokenId={tokenId}
      />
      <CreateListingCard
        domain={domain}
        chainId={chainId}
        tokenAddress={NAMEFI_NFT_CONTRACT_ADDRESS}
        tokenId={tokenId}
      />
    </div>
  );
}
