'use client';

import dynamic from 'next/dynamic';
import type { SearchResultsProps } from './search-results';

type SearchResultsModule = typeof import('./search-results');

let searchResultsPromise: Promise<SearchResultsModule> | undefined;

const loadSearchResults = () => {
  searchResultsPromise ??= import('./search-results');
  return searchResultsPromise;
};

export const preloadSearchResults = () => {
  void loadSearchResults();
};

const SEARCH_RESULTS_FALLBACK_ROWS = [
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
] as const;

export const SearchResultsFallback = () => (
  <div className="flex flex-col gap-4" aria-busy="true">
    {SEARCH_RESULTS_FALLBACK_ROWS.map((row) => (
      <div
        key={row}
        className="rounded-xl border border-border bg-card/80 p-4 shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="h-6 w-2/3 rounded-md bg-muted" />
            <div className="mt-3 h-4 w-1/2 rounded-md bg-muted/80" />
          </div>
          <div className="h-10 w-24 rounded-full bg-muted" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="h-9 rounded-md bg-muted/80" />
          <div className="h-9 rounded-md bg-muted/80" />
          <div className="h-9 rounded-md bg-muted/80" />
        </div>
      </div>
    ))}
  </div>
);

export const LazySearchResults = dynamic<SearchResultsProps>(
  () => loadSearchResults().then((module) => module.SearchResults),
  {
    ssr: false,
    loading: () => <SearchResultsFallback />,
  },
);
