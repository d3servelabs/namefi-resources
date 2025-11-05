import { CartCard } from '@/components/cart-card';
import type { AppRouterOutput } from '@/lib/trpc';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

type InternalAIGenerations =
  AppRouterOutput['ai']['getInternalGenerationsByDomains'];

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
              <div className="relative w-full aspect-square overflow-hidden rounded-md bg-black/[0.03] border border-white/10">
                {logo ? (
                  // biome-ignore lint/performance/noImgElement: using plain img for remote asset
                  <img
                    src={logo.url}
                    alt={`${domain} logo`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    No preview
                  </div>
                )}
              </div>
              <div className="mt-3 text-center text-sm truncate">{domain}</div>
            </div>
          );
        })}
      </div>
    </CartCard>
  );
};
