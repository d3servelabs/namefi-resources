'use client';

import { MlsSaleCard } from '@/components/mls/mls-sale-card';
import { Placeholder } from '@/components/search/placeholder';
import type { MlsSaleListing } from '@/lib/mls/feed';
import { useTRPCClient } from '@/lib/trpc';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { FC } from 'react';

// Per-domain Namefi Feed page body: fetches the sale-post listing for one
// domain and renders it (with its seller + source links) so a "on Namefi feed"
// deeplink lands on a canonical, shareable page where buyers can trace sources.
export const DomainFeedListings: FC<{ domain: string }> = ({ domain }) => {
  const t = useTranslations('feed');
  const trpcClient = useTRPCClient();
  const normalized = domain.trim().toLowerCase();

  const {
    data: listing,
    isLoading,
    isError,
  } = useQuery<MlsSaleListing | null>({
    queryKey: ['feed.domainOffers', normalized],
    enabled: normalized.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const result = await trpcClient.mls.searchDomainOffers.query({
        domains: [normalized],
      });
      return result.offersByDomain[normalized] ?? null;
    },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <Link
        href="/feed"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t('backToFeed')}
      </Link>
      <h1 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">
        {t('domainTitle', { domain })}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t('domainSubtitle', { domain })}
      </p>
      <div className="mt-6">
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl bg-muted-foreground/15" />
        ) : isError ? (
          <Placeholder
            title={t('domainErrorTitle')}
            description={t('domainErrorDescription')}
          />
        ) : listing ? (
          <MlsSaleCard listing={listing} />
        ) : (
          <Placeholder
            title={t('domainEmptyTitle')}
            description={t('domainEmptyDescription', { domain })}
          />
        )}
      </div>
    </div>
  );
};
