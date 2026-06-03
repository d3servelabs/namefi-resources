import { buildDomainSearchOptions } from '@/lib/domain-search-options';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from './use-auth';

type UseDomainSearchOptionsParams = {
  enabled?: boolean;
  includeStudioDomains?: boolean;
  includeFeedListedDomains?: boolean;
  includeOutboundDomains?: boolean;
  onlyDomainsWithLogos?: boolean;
};

const outboundDomainSearchRunsQueryInput = { limit: 50 };

export function useDomainSearchOptions({
  enabled = true,
  includeStudioDomains = true,
  includeFeedListedDomains = true,
  includeOutboundDomains = true,
  onlyDomainsWithLogos = false,
}: UseDomainSearchOptionsParams = {}) {
  const trpc = useTRPC();
  const { isAuthenticated } = useAuth();
  const queryEnabled = enabled && isAuthenticated;

  const userDomainsQuery = useQuery({
    ...trpc.users.getCurrentUserDomains.queryOptions(),
    enabled: queryEnabled && !onlyDomainsWithLogos,
    staleTime: 60_000,
  });

  const studioDomainsQuery = useQuery({
    ...trpc.ai.getUserDomains.queryOptions(),
    enabled: queryEnabled && (includeStudioDomains || onlyDomainsWithLogos),
    staleTime: 60_000,
  });

  const feedListedDomainsQuery = useQuery({
    ...trpc.mls.getCurrentUserListedDomains.queryOptions(),
    enabled: queryEnabled && includeFeedListedDomains && !onlyDomainsWithLogos,
    staleTime: 60_000,
  });

  const outboundRunsQuery = useQuery({
    ...trpc.leadgen.listRuns.queryOptions(outboundDomainSearchRunsQueryInput),
    enabled: queryEnabled && includeOutboundDomains && !onlyDomainsWithLogos,
    staleTime: 60_000,
  });

  const options = useMemo(
    () =>
      buildDomainSearchOptions({
        userDomains: userDomainsQuery.data ?? [],
        studioDomains: studioDomainsQuery.data ?? [],
        feedListedDomains: feedListedDomainsQuery.data?.domains ?? [],
        outboundDomains: outboundRunsQuery.data ?? [],
        includeStudioDomains,
        onlyDomainsWithLogos,
      }),
    [
      feedListedDomainsQuery.data?.domains,
      studioDomainsQuery.data,
      includeStudioDomains,
      onlyDomainsWithLogos,
      outboundRunsQuery.data,
      userDomainsQuery.data,
    ],
  );

  return {
    options,
    isLoading:
      (userDomainsQuery.isLoading && !onlyDomainsWithLogos) ||
      (studioDomainsQuery.isLoading &&
        (includeStudioDomains || onlyDomainsWithLogos)) ||
      (feedListedDomainsQuery.isLoading &&
        includeFeedListedDomains &&
        !onlyDomainsWithLogos) ||
      (outboundRunsQuery.isLoading &&
        includeOutboundDomains &&
        !onlyDomainsWithLogos),
    userDomainsQuery,
    studioDomainsQuery,
    feedListedDomainsQuery,
    outboundRunsQuery,
  };
}
