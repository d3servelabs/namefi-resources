import { useInteractionLoggers } from '@/components/providers/interactionLoggersProvider';
import {
  InteractionLoggingEventName,
  type SearchEvent,
} from '@/utils/interaction-logging/events';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

/**
 * Hook for managing domain search functionality
 */
export function useSearch(parentDomain: string | undefined) {
  const [query, setQuery] = useState('');
  const trpc = useTRPC();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();

  // Data fetching for search results
  const {
    data: searchData,
    isLoading,
    isFetching,
    isFetched,
    refetch,
  } = useQuery({
    ...trpc.search.search.queryOptions({
      query,
      parentDomain,
    }),
    enabled: query.length > 0 && !!parentDomain,
  });

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
    () =>
      (searchData?.bulkAvailability ?? []).filter(
        (domain) => domain.domain !== query,
      ),
    [searchData?.bulkAvailability, query],
  );

  const isSearchLoading = isLoading || isFetching;

  return {
    query,
    setQuery,
    domains,
    isSearchLoading,
    refetch,
    searchData,
    isFetched,
  };
}
