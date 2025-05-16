import { useInteractionLoggers } from '@/components/providers/interactionLoggersProvider';
import {
  InteractionLoggingEventName,
  type SearchEvent,
} from '@/utils/interaction-logging/events';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { groupBy, prop, uniqBy } from 'ramda';
import { useEffect, useMemo, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';

const sharedQueryOptions = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  staleTime: Number.POSITIVE_INFINITY,
  trpc: {
    context: {
      skipBatch: true,
    },
  },
} as const;

/**
 * Hook for managing domain search functionality
 */
export function useSearch(
  parentDomain: string | undefined,
  enabledAutoUrlQueryMonitor = true,
) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounceValue(query, 800);
  const trpc = useTRPC();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!enabledAutoUrlQueryMonitor) {
      return;
    }

    const searchQuery = searchParams.get('query');
    if (searchQuery) {
      setQuery(searchQuery);
    }
  }, [searchParams, enabledAutoUrlQueryMonitor]);

  // Data fetching for search results
  const {
    data: searchData,
    isLoading,
    isFetching,
    isFetched,
    refetch,
  } = useQuery({
    ...trpc.search.search.queryOptions(
      {
        query: debouncedQuery,
        parentDomain,
        withSuggestions: false,
      },
      {
        enabled: debouncedQuery.length > 0 && !!parentDomain,
        ...sharedQueryOptions,
      },
    ),
  });

  const {
    data: domainSuggestions,
    isLoading: isDomainSuggestionsLoading,
    isFetching: isDomainSuggestionsFetching,
    isFetched: isDomainSuggestionsFetched,
  } = useQuery(
    trpc.search.getDomainSuggestions.queryOptions(
      {
        query: debouncedQuery,
        parentDomain: parentDomain ?? '',
        onlyAvailable: true,
      },
      {
        enabled: debouncedQuery.length > 0 && !!parentDomain,
        ...sharedQueryOptions,
      },
    ),
  );

  const {
    data: llmDomainSuggestions,
    isLoading: isLlmDomainSuggestionsLoading,
    isFetching: isLlmDomainSuggestionsFetching,
    isFetched: isLlmDomainSuggestionsFetched,
  } = useQuery(
    trpc.search.getLlmDomainSuggestions.queryOptions(
      {
        query: debouncedQuery,
        parentDomain,
      },
      {
        enabled: debouncedQuery.length > 0 && !!parentDomain,
        ...sharedQueryOptions,
      },
    ),
  );

  // Log completed search queries
  useEffect(() => {
    if (isFetched && query.length > 0) {
      const searchEvent: SearchEvent = {
        name: InteractionLoggingEventName.Search,
        properties: { search_term: query },
      };
      logEventWithInteractionLoggers(searchEvent);
    }
  }, [isFetched, query, logEventWithInteractionLoggers]);

  // Derived state for domains
  const shouldFetchExtraDomainSuggestions = useMemo(() => {
    if (!(domainSuggestions && llmDomainSuggestions)) {
      // If we don't have any base suggestions yet, we don't need to fetch extra suggestions
      return false;
    }

    const _domains = uniqBy(prop('domain'), [
      ...(domainSuggestions ?? []),
      ...(llmDomainSuggestions ?? []),
    ]).filter(({ availability }) => availability);

    return _domains.length < 2;
  }, [domainSuggestions, llmDomainSuggestions]);

  const {
    data: extraDomainSuggestions,
    isLoading: isExtraDomainSuggestionsLoading,
    isFetching: isExtraDomainSuggestionsFetching,
    isFetched: isExtraDomainSuggestionsFetched,
  } = useQuery(
    trpc.search.getDomainSuggestions.queryOptions(
      {
        query: debouncedQuery,
        parentDomain: parentDomain ?? '',
        onlyAvailable: true,
        maxDuration: 20_000,
        maxRound: 10,
      },
      {
        enabled:
          debouncedQuery.length > 0 &&
          !!parentDomain &&
          shouldFetchExtraDomainSuggestions,
        ...sharedQueryOptions,
      },
    ),
  );

  const domains = useMemo(() => {
    const _domains = uniqBy(prop('domain'), [
      ...(domainSuggestions ?? []),
      ...(llmDomainSuggestions ?? []),
      ...(extraDomainSuggestions ?? []),
    ]);

    const _domainsByAvailability = groupBy(
      ({ availability }) => (availability ? 'available' : 'unavailable'),
      _domains,
    );
    return [
      ...(searchData?.bulkAvailability ?? []),
      ...(_domainsByAvailability.available ?? []),
      ...(_domainsByAvailability.unavailable ?? []),
    ];
  }, [
    searchData?.bulkAvailability,
    domainSuggestions,
    llmDomainSuggestions,
    extraDomainSuggestions,
  ]);

  const isSearchLoading = isLoading || isFetching;
  const areSuggestionsLoading =
    isDomainSuggestionsLoading ||
    isDomainSuggestionsFetching ||
    isLlmDomainSuggestionsLoading ||
    isLlmDomainSuggestionsFetching ||
    isExtraDomainSuggestionsLoading ||
    isExtraDomainSuggestionsFetching;

  return {
    query,
    setQuery,
    debouncedQuery,
    domains,
    isSearchLoading,
    refetch,
    searchData,
    isFetched,
    isDomainSuggestionsFetched,
    isLlmDomainSuggestionsFetched,
    isExtraDomainSuggestionsFetched,
    areSuggestionsLoading,
    domainSuggestions,
    llmDomainSuggestions,
    extraDomainSuggestions,
  };
}
