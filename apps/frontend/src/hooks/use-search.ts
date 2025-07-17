import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { useQuery } from '@tanstack/react-query';
import { useSubscription } from '@trpc/tanstack-react-query';
import { useTRPC } from '@/utils/trpc';
import type { DomainAvailabilityInfo } from '@namefi-astra/backend/trpc/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { SearchMode } from '@/components/search/types';
import { parseCSVDomains } from '@/components/search/utils';

export const useSearch = (parentDomain?: string) => {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>(SearchMode.REGISTER);
  const [debounced] = useDebounceValue(query, 200);
  const sanitized = debounced.trim().toLowerCase();

  const onSearchModeChange = useCallback((mode: SearchMode) => {
    setSearchMode(mode);
    setQuery('');
  }, []);

  const trpc = useTRPC();
  const {
    data: suggestionData,
    isFetching: suggestionIsFetching,
    isSuccess: suggestionIsSuccess,
    isError: suggestionIsError,
    error: suggestionError,
    refetch: refetchSuggestions,
  } = useQuery({
    ...trpc.search.getDomainSuggestions.queryOptions(
      {
        query: sanitized,
        ...(parentDomain && { parentDomain }),
      },
      {
        trpc: {
          context: { skipBatch: true },
        },
      },
    ),
    enabled: sanitized.length > 0 && searchMode === SearchMode.REGISTER,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const importQuery = useMemo(() => {
    if (sanitized.length > 0) {
      return parseCSVDomains(sanitized);
    }
    return [];
  }, [sanitized]);

  const domains = useMemo<NamefiNormalizedDomain[]>(
    () =>
      searchMode === SearchMode.IMPORT
        ? importQuery.map((d) => d.domain)
        : suggestionIsFetching
          ? []
          : suggestionIsSuccess
            ? suggestionData.domains
            : [],
    [
      suggestionIsFetching,
      suggestionIsSuccess,
      suggestionData?.domains,
      searchMode,
      importQuery,
    ],
  );

  const [domainInfo, setDomainInfo] = useState<
    Map<NamefiNormalizedDomain, DomainAvailabilityInfo>
  >(new Map());

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset infoMap when domains change
  useEffect(() => setDomainInfo(new Map()), [domains]);

  const { status: availStatus, error: availError } = useSubscription({
    ...trpc.search.streamDomainAvailability.subscriptionOptions(
      { domains },
      {
        onData: (info) =>
          setDomainInfo((m) => new Map(m).set(info.domain, info)),
      },
    ),
    enabled: domains.length > 0,
  });

  const runSearch = useCallback(() => {
    if (query.trim().length === 0) return;
    refetchSuggestions({ cancelRefetch: true });
  }, [query, refetchSuggestions]);

  return {
    query,
    setQuery,
    runSearch,
    searchMode,
    onSearchModeChange,
    importQuery,
    isLoading: suggestionIsFetching || domainInfo.size < domains.length,
    isError: suggestionIsError || availStatus === 'error',
    error: suggestionIsError
      ? suggestionError instanceof Error
        ? suggestionError.message
        : 'Search failed'
      : availStatus === 'error'
        ? availError instanceof Error
          ? availError.message
          : 'Search failed'
        : undefined,
    domains,
    domainInfos: domainInfo,
    hasData: domains.length > 0,
  } as const;
};
