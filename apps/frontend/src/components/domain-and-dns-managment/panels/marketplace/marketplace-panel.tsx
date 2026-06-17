'use client';

import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { NAMEFI_NFT_CONTRACT_ADDRESS } from '@namefi-astra/utils/contract-addresses';
import { getTokenIdFromDomainName } from '@namefi-astra/utils/nft-hash';
import { useMemo } from 'react';
import type { Address } from 'viem';
import { MARKETPLACE_SUPPORTED_CHAINS } from '@/lib/marketplaces/chains';
import { CurrentListingsCard } from './current-listings-card';
import { ExportBlockedCard } from './export-blocked-card';
import { UnsupportedChainEmptyState } from './unsupported-chain-empty-state';
import dynamic from 'next/dynamic';

const OffersCard = dynamic(
  () => import('./offers-card').then((m) => m.OffersCard),
  {
    ssr: false,
  },
);

interface Props {
  domain: string;
  /** Chain ID the NFT lives on. Comes from `trpc.domainConfig.getDomainOwnerWallet`. */
  nftChainId: number | bigint;
  /** On-chain holder of the NFT. Comes from `trpc.domainConfig.getDomainOwnerWallet`. */
  ownerAddress: Address;
  /**
   * Whether the domain is exportable to another registrar (`readyToExport` from
   * `trpc.domainConfig.getDomainExportDetails`). An exportable domain can't be
   * listed — its NFT may be burned when the export completes — so the panel
   * shows a notice instead of the listings/offers cards.
   */
  isReadyForExport?: boolean;
  /**
   * Whether the export-status query is still in flight. While true the panel
   * shows a skeleton, so a deep link straight to the Marketplace tab doesn't
   * flash the listings/offers cards before the export check resolves.
   */
  isExportStatusLoading?: boolean;
}

export function MarketplacePanel({
  domain,
  nftChainId,
  ownerAddress,
  isReadyForExport = false,
  isExportStatusLoading = false,
}: Props) {
  const chainId = Number(nftChainId);
  const tokenId = useMemo(() => getTokenIdFromDomainName(domain), [domain]);

  if (!tokenId || !MARKETPLACE_SUPPORTED_CHAINS.includes(chainId)) {
    return <UnsupportedChainEmptyState chainId={chainId} />;
  }

  if (isExportStatusLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  if (isReadyForExport) {
    return <ExportBlockedCard />;
  }

  return (
    <div className="flex flex-col gap-6">
      <CurrentListingsCard
        domain={domain}
        chainId={chainId}
        tokenAddress={NAMEFI_NFT_CONTRACT_ADDRESS}
        tokenId={tokenId}
        ownerAddress={ownerAddress}
      />
      <OffersCard
        chainId={chainId}
        tokenAddress={NAMEFI_NFT_CONTRACT_ADDRESS}
        tokenId={tokenId}
        ownerAddress={ownerAddress}
      />
    </div>
  );
}
