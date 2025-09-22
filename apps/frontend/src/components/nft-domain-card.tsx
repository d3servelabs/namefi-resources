import type { OriginInfo } from '@/lib/origin';
import { originConfig } from '@/lib/origin/config';
import { SquareArrowOutUpRightIcon } from 'lucide-react';
import Link from 'next/link';
import { CartCard } from './cart-card';
import { NamefiButton } from './buttons/namefi-button';
import { NFTDomain } from './nft-domain';

interface NftDomainCardProps {
  item: {
    subdomain: string;
    parentDomain: string;
    fullDomain: string;
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

  return (
    <CartCard className={className ?? 'p-4'}>
      <NFTDomain
        subdomain={item.subdomain}
        parentDomain={item.parentDomain}
        origin={computedOrigin}
      />
      <NamefiButton
        variant="ghost"
        className="w-full mt-4 bg-black/[0.03] border-white/10"
        asChild={true}
        disabled={!isCompleted}
      >
        <Link
          href={`https://${item.fullDomain}`}
          target="_blank"
          tabIndex={isCompleted ? 0 : -1}
        >
          View Your Domain
          <SquareArrowOutUpRightIcon className="w-4 h-4" />
        </Link>
      </NamefiButton>
    </CartCard>
  );
}
