import type { OriginInfo } from '@/lib/origin';
import { originConfig } from '@/lib/origin/config';
import { ExternalLink, Share2, Settings } from 'lucide-react';
import Link from 'next/link';
import { CartCard } from './cart-card';
import { NamefiButton } from './buttons/namefi-button';
import { NFTDomain } from './nft-domain';
import { getNftExplorerUrl } from '@namefi-astra/utils/nft-hash';
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
  domainAction?: 'view' | 'manage' | 'share';
  onShare?: () => void;
  manageHref?: string;
  manageLabel?: string;
  shareLabel?: string;
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
  domainAction = 'view',
  onShare,
  manageHref,
  manageLabel = 'Manage domain',
  shareLabel = 'Share domain',
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
  const manageTarget = manageHref ?? `/domains/${item.fullDomain}`;

  return (
    <CartCard className={className ?? 'p-4'}>
      <NFTDomain
        subdomain={item.subdomain}
        parentDomain={item.parentDomain}
        origin={computedOrigin}
      />
      {showViewDomainButton ? (
        domainAction === 'share' ? (
          <NamefiButton
            className="w-full mt-4"
            disabled={!isCompleted || !onShare}
            onClick={onShare}
          >
            <Share2 className="mr-1 h-4 w-4" />
            {shareLabel}
          </NamefiButton>
        ) : (
          <NamefiButton
            className="w-full mt-4"
            asChild={true}
            disabled={!isCompleted}
          >
            <Link
              href={
                domainAction === 'manage'
                  ? manageTarget
                  : `https://${item.fullDomain}`
              }
              target={domainAction === 'manage' ? undefined : '_blank'}
              tabIndex={isCompleted ? 0 : -1}
            >
              {domainAction === 'manage' ? (
                <>
                  <Settings className="mr-1 h-4 w-4" />
                  {manageLabel}
                </>
              ) : (
                viewDomainButtonText
              )}
              {domainAction === 'manage' ? null : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
            </Link>
          </NamefiButton>
        )
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
