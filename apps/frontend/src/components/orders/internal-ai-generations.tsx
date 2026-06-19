'use client';

import { useEffect, useState } from 'react';
import { CartCard } from '@/components/cart-card';
import type { AppRouterOutput } from '@/lib/trpc';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@namefi-astra/ui/components/shadcn/carousel';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { cn } from '@namefi-astra/ui/lib/cn';
import { DomainName } from '@/components/domain-name';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

type InternalAIGenerations =
  AppRouterOutput['ai']['getInternalGenerationsByDomains'];

type LogoPreviewProps = {
  domain: string;
  logoUrl?: string;
  isLoading?: boolean;
};

export const LogoPreview = ({
  domain,
  logoUrl,
  isLoading = false,
}: LogoPreviewProps) => {
  const t = useTranslations('orders');
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
    logoUrl ? 'loading' : 'error',
  );

  useEffect(() => {
    setStatus(logoUrl ? 'loading' : 'error');
  }, [logoUrl]);

  const isImageLoading = Boolean(logoUrl) && status === 'loading';
  const isGenerating = isLoading && !logoUrl;
  const showNoPreview = !logoUrl && !isLoading;
  const showPreviewUnavailable = Boolean(logoUrl) && status === 'error';

  return (
    <div
      className="relative w-full aspect-square overflow-hidden rounded-md bg-black/[0.03] border border-white/10"
      aria-busy={isImageLoading || isGenerating}
    >
      {logoUrl ? (
        <>
          <Image
            src={logoUrl}
            alt={t('aiGenerations.logoAlt', { domain })}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            className={cn(
              'h-full w-full object-contain transition-opacity duration-300',
              status === 'loaded' ? 'opacity-100' : 'opacity-0',
            )}
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('error')}
          />
          {isImageLoading ? (
            <Skeleton className="absolute inset-0 rounded-md" />
          ) : null}
        </>
      ) : null}
      {isGenerating ? (
        <Skeleton className="absolute inset-0 rounded-md" />
      ) : null}
      {showNoPreview ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          {t('aiGenerations.noPreview')}
        </div>
      ) : null}
      {showPreviewUnavailable ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          {t('aiGenerations.previewUnavailable')}
        </div>
      ) : null}
    </div>
  );
};

export const InternalAIGenerations = ({
  domains,
  internalAIGenerations,
  isLoading = false,
}: {
  domains: string[];
  internalAIGenerations?: InternalAIGenerations;
  isLoading?: boolean;
}) => {
  const t = useTranslations('orders');
  if (domains.length === 0) {
    return null;
  }

  return (
    <CartCard className="mb-6 bg-black/[0.03] border-white/10">
      <Link
        href="/studio"
        className="inline-flex items-center gap-2 text-white underline underline-offset-4 text-xl font-semibold"
      >
        <ExternalLink className="h-5 w-5" />
        {t('aiGenerations.title')}
      </Link>

      <p className="text-sm text-muted-foreground mt-2">
        {t('aiGenerations.description')}
      </p>

      <div className="mt-4 mb-2 flex flex-wrap justify-center gap-4">
        {domains.map((domain) => {
          const gens = internalAIGenerations?.[domain] ?? [];
          const logo = gens.find((g) => g.type === 'logo');
          return (
            <div
              key={`ai-starter-${domain}`}
              className="p-4 w-full sm:w-3/4 md:w-1/2 lg:w-1/3 max-w-sm"
            >
              <LogoPreview
                domain={domain}
                logoUrl={logo?.url ?? undefined}
                isLoading={isLoading}
              />
              <DomainName
                domain={domain}
                className="mt-3 items-center text-center text-sm"
              />
            </div>
          );
        })}
      </div>
    </CartCard>
  );
};

/**
 * Lean carousel of the AI logo previews — used inside the "Just AIng" detail
 * popup on the order completion page (the heading/close come from the
 * Dialog/Sheet around it). Standard shadcn carousel: swipe/drag + arrows.
 */
export const AiLogoCarousel = ({
  domains,
  internalAIGenerations,
  isLoading = false,
}: {
  domains: string[];
  internalAIGenerations?: InternalAIGenerations;
  isLoading?: boolean;
}) => {
  if (domains.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Carousel className="px-1" opts={{ align: 'start' }}>
        <CarouselContent className="-ml-2">
          {domains.map((domain) => {
            const gens = internalAIGenerations?.[domain] ?? [];
            const logo = gens.find((g) => g.type === 'logo');
            return (
              <CarouselItem
                key={`ai-logo-${domain}`}
                className="basis-3/4 pl-2 sm:basis-1/2"
              >
                <LogoPreview
                  domain={domain}
                  logoUrl={logo?.url ?? undefined}
                  isLoading={isLoading}
                />
                <DomainName
                  domain={domain}
                  className="mt-2 items-center text-center text-sm"
                />
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {domains.length > 1 ? (
          <>
            <CarouselPrevious className="left-1 size-7 border-white/10 bg-black/40 text-zinc-200 hover:bg-black/70" />
            <CarouselNext className="right-1 size-7 border-white/10 bg-black/40 text-zinc-200 hover:bg-black/70" />
          </>
        ) : null}
      </Carousel>

      <Link
        href="/studio"
        className="inline-flex items-center gap-2 text-emerald-300 text-sm underline underline-offset-4 hover:text-emerald-200"
      >
        <ExternalLink className="h-4 w-4" />
        Explore in Just AIng
      </Link>
    </div>
  );
};
