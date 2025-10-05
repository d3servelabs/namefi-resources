import { useEffect } from 'react';
import { useQueryState, parseAsString } from 'nuqs';

/**
 * Hook to handle initial search from query parameters
 * Reads 'q' query parameter, sets search query, runs search, and clears the parameter
 */
export const useSearchFromQuery = (
  setQuery: (query: string) => void,
  runSearch: () => void,
) => {
  const [queryParam, setQueryParam] = useQueryState(
    'query',
    parseAsString.withOptions({
      clearOnDefault: true,
    }),
  );

  useEffect(() => {
    if (queryParam && queryParam.trim().length > 0) {
      // Set the search query
      setQuery(queryParam.trim());

      // Clear the query parameter immediately
      setQueryParam(null);

      // Run the search
      runSearch();
    }
  }, [queryParam, setQuery, setQueryParam, runSearch]);
};
