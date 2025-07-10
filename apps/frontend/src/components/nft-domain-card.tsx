import type { OriginInfo } from '@/lib/origin';
import { SquareArrowOutUpRightIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { CartCard } from './cart-card';
import { NamefiButton } from './namefi-button';

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
  return (
    <CartCard className={className ?? 'p-4'}>
      <div className="relative w-full aspect-square overflow-hidden rounded-md bg-black/[0.03] border-1 border-brand-primary">
        {origin.config.background && (
          <Image
            src={origin.config.background.image}
            alt={origin.config.background.alt}
            fill={true}
            className="object-cover"
          />
        )}
        <div className="absolute top-4.5 left-4.5">
          <div className="bg-black/70 backdrop-blur-[50px] py-[2px] px-[3px] gap-[3px] rounded-[2px] flex items-center">
            {origin.config.logo.type === 'image' && (
              <Image
                src={origin.config.logo.image}
                alt={origin.config.logo.alt}
                className="rounded-[1px]"
                width={14}
                height={14}
              />
            )}
            <Image
              src="/powered-by-namefi-stacked.svg"
              alt="Powered by Namefi"
              width={25.375}
              height={16}
            />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-start text-secondary-foreground px-3 py-4 bg-gradient-to-t from-black/90 via-black/10 to-transparent">
          <h2 className="text-2xl font-semibold break-all">{item.subdomain}</h2>
          <p className="text-md font-semibold break-all">
            .{item.parentDomain}
          </p>
        </div>
      </div>
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
