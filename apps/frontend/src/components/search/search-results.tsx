'use client';

import { Placeholder } from './placeholder';
import { DomainCard, LoadingSkeletons } from './domain-card';
import { SearchMode } from './types';
import { useTRPCClient } from '@/lib/trpc';
import type { MlsSaleListing } from '@/lib/mls/feed';
import type { DomainAvailabilityInfo } from '@namefi-astra/common/domain-availability';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { FC } from 'react';

const MLS_DOMAIN_OFFERS_BATCH_SIZE = 200;

export type SearchResultsProps = {
  isLoading: boolean;
  isError: boolean;
  error?: string;
  hasData: boolean;
  domains: NamefiNormalizedDomain[];
  domainInfos: Map<NamefiNormalizedDomain, DomainAvailabilityInfo>;
  authoritativeDomainInfos?: Map<
    NamefiNormalizedDomain,
    DomainAvailabilityInfo
  >;
  query: string;
  eppAuthorizationCodes: Record<string, string | undefined>;
  onEppCodeChange: (domain: NamefiNormalizedDomain, eppCode: string) => void;
  searchMode: SearchMode;
  freeClaimEligibility?: Array<{
    domain: string;
    eligible: boolean;
    eligibility: Array<{
      groupOrCampaignKey: string;
      claimsAvailable: number;
      hasExactMatch: boolean;
      hasParentMatch: boolean;
    }>;
  }>;
  canLoadMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
};

export const SearchResults: FC<SearchResultsProps> = ({
  isLoading,
  isError,
  error,
  hasData,
  domainInfos,
  authoritativeDomainInfos,
  domains,
  query,
  eppAuthorizationCodes,
  onEppCodeChange,
  searchMode,
  freeClaimEligibility,
  canLoadMore = false,
  onLoadMore,
  isLoadingMore = false,
}) => {
  const t = useTranslations('search');
  const trpcClient = useTRPCClient();
  const { data: mlsOffersByDomain } = useQuery<Record<string, MlsSaleListing>>({
    queryKey: ['search.mlsDomainOffers', domains],
    enabled: domains.length > 0,
    staleTime: 15_000,
    retry: 1,
    queryFn: async () => {
      const normalizedDomains = Array.from(
        new Set(
          domains
            .map((domain) => domain.trim().toLowerCase())
            .filter((domain) => domain.length > 0),
        ),
      );

      if (normalizedDomains.length === 0) {
        return {};
      }

      const offersByDomain: Record<string, MlsSaleListing> = {};
      for (
        let offset = 0;
        offset < normalizedDomains.length;
        offset += MLS_DOMAIN_OFFERS_BATCH_SIZE
      ) {
        const batch = normalizedDomains.slice(
          offset,
          offset + MLS_DOMAIN_OFFERS_BATCH_SIZE,
        );
        if (batch.length === 0) {
          continue;
        }

        const result = await trpcClient.mls.searchDomainOffers.query({
          domains: batch,
        });
        Object.assign(offersByDomain, result.offersByDomain);
      }

      return offersByDomain;
    },
  });

  // Show error state
  if (isError && query.length > 0) {
    return (
      <div>
        <Placeholder
          title={t('results.errorTitle')}
          description={error || t('results.errorDescription')}
        />
      </div>
    );
  }

  // Show loading skeletons when fetching but no data yet
  if (isLoading && !hasData) {
    return (
      <div className="flex flex-col gap-4">
        <LoadingSkeletons key="initial-loading" />
      </div>
    );
  }

  // Show search results with progressive loading
  if (hasData) {
    const isImportMode = searchMode === SearchMode.IMPORT;

    return (
      <div className="flex flex-col gap-4">
        {domains.map((domain) => {
          const availabilityInfo = domainInfos.get(domain);
          const isAvailabilityAuthoritative = authoritativeDomainInfos
            ? authoritativeDomainInfos.has(domain)
            : availabilityInfo !== undefined;
          const claimEligibility = freeClaimEligibility?.find(
            (e) => e.domain === domain,
          );
          const mlsOffer = mlsOffersByDomain?.[domain.toLowerCase()];
          return (
            <DomainCard
              key={domain}
              domain={domain}
              availabilityInfo={availabilityInfo}
              isAvailabilityAuthoritative={isAvailabilityAuthoritative}
              mlsOffer={mlsOffer}
              eppAuthorizationCode={eppAuthorizationCodes[domain]}
              onEppCodeChange={(eppCode) => onEppCodeChange(domain, eppCode)}
              isImportMode={isImportMode}
              freeClaimEligibility={claimEligibility}
            />
          );
        })}
        {canLoadMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              className="mt-2 rounded-full border-white/30 bg-white/5 text-white hover:bg-white/10"
              disabled={isLoadingMore}
              onClick={onLoadMore}
            >
              {isLoadingMore && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('results.loadMore')}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Show "no results" if we have searched, completed, and have no data
  if (query.length > 0 && !isLoading && !hasData) {
    return (
      <div>
        <Placeholder
          title={t('results.noResultsTitle')}
          description={t('results.noResultsDescription', { query })}
        />
      </div>
    );
  }

  // If idle or empty query, don't render anything
  return null;
};
