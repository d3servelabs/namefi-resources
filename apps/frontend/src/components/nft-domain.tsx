import { getOriginInfo } from '@/lib/origin/utils.sync';
import type { OriginInfo } from '@/lib/origin/types';
import Image from 'next/image';
import { cn } from '@namefi-astra/ui/lib/cn';
import { NftDomainLabel } from '@/components/nft-domain-label';
import { toUnicodeDomainName } from '@namefi-astra/registrars/data/validations';

type NFTDomainProps = {
  origin: OriginInfo | string;
  className?: string;
  backgroundSizes?: string;
} & (
  | {
      domainName: string;
    }
  | {
      subdomain: string;
      parentDomain: string;
    }
);

export function NFTDomain({
  origin,
  className,
  backgroundSizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px',
  ...props
}: NFTDomainProps) {
  const rawSubdomain =
    'subdomain' in props
      ? props.subdomain
      : (props.domainName?.split('.')[0] ?? '');
  const rawParentDomain =
    'parentDomain' in props
      ? props.parentDomain
      : (props.domainName?.split('.').slice(1).join('.') ?? '');

  // Convert punycode parts to Unicode for display
  let unicodeSubdomain = rawSubdomain;
  let unicodeParentDomain = rawParentDomain;
  try {
    const fullRaw = rawParentDomain
      ? `${rawSubdomain}.${rawParentDomain}`
      : rawSubdomain;
    const fullUnicode = toUnicodeDomainName(fullRaw);
    if (fullUnicode !== fullRaw) {
      const parts = fullUnicode.split('.');
      unicodeSubdomain = parts[0];
      unicodeParentDomain = parts.slice(1).join('.');
    }
  } catch {
    // keep raw values on conversion failure
  }
  const isPunycode =
    unicodeSubdomain !== rawSubdomain ||
    unicodeParentDomain !== rawParentDomain;
  const originInfo =
    typeof origin === 'string'
      ? getOriginInfo(
          /^https?:\/\//i.test(origin) ? origin : `https://${origin}`,
        )
      : origin;

  return (
    <div
      className={cn(
        'relative w-full aspect-square overflow-hidden rounded-md bg-black/[0.03] border-1 border-brand-primary',
        className,
      )}
    >
      {originInfo.config.background && (
        <Image
          src={originInfo.config.background.image}
          alt={originInfo.config.background.alt}
          fill={true}
          sizes={backgroundSizes}
          className="object-cover"
        />
      )}
      <div className="absolute top-4.5 left-4.5">
        <div className="bg-black/70 backdrop-blur-[50px] py-[2px] px-[3px] gap-[3px] rounded-[2px] flex items-center">
          {originInfo.config.logo?.type === 'image' && (
            <Image
              src={originInfo.config.logo.image}
              alt={originInfo.config.logo.alt}
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
        <NftDomainLabel text={unicodeSubdomain} variant="subdomain" as="h2" />
        <NftDomainLabel
          text={unicodeParentDomain ? `.${unicodeParentDomain}` : ''}
          variant="parent"
          as="p"
        />
        {isPunycode && (
          <span className="block text-xs text-white/60 mt-0.5 break-all">
            {rawParentDomain
              ? `${rawSubdomain}.${rawParentDomain}`
              : rawSubdomain}
          </span>
        )}
      </div>
    </div>
  );
}
