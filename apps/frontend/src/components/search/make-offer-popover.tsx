'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';
import { cn } from '@namefi-astra/ui/lib/cn';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import type { FC } from 'react';

type OfferBroker = {
  id: string;
  name: string;
  iconSrc: string;
  buildOfferUrl: (domain: string) => string;
};

// Secondary-market brokers a buyer can reach out to when a domain is already
// registered by someone else. The domain is interpolated into each broker's
// public buyer-intake form via the query string they read it from.
const OFFER_BROKERS: OfferBroker[] = [
  {
    id: 'saw',
    name: 'Saw.com',
    iconSrc: '/assets/marketplaces/saw.png',
    buildOfferUrl: (domain) =>
      `https://saw.com/buy-a-domain/?domain=${encodeURIComponent(domain)}`,
  },
  {
    id: 'domainagents',
    name: 'DomainAgents.com',
    iconSrc: '/assets/marketplaces/domainagents.png',
    buildOfferUrl: (domain) =>
      `https://domainagents.com/?domain=${encodeURIComponent(domain)}`,
  },
];

// "Make offer" for a domain already tokenized on Namefi: a single button that
// opens the domain's OpenSea asset page, where buyers place offers on the NFT.
export const OpenSeaOfferButton: FC<{ href: string; className?: string }> = ({
  href,
  className,
}) => {
  const t = useTranslations('search');

  return (
    <Button
      onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
      aria-label={t('card.makeOfferOnOpenSea')}
      className={cn(
        'h-8 max-w-full shrink-0 gap-1.5 bg-brand-primary px-2.5 text-[11px] text-primary-foreground hover:bg-brand-primary/90 sm:h-9 sm:px-3 sm:text-xs',
        className,
      )}
    >
      {t('card.makeOffer')}
      <Image
        src="/assets/marketplaces/opensea-favicon.png"
        alt="OpenSea"
        width={16}
        height={16}
        className="size-4 shrink-0 rounded-sm"
      />
    </Button>
  );
};

export const MakeOfferButton: FC<{ domain: string; className?: string }> = ({
  domain,
  className,
}) => {
  const t = useTranslations('search');

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label={t('card.makeOfferTitle')}
            className={cn(
              'h-8 max-w-full shrink-0 gap-1 bg-brand-primary px-2.5 text-[11px] text-primary-foreground hover:bg-brand-primary/90 sm:h-9 sm:px-3 sm:text-xs',
              className,
            )}
          />
        }
      >
        {t('card.makeOffer')}
        <ChevronDown className="size-3.5 shrink-0 opacity-80" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 gap-3 p-3">
        <PopoverHeader>
          <PopoverTitle>{t('card.makeOfferTitle')}</PopoverTitle>
          <PopoverDescription className="text-xs">
            {t('card.makeOfferDescription')}
          </PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-1">
          {OFFER_BROKERS.map((broker) => (
            <a
              key={broker.id}
              href={broker.buildOfferUrl(domain)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('card.makeOfferVia', {
                domain,
                broker: broker.name,
              })}
              className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-foreground transition-colors hover:bg-foreground/10"
            >
              <Image
                src={broker.iconSrc}
                alt=""
                width={20}
                height={20}
                className="size-5 shrink-0 rounded-sm"
              />
              <span className="min-w-0 flex-1 truncate font-medium">
                {broker.name}
              </span>
              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
            </a>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
