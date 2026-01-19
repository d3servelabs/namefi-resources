/** biome-ignore-all lint/performance/noImgElement: remote AI assets are delivered via plain img */
'use client';

import { useEffect, useState } from 'react';
import { CartCard } from '@/components/cart-card';
import type { AppRouterOutput } from '@/lib/trpc';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { cn } from '@/lib/cn';

type InternalAIGenerations =
  AppRouterOutput['ai']['getInternalGenerationsByDomains'];

type LogoPreviewProps = {
  domain: string;
  logoUrl?: string;
};

const LogoPreview = ({ domain, logoUrl }: LogoPreviewProps) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
    logoUrl ? 'loading' : 'error',
  );

  useEffect(() => {
    setStatus(logoUrl ? 'loading' : 'error');
  }, [logoUrl]);

  const isLoading = status === 'loading';
  const showFallback = !logoUrl || status === 'error';

  return (
    <div
      className="relative w-full aspect-square overflow-hidden rounded-md bg-black/[0.03] border border-white/10"
      aria-busy={isLoading}
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
          {isLoading ? (
            <Skeleton className="absolute inset-0 rounded-md" />
          ) : null}
        </>
      ) : null}
      {showFallback ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          {logoUrl ? 'Preview unavailable' : 'No preview'}
        </div>
      ) : null}
    </div>
  );
};

export const InternalAIGenerations = ({
  domains,
  internalAIGenerations,
}: {
  domains: string[];
  internalAIGenerations?: InternalAIGenerations;
}) => {
  if (domains.length === 0) {
    return null;
  }

  return (
    <CartCard className="mb-6 bg-black/[0.03] border-white/10">
      <Link
        href="/ai-brand-generator"
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
              <LogoPreview domain={domain} logoUrl={logo?.url} />
              <div className="mt-3 text-center text-sm truncate">{domain}</div>
            </div>
          );
        })}
      </div>
    </CartCard>
  );
};
