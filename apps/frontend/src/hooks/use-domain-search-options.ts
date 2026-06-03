import { buildDomainSearchOptions } from '@/lib/domain-search-options';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from './use-auth';

type UseDomainSearchOptionsParams = {
  enabled?: boolean;
  includeGeneratedDomains?: boolean;
  includeFeedListedDomains?: boolean;
  includeOutboundDomains?: boolean;
  onlyDomainsWithLogos?: boolean;
};

const outboundDomainSearchRunsQueryInput = { limit: 50 };

export function useDomainSearchOptions({
  enabled = true,
  includeGeneratedDomains = true,
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

  const generationDomainsQuery = useQuery({
    ...trpc.ai.getUserDomains.queryOptions(),
    enabled: queryEnabled && (includeGeneratedDomains || onlyDomainsWithLogos),
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
        generationDomains: generationDomainsQuery.data ?? [],
        feedListedDomains: feedListedDomainsQuery.data?.domains ?? [],
        outboundDomains: outboundRunsQuery.data ?? [],
        includeGeneratedDomains,
        onlyDomainsWithLogos,
      }),
    [
      feedListedDomainsQuery.data?.domains,
      generationDomainsQuery.data,
      includeGeneratedDomains,
      onlyDomainsWithLogos,
      outboundRunsQuery.data,
      userDomainsQuery.data,
    ],
  );

  return {
    options,
    isLoading:
      (userDomainsQuery.isLoading && !onlyDomainsWithLogos) ||
      (generationDomainsQuery.isLoading &&
        (includeGeneratedDomains || onlyDomainsWithLogos)) ||
      (feedListedDomainsQuery.isLoading &&
        includeFeedListedDomains &&
        !onlyDomainsWithLogos) ||
      (outboundRunsQuery.isLoading &&
        includeOutboundDomains &&
        !onlyDomainsWithLogos),
    userDomainsQuery,
    generationDomainsQuery,
    feedListedDomainsQuery,
    outboundRunsQuery,
  };
}
