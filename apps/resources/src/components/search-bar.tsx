'use client';

import { Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { Dictionary } from '@/get-dictionary';
import type { Locale } from '@/i18n-config';
import { SearchAnalyticsEvent, trackSearchEvent } from '@/lib/analytics-events';

// Minimal shape of the Pagefind runtime we depend on. The bundle is generated at
// build time into public/pagefind (see scripts/build-search-index.ts) and served
// at /r/pagefind, so it can't be imported as a typed module — these types pin
// just the surface we use. Pagefind auto-selects the index matching the page's
// <html lang>, so results are already scoped to the active (cookie-mode) locale.
type PagefindDocMeta = { title?: string; type?: string; excerpt?: string };
type PagefindDoc = { url: string; meta: PagefindDocMeta; excerpt: string };
type PagefindSearchResult = { id: string; data: () => Promise<PagefindDoc> };
type PagefindApi = {
  init?: () => Promise<void>;
  options?: (options: Record<string, unknown>) => Promise<void>;
  search: (term: string) => Promise<{ results: PagefindSearchResult[] } | null>;
};

let pagefindPromise: Promise<PagefindApi> | null = null;

function loadPagefind(): Promise<PagefindApi> {
  if (!pagefindPromise) {
    pagefindPromise = import(
      // @ts-expect-error Pagefind's bundle is generated at build time and is not
      // resolvable at compile time; it is served statically at /r/pagefind.
      /* webpackIgnore: true */ /* turbopackIgnore: true */ '/r/pagefind/pagefind.js'
    ).then(async (mod: PagefindApi) => {
      // Pagefind otherwise derives a base from its bundle location (/r/pagefind)
      // and prepends `/r` to stored result URLs. We index in-app paths
      // (/{locale}/...) and let Next's <Link>/router apply the `/r` basePath, so
      // pin baseUrl to '/' to avoid a doubled `/r/r` prefix on navigation.
      await mod.options?.({ baseUrl: '/' });
      await mod.init?.();
      return mod;
    });
    // Don't cache a rejected promise: a transient failure (missing index,
    // network blip, init error) would otherwise wedge search until a reload.
    // Clearing it lets the next keystroke retry.
    pagefindPromise.catch(() => {
      pagefindPromise = null;
    });
  }
  return pagefindPromise;
}

const MAX_RESULTS = 6;
const DEBOUNCE_MS = 180;
const MIN_QUERY_LENGTH = 2;

type SearchResultItem = {
  id: string;
  url: string;
  title: string;
  type: string;
  excerpt: string;
};

type SearchBarProps = {
  locale: Locale;
  dictionary: Dictionary;
  className?: string;
};

export function SearchBar({ locale, dictionary, className }: SearchBarProps) {
  const { search } = dictionary;
  const router = useRouter();
  const listboxId = useId();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  // Monotonic counter so a slow response can't overwrite a newer query's results.
  const requestSeq = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);
    const seq = ++requestSeq.current;
    const handle = window.setTimeout(async () => {
      try {
        const pagefind = await loadPagefind();
        const response = await pagefind.search(trimmed);
        if (seq !== requestSeq.current) return;
        const docs = await Promise.all(
          (response?.results ?? [])
            .slice(0, MAX_RESULTS)
            .map((result) => result.data()),
        );
        if (seq !== requestSeq.current) return;
        const items: SearchResultItem[] = docs.map((doc, index) => ({
          id: `${doc.url}-${index}`,
          url: doc.url,
          title: doc.meta.title ?? doc.url,
          type: doc.meta.type ?? '',
          excerpt: doc.excerpt,
        }));
        setResults(items);
        setSearched(true);
        setActiveIndex(-1);
        trackSearchEvent(
          items.length > 0
            ? SearchAnalyticsEvent.Performed
            : SearchAnalyticsEvent.NoResults,
          { query: trimmed, results_count: items.length, locale },
        );
      } catch (error) {
        if (seq !== requestSeq.current) return;
        // Search must never break the page; surface "no results" and move on.
        console.error('Pagefind search failed:', error);
        setResults([]);
        setSearched(true);
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [query, locale]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const handleSelect = useCallback(
    (item: SearchResultItem, index: number) => {
      trackSearchEvent(SearchAnalyticsEvent.ResultClicked, {
        query: query.trim(),
        result_url: item.url,
        result_position: index,
        result_type: item.type,
        locale,
      });
      setOpen(false);
      setQuery('');
      router.push(item.url);
    },
    [query, locale, router],
  );

  const showDropdown = open && query.trim().length >= MIN_QUERY_LENGTH;
  const showNoResults =
    showDropdown && searched && !loading && results.length === 0;

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!showDropdown || results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const item = results[activeIndex];
      if (item) handleSelect(item, activeIndex);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          placeholder={search.placeholder}
          aria-label={search.label}
          className="h-9 rounded-full bg-card/80 ps-9 pe-9"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {loading && (
          <Loader2
            className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>

      {showDropdown && (results.length > 0 || showNoResults) && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border/60 bg-popover shadow-lg">
          {results.length > 0 ? (
            <div
              id={listboxId}
              role="listbox"
              className="max-h-[70vh] overflow-y-auto py-2"
            >
              {results.map((item, index) => (
                <Link
                  key={item.id}
                  href={item.url}
                  role="option"
                  tabIndex={-1}
                  aria-selected={index === activeIndex}
                  className={cn(
                    'block px-4 py-2.5 text-start transition',
                    index === activeIndex ? 'bg-muted' : 'hover:bg-muted/60',
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={(event) => {
                    event.preventDefault();
                    handleSelect(item, index);
                  }}
                >
                  <span className="line-clamp-1 text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  {item.excerpt && (
                    <span
                      className="mt-0.5 line-clamp-1 text-xs text-muted-foreground [&_mark]:bg-transparent [&_mark]:font-semibold [&_mark]:text-foreground"
                      // Pagefind returns an excerpt with <mark> tags around the
                      // matched terms. The content is our own MDX, not user input.
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted, build-time content.
                      dangerouslySetInnerHTML={{ __html: item.excerpt }}
                    />
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {search.noResults}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
