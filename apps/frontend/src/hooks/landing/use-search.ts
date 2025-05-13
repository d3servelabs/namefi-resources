import { useInteractionLoggers } from '@/components/providers/interactionLoggersProvider';
import type { AppRouterOutputs } from '@/providers/trpc';
import {
  InteractionLoggingEventName,
  type SearchEvent,
} from '@/utils/interaction-logging/events';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { ascend, prop, sortWith, uniqBy } from 'ramda';
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

type Suggestion = AppRouterOutputs['search']['getDomainSuggestions'][number];
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
        name: InteractionLoggingEventName.SEARCH,
        properties: { search_term: query },
      };
      logEventWithInteractionLoggers(searchEvent);
    }
  }, [isFetched, query, logEventWithInteractionLoggers]);

  // Derived state for domains
  const domains = useMemo(() => {
    const _domains = [
      ...(domainSuggestions ?? []),
      ...(llmDomainSuggestions ?? []),
    ];

    return [
      ...(searchData?.bulkAvailability ?? []),
      ...sortWith(
        [
          (a: Suggestion, b: Suggestion) => {
            if (a.availability === b.availability) {
              return 0;
            }
            if (a.availability && !b.availability) {
              return -1;
            }
            return 1;
          },
          ascend(prop('domain')),
        ],
        uniqBy(prop('domain'), _domains),
      ),
    ];
  }, [searchData?.bulkAvailability, domainSuggestions, llmDomainSuggestions]);

  const isSearchLoading = isLoading || isFetching;
  const areSuggestionsLoading =
    isDomainSuggestionsLoading ||
    isDomainSuggestionsFetching ||
    isLlmDomainSuggestionsLoading ||
    isLlmDomainSuggestionsFetching;

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
    areSuggestionsLoading,
    domainSuggestions,
    llmDomainSuggestions,
  };
}
