import type { OriginInfo } from '@/lib/origin';
import { originConfig } from '@/lib/origin/config';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { CartCard } from './cart-card';
import { NamefiButton } from './buttons/namefi-button';
import { NFTDomain } from './nft-domain';
import { getNftExplorerUrl } from '@namefi-astra/utils';
import { NetworkLogo } from '@/components/network-logo';

export interface NftDomainCardProps {
  item: {
    subdomain: string;
    parentDomain: string;
    fullDomain: string;
    tokenId: string | null;
    chainId: number | null;
  };
  origin: OriginInfo;
  isCompleted: boolean;
  canViewNft: boolean;
  className?: string;
  showViewDomainButton?: boolean;
  viewDomainButtonText?: string;
  viewNftButtonText?: string;
}

export function NftDomainCard({
  item,
  origin,
  isCompleted,
  canViewNft,
  className,
  showViewDomainButton = true,
  viewDomainButtonText = 'View Your Domain',
  viewNftButtonText = 'View Your NFT',
}: NftDomainCardProps) {
  // Determine apex domain and origin-based config, mirroring FreeMintCard logic
  const apex = item.parentDomain;
  const thirdPartyCfg = originConfig.thirdParty[apex];
  const computedOrigin: OriginInfo = thirdPartyCfg
    ? {
        isFirstPartyOrigin: false,
        thirdPartyHostname: apex,
        config: thirdPartyCfg,
      }
    : origin;
  const explorerUrl = getNftExplorerUrl(item.chainId, item.tokenId);

  return (
    <CartCard className={className ?? 'p-4'}>
      <NFTDomain
        subdomain={item.subdomain}
        parentDomain={item.parentDomain}
        origin={computedOrigin}
      />
      {showViewDomainButton ? (
        <NamefiButton
          className="w-full mt-4"
          asChild={true}
          disabled={!isCompleted}
        >
          <Link
            href={`https://${item.fullDomain}`}
            target="_blank"
            tabIndex={isCompleted ? 0 : -1}
          >
            {viewDomainButtonText}
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </NamefiButton>
      ) : null}
      {explorerUrl && canViewNft ? (
        <NamefiButton
          variant="ghost"
          className="w-full mt-2 bg-black/[0.03] border-white/10"
          asChild={true}
        >
          <Link href={explorerUrl} target="_blank" rel="noopener noreferrer">
            {item.chainId !== null ? (
              <NetworkLogo className="size-4" network={item.chainId} />
            ) : null}
            {viewNftButtonText}
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </NamefiButton>
      ) : null}
    </CartCard>
  );
}
