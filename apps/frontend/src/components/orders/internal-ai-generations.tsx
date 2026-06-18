'use client';

import { useEffect, useState } from 'react';
import { CartCard } from '@/components/cart-card';
import type { AppRouterOutput } from '@/lib/trpc';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { cn } from '@namefi-astra/ui/lib/cn';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

type InternalAIGenerations =
  AppRouterOutput['ai']['getInternalGenerationsByDomains'];

type LogoPreviewProps = {
  domain: string;
  logoUrl?: string;
  isLoading?: boolean;
};

const LogoPreview = ({
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
              <div className="mt-3 text-center text-sm truncate">{domain}</div>
            </div>
          );
        })}
      </div>
    </CartCard>
  );
};
