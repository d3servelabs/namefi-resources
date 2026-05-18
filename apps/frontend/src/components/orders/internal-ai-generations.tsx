/** biome-ignore-all lint/performance/noImgElement: remote AI assets are delivered via plain img */
'use client';

import { useEffect, useState } from 'react';
import { CartCard } from '@/components/cart-card';
import type { AppRouterOutput } from '@/lib/trpc';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { cn } from '@namefi-astra/ui/lib/cn';

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
          <img
            src={logoUrl}
            alt={`${domain} logo`}
            className={cn(
              'h-full w-full object-contain transition-opacity duration-300',
              status === 'loaded' ? 'opacity-100' : 'opacity-0',
            )}
            loading="lazy"
            decoding="async"
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
          No preview
        </div>
      ) : null}
      {showPreviewUnavailable ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Preview unavailable
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
        Just AIng by Namefi™
      </Link>

      <p className="text-sm text-muted-foreground mt-2">
        While your order was processing, we prepared a logo preview for your
        brand(s). Explore more styles and marketing images in Just AIng.
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
