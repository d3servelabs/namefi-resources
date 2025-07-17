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
      const importQueries = parseCSVDomains(sanitized);
      return new Map(importQueries.map((query) => [query.domain, query]));
    }
    return new Map();
  }, [sanitized]);

  const domains = useMemo<NamefiNormalizedDomain[]>(
    () =>
      searchMode === SearchMode.IMPORT
        ? Array.from(importQuery.keys())
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

  const {
    status: availStatus,
    error: availError,
    reset: resetAvailStatus,
  } = useSubscription({
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
    if (searchMode === SearchMode.REGISTER) {
      refetchSuggestions({ cancelRefetch: true });
    } else {
      setDomainInfo(new Map());
      resetAvailStatus();
    }
  }, [query, refetchSuggestions, searchMode, resetAvailStatus]);

  const isLoading = useMemo(() => {
    const isRegisterLoading =
      searchMode === SearchMode.REGISTER && suggestionIsFetching;
    const isImportLoading =
      domains.length > 0 &&
      domainInfo.size < domains.length &&
      availStatus !== 'error' &&
      availStatus !== 'idle';

    return isRegisterLoading || isImportLoading;
  }, [
    searchMode,
    suggestionIsFetching,
    domains.length,
    domainInfo.size,
    availStatus,
  ]);

  return {
    query,
    setQuery,
    runSearch,
    searchMode,
    onSearchModeChange,
    importQuery,
    isLoading,
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
