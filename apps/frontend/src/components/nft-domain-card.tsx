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
  className?: string;
}

export function NftDomainCard({
  item,
  origin,
  isCompleted,
  className,
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
          View Your Domain
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </NamefiButton>
      {explorerUrl ? (
        <NamefiButton
          variant="ghost"
          className="w-full mt-2 bg-black/[0.03] border-white/10"
          asChild={true}
        >
          <Link href={explorerUrl} target="_blank" rel="noopener noreferrer">
            {item.chainId !== null ? (
              <NetworkLogo className="size-4" network={item.chainId} />
            ) : null}
            View Your NFT
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </NamefiButton>
      ) : null}
    </CartCard>
  );
}
