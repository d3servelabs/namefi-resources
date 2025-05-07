import { useInteractionLoggers } from '@/components/providers/interactionLoggersProvider';
import {
  InteractionLoggingEventName,
  type SearchEvent,
} from '@/utils/interaction-logging/events';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

/**
 * Hook for managing domain search functionality
 */
export function useSearch(
  parentDomain: string | undefined,
  enabledAutoUrlQueryMonitor = true,
) {
  const [query, setQuery] = useState('');
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
        query,
        parentDomain,
        withSuggestions: false,
      },
      {
        enabled: query.length > 0 && !!parentDomain,
        trpc: {
          context: {
            skipBatch: true,
          },
        },
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
        query,
        parentDomain: parentDomain ?? '',
        onlyAvailable: true,
      },
      {
        enabled: query.length > 0 && !!parentDomain,
        trpc: {
          context: {
            skipBatch: true,
          },
        },
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
  const domains = useMemo(
    () => [
      ...(searchData?.bulkAvailability ?? []),
      ...(domainSuggestions ?? []),
    ],
    [searchData?.bulkAvailability, domainSuggestions],
  );

  const isSearchLoading = isLoading || isFetching;
  const areSuggestionsLoading =
    isDomainSuggestionsLoading || isDomainSuggestionsFetching;

  return {
    query,
    setQuery,
    domains,
    isSearchLoading,
    refetch,
    searchData,
    isFetched,
    isDomainSuggestionsFetched,
    areSuggestionsLoading,
    domainSuggestions,
  };
}
