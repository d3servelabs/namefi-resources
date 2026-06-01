import type {
  DomainSearchOption,
  DomainSearchOptionSource,
} from '@/components/domain-search-combobox';
import { useTRPC, type AppRouterOutput } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from './use-auth';

type UserDomain = AppRouterOutput['users']['getCurrentUserDomains'][number];
type GenerationDomain = AppRouterOutput['ai']['getUserDomains'][number];
type FeedListedDomain =
  AppRouterOutput['mls']['getCurrentUserListedDomains']['domains'][number];

type UseDomainSearchOptionsParams = {
  enabled?: boolean;
  includeGeneratedDomains?: boolean;
  includeFeedListedDomains?: boolean;
  onlyDomainsWithLogos?: boolean;
};

export function useDomainSearchOptions({
  enabled = true,
  includeGeneratedDomains = true,
  includeFeedListedDomains = true,
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

  const options = useMemo(
    () =>
      buildDomainSearchOptions({
        userDomains: userDomainsQuery.data ?? [],
        generationDomains: generationDomainsQuery.data ?? [],
        feedListedDomains: feedListedDomainsQuery.data?.domains ?? [],
        includeGeneratedDomains,
        onlyDomainsWithLogos,
      }),
    [
      feedListedDomainsQuery.data?.domains,
      generationDomainsQuery.data,
      includeGeneratedDomains,
      onlyDomainsWithLogos,
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
        !onlyDomainsWithLogos),
    userDomainsQuery,
    generationDomainsQuery,
    feedListedDomainsQuery,
  };
}

function buildDomainSearchOptions({
  userDomains,
  generationDomains,
  feedListedDomains,
  includeGeneratedDomains,
  onlyDomainsWithLogos,
}: {
  userDomains: UserDomain[];
  generationDomains: GenerationDomain[];
  feedListedDomains: FeedListedDomain[];
  includeGeneratedDomains: boolean;
  onlyDomainsWithLogos: boolean;
}) {
  const byDomain = new Map<string, DomainSearchOption>();

  const addDomain = (value: string, source: DomainSearchOptionSource) => {
    const domain = value.trim().toLowerCase();
    if (!domain) return;

    const existing = byDomain.get(domain);
    if (existing) {
      if (!existing.sources.includes(source)) {
        existing.sources.push(source);
      }
      return;
    }

    byDomain.set(domain, { value: domain, sources: [source] });
  };

  if (onlyDomainsWithLogos) {
    for (const domain of generationDomains) {
      if ((domain.logoCount ?? 0) > 0) {
        addDomain(domain.domain, 'generated');
      }
    }
    return Array.from(byDomain.values());
  }

  for (const domain of userDomains) {
    addDomain(domain.normalizedDomainName, 'owned');
  }

  for (const domain of feedListedDomains) {
    addDomain(domain.domain, 'feed');
  }

  if (includeGeneratedDomains) {
    for (const domain of generationDomains) {
      addDomain(domain.domain, 'generated');
    }
  }

  return Array.from(byDomain.values());
}
