import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  type RefObject,
} from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSubscription } from '@trpc/tanstack-react-query';
import { useTRPC, useTRPCClient, type AppRouterOutput } from '@/lib/trpc';
import type { DomainAvailabilityInfo } from '@namefi-astra/common/domain-availability';
import {
  safeGenerateRankedDomainSuggestions,
  type RankedDomainSuggestionsResult,
} from '@namefi-astra/common/ranked-domain-suggestions';
import { DEFAULT_RANKED_TLD_PAGE_SIZE } from '@namefi-astra/common/tld-rank';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { SearchMode } from '@/components/search/types';
import { parseCSVDomains } from '@/components/search/utils';
import { useAuth } from './use-auth';
import { dropLast, isNil, isEmpty } from 'ramda';
import { resolve } from '@namefi-astra/utils/promises/resolve';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';

declare global {
  interface Window {
    getTimingDetails: () => TimingDetails;
    printTimingDetails: () => void;
    namefiMeasurementConsent?: boolean;
  }
}
type TldPricingInfo =
  AppRouterOutput['registry']['getTldPricingTable']['tldPricing'][number];
type PbnDomainPricing =
  AppRouterOutput['registry']['getTldPricingTable']['pbnDomains'][number];

const RANKED_TLD_PAGE_SIZE = DEFAULT_RANKED_TLD_PAGE_SIZE;

type UseSearchOptions = {
  suggestionSource?: 'api' | 'client-ranked-tlds';
};

export const useSearch = (
  parentDomain?: string,
  options: UseSearchOptions = {},
) => {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>(SearchMode.REGISTER);
  const [debounced] = useDebounceValue(query, 100);
  const sanitized = debounced.trim();
  const [clientSuggestionPagination, setClientSuggestionPagination] = useState({
    key: '',
    page: 1,
  });
  const { isAuthenticated } = useAuth();

  const onSearchModeChange = useCallback((mode: SearchMode) => {
    setSearchMode(mode);
    setQuery('');
  }, []);

  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const normalizedQuery = sanitized.toLowerCase();
  const suggestionEnabled =
    normalizedQuery.length > 0 && searchMode === SearchMode.REGISTER;
  const useClientRankedSuggestions =
    options.suggestionSource === 'client-ranked-tlds' && !parentDomain;
  const clientSuggestionKey = `${normalizedQuery}:${parentDomain ?? ''}`;
  useEffect(() => {
    if (!useClientRankedSuggestions) {
      return;
    }

    setClientSuggestionPagination({
      key: normalizedQuery.length > 0 ? clientSuggestionKey : '',
      page: 1,
    });
  }, [clientSuggestionKey, normalizedQuery.length, useClientRankedSuggestions]);

  const clientSuggestionPage =
    clientSuggestionPagination.key === clientSuggestionKey
      ? clientSuggestionPagination.page
      : 1;
  const {
    error: suggestionError,
    data: suggestionData,
    isFetching: suggestionIsFetching,
    isFetchingNextPage,
    isError: suggestionIsError,
    refetch: refetchSuggestions,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: [
      'search.getDomainSuggestions',
      normalizedQuery,
      parentDomain ?? null,
      RANKED_TLD_PAGE_SIZE,
    ],
    queryFn: ({ pageParam = 1 }) =>
      trpcClient.search.getDomainSuggestions.query({
        query: normalizedQuery,
        ...(parentDomain && { parentDomain }),
        page: pageParam,
        pageSize: RANKED_TLD_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    initialPageParam: 1,
    enabled: suggestionEnabled && !useClientRankedSuggestions,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const clientSuggestionResult = useMemo(() => {
    if (!suggestionEnabled || !useClientRankedSuggestions) {
      return { pages: [], error: undefined };
    }

    const pages: RankedDomainSuggestionsResult[] = [];
    for (let index = 0; index < clientSuggestionPage; index++) {
      const result = safeGenerateRankedDomainSuggestions(
        normalizedQuery,
        index + 1,
        RANKED_TLD_PAGE_SIZE,
      );
      if (!result.success) {
        return { pages: [], error: result.error };
      }
      pages.push(result.data);
    }

    return { pages, error: undefined };
  }, [
    clientSuggestionPage,
    normalizedQuery,
    suggestionEnabled,
    useClientRankedSuggestions,
  ]);
  const clientSuggestionPages = clientSuggestionResult.pages;
  const clientSuggestionError = clientSuggestionResult.error;
  const clientLastSuggestionPage = clientSuggestionPages.at(-1);
  const clientHasNextPage = Boolean(clientLastSuggestionPage?.nextPage);

  const importQuery = useMemo(() => {
    if (sanitized.length > 0) {
      const importQueries = parseCSVDomains(sanitized);
      return new Map(importQueries.map((query) => [query.domain, query]));
    }
    return new Map();
  }, [sanitized]);

  const suggestedDomains = useMemo<NamefiNormalizedDomain[]>(() => {
    if (!suggestionEnabled || searchMode !== SearchMode.REGISTER) {
      return [];
    }
    const pages = useClientRankedSuggestions
      ? clientSuggestionPages
      : (suggestionData?.pages ?? []);
    const seen = new Set<NamefiNormalizedDomain>();
    const collected: NamefiNormalizedDomain[] = [];

    for (const page of pages) {
      for (const domain of page.domains) {
        if (!seen.has(domain)) {
          seen.add(domain);
          collected.push(domain);
        }
      }
    }

    return collected;
  }, [
    clientSuggestionPages,
    searchMode,
    suggestionData?.pages,
    suggestionEnabled,
    useClientRankedSuggestions,
  ]);

  const domains = useMemo<NamefiNormalizedDomain[]>(
    () =>
      searchMode === SearchMode.IMPORT
        ? Array.from(importQuery.keys())
        : suggestedDomains,
    [searchMode, importQuery, suggestedDomains],
  );

  const [authoritativeDomainInfo, setAuthoritativeDomainInfo] = useState<
    Map<NamefiNormalizedDomain, DomainAvailabilityInfo>
  >(new Map());

  const tldPricingQuery = useQuery(
    trpc.registry.getTldPricingTable.queryOptions(),
  );
  const { data: preliminaryDomainAvailability } = useQuery({
    queryKey: ['preliminaryDomainAvailability', domains],
    queryFn: () =>
      getPreliminaryDomainAvailability(
        domains,
        tldPricingQuery.data?.tldPricing ?? [],
        tldPricingQuery.data?.pbnDomains ?? [],
      ),
    enabled: domains.length > 0 && !tldPricingQuery.isLoading,
  });

  const domainInfo = useMemo(() => {
    return new Map<NamefiNormalizedDomain, DomainAvailabilityInfo>([
      ...((preliminaryDomainAvailability?.map((domain) => [
        domain.domain,
        domain,
      ]) as [NamefiNormalizedDomain, DomainAvailabilityInfo][]) ?? []),
      ...authoritativeDomainInfo.entries(),
    ]);
  }, [authoritativeDomainInfo, preliminaryDomainAvailability]);

  const timingDetails = useRef<TimingDetails>({
    numberOfResponses: 0,
    timestamps: [],
  });
  const trackedBeginSearchKeysRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    setAuthoritativeDomainInfo((previous) => {
      if (domains.length === 0) {
        return new Map();
      }

      const next = new Map<NamefiNormalizedDomain, DomainAvailabilityInfo>();
      for (const domain of domains) {
        const existing = previous.get(domain);
        if (existing) {
          next.set(domain, existing);
        }
      }
      return next;
    });
    resetTimingDetails(timingDetails);
  }, [domains]);

  useEffect(() => {
    window.getTimingDetails = () => timingDetails.current;
    window.printTimingDetails = () => {
      printTimingDetails(timingDetails.current);
    };
  }, []);

  // Free claim eligibility check for authenticated users
  const { data: freeClaimEligibility, refetch: refetchFreeClaimEligibility } =
    useQuery({
      ...trpc.search.checkFreeClaimEligibility.queryOptions({
        domains,
      }),
      enabled: isAuthenticated && domains.length > 0,
    });

  const {
    status: availStatus,
    error: availError,
    reset: resetAvailStatus,
  } = useSubscription({
    ...trpc.search.streamDomainAvailability.subscriptionOptions(
      { domains },
      {
        onData(info) {
          setAuthoritativeDomainInfo((m) => new Map(m).set(info.domain, info));
          punchTimestamp(timingDetails);
        },
        onStarted() {
          resetTimingDetails(timingDetails);
        },
      },
    ),
    enabled: domains.length > 0,
  });

  const trackBeginSearch = useCallback(
    (searchTerm: string) => {
      const trimmedSearchTerm = searchTerm.trim();
      if (trimmedSearchTerm.length === 0) return;

      const trackingKey = `${parentDomain ?? ''}:${trimmedSearchTerm}`;
      if (window.namefiMeasurementConsent !== true) {
        return;
      }

      if (trackedBeginSearchKeysRef.current.has(trackingKey)) return;
      trackedBeginSearchKeysRef.current.add(trackingKey);
      void trpcClient.search.trackUserBeginSearch
        .mutate({
          query: trimmedSearchTerm,
          ...(parentDomain && { parentDomain }),
        })
        .catch(() => undefined);
    },
    [parentDomain, trpcClient],
  );

  useEffect(() => {
    if (sanitized.length === 0 || domains.length === 0) return;
    trackBeginSearch(sanitized);
  }, [domains.length, sanitized, trackBeginSearch]);

  const runSearch = useCallback(() => {
    const searchTerm = query.trim();
    if (searchTerm.length === 0) return;

    trackBeginSearch(searchTerm);
    if (searchMode === SearchMode.REGISTER) {
      if (useClientRankedSuggestions) {
        setClientSuggestionPagination({
          key: clientSuggestionKey,
          page: 1,
        });
        return;
      }
      void refetchSuggestions();
    } else {
      setAuthoritativeDomainInfo(new Map());
      resetAvailStatus();
    }
  }, [
    query,
    refetchSuggestions,
    searchMode,
    resetAvailStatus,
    clientSuggestionKey,
    useClientRankedSuggestions,
    trackBeginSearch,
  ]);

  const loadMore = useCallback(() => {
    if (useClientRankedSuggestions) {
      if (clientHasNextPage) {
        setClientSuggestionPagination((previous) => ({
          key: clientSuggestionKey,
          page:
            previous.key === clientSuggestionKey
              ? previous.page + 1
              : clientSuggestionPage + 1,
        }));
      }
      return;
    }
    if (!hasNextPage) return;
    void fetchNextPage();
  }, [
    clientHasNextPage,
    clientSuggestionKey,
    clientSuggestionPage,
    fetchNextPage,
    hasNextPage,
    useClientRankedSuggestions,
  ]);

  const isAvailabilityStreaming =
    domains.length > 0 &&
    authoritativeDomainInfo.size < domains.length &&
    availStatus !== 'error' &&
    availStatus !== 'idle';

  const isRegisterLoading =
    searchMode === SearchMode.REGISTER &&
    !useClientRankedSuggestions &&
    suggestionIsFetching &&
    suggestedDomains.length === 0;

  const isLoading = useMemo(
    () => isRegisterLoading || isAvailabilityStreaming,
    [isAvailabilityStreaming, isRegisterLoading],
  );

  const hasData = domains.length > 0;

  const canLoadMore =
    searchMode === SearchMode.REGISTER &&
    !parentDomain &&
    (useClientRankedSuggestions ? clientHasNextPage : Boolean(hasNextPage));

  const isLoadingMore =
    searchMode === SearchMode.REGISTER &&
    !useClientRankedSuggestions &&
    Boolean(isFetchingNextPage);

  return {
    query,
    setQuery,
    runSearch,
    searchMode,
    onSearchModeChange,
    importQuery,
    isLoading,
    isError:
      (useClientRankedSuggestions && Boolean(clientSuggestionError)) ||
      (!useClientRankedSuggestions && suggestionIsError) ||
      availStatus === 'error',
    error:
      useClientRankedSuggestions && clientSuggestionError instanceof Error
        ? clientSuggestionError.message
        : !useClientRankedSuggestions && suggestionIsError
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
    authoritativeDomainInfos: authoritativeDomainInfo,
    hasData,
    loadMore,
    canLoadMore,
    isLoadingMore,
    freeClaimEligibility,
    refetchFreeClaimEligibility,
  } as const;
};

function resolveNsDOH(domain: NamefiNormalizedDomain) {
  return fetch(`https://dns.google/resolve?name=${domain}&type=NS`)
    .then((res) => res.json())
    .then((data) => data.Answer?.map((answer: any) => answer.data))
    .then((ns) => ns?.map((ns: string) => ns.trim()))
    .catch((error) => {
      // biome-ignore lint/suspicious/noConsole: used for debugging
      console.error('Error resolving NS for', domain, error);
      return [];
    });
}

function resolveIpv4DOH(domain: NamefiNormalizedDomain) {
  return fetch(`https://dns.google/resolve?name=${domain}&type=A`)
    .then((res) => res.json())
    .then((data) => data.Answer?.map((answer: any) => answer.data))
    .then((ips) => ips?.map((ip: string) => ip.trim()))
    .catch((error) => {
      // biome-ignore lint/suspicious/noConsole: used for debugging
      console.error('Error resolving A record for', domain, error);
      return [];
    });
}

type PricingMapEntry =
  | { kind: 'tld'; info: TldPricingInfo }
  | { kind: 'pbn'; info: PbnDomainPricing };

const getPreliminaryDomainAvailability = async (
  _domains: NamefiNormalizedDomain[],
  tldPricingInfo: TldPricingInfo[],
  pbnDomainPricing: PbnDomainPricing[],
): Promise<DomainAvailabilityInfo[]> => {
  const priceMap = new Map<string, PricingMapEntry>();
  for (const info of tldPricingInfo) {
    priceMap.set(info.tld, { kind: 'tld', info });
  }
  for (const info of pbnDomainPricing) {
    priceMap.set(info.normalizedDomainName, { kind: 'pbn', info });
  }

  const parsedDomains = _domains
    .map((domain) => ({ domain, parsed: parseDomainName(domain) }))
    .filter(
      (
        entry,
      ): entry is {
        domain: NamefiNormalizedDomain;
        parsed: Extract<ReturnType<typeof parseDomainName>, { valid: true }>;
      } => entry.parsed.valid,
    );

  return Promise.all(
    parsedDomains.map(async ({ domain, parsed }) => {
      const [_error, records] = await resolve(
        parsed.registryType === 'subdomain'
          ? resolveIpv4DOH(domain)
          : resolveNsDOH(domain),
      );
      const availability = isNil(records) || isEmpty(records);
      const priceKey =
        parsed.registryType === 'subdomain'
          ? parsed.immediateParentDomain
          : parsed.publicSuffix;
      const pricingEntry = priceMap.get(priceKey);

      if (!pricingEntry) {
        return {
          domain,
          availability: false,
          pricingDetails: undefined,
          currentOwner: undefined,
          durationValidationInYears: { min: 1, max: 1 },
          importable: false,
          registrarKey: undefined,
          supported: false,
        } satisfies DomainAvailabilityInfo;
      }

      const amounts =
        pricingEntry.kind === 'pbn'
          ? {
              registration: pricingEntry.info.costPerYearInUsd,
              renewal: pricingEntry.info.costPerYearInUsd,
              transfer: pricingEntry.info.costPerYearInUsd,
            }
          : {
              registration: pricingEntry.info.registrationPriceUsdPerYear,
              renewal: pricingEntry.info.renewalPriceUsdPerYear,
              transfer: pricingEntry.info.transferPriceUsdPerYear,
            };
      const { registration, renewal, transfer } = amounts;

      if (isNil(registration) || isNil(renewal) || isNil(transfer)) {
        return {
          domain,
          availability: false,
          pricingDetails: undefined,
          currentOwner: undefined,
          durationValidationInYears: { min: 1, max: 1 },
          importable: false,
          registrarKey:
            pricingEntry.kind === 'tld'
              ? pricingEntry.info.registrarKey
              : 'namefi',
          supported: false,
        } satisfies DomainAvailabilityInfo;
      }

      return {
        domain,
        availability,
        pricingDetails: {
          importPrice: {
            type: 'PER_YEAR',
            price: {
              amount: transfer,
              currency: 'USD',
            },
          },
          registrationPrice: {
            type: 'PER_YEAR',
            price: {
              amount: registration,
              currency: 'USD',
            },
          },
          renewalPrice: {
            type: 'PER_YEAR',
            price: {
              amount: renewal,
              currency: 'USD',
            },
          },
        },
        currentOwner: undefined,
        durationValidationInYears: { min: 1, max: 1 },
        importable: !availability,
        registrarKey:
          pricingEntry.kind === 'tld'
            ? pricingEntry.info.registrarKey
            : 'namefi',
        supported: true,
      } satisfies DomainAvailabilityInfo;
    }),
  );
};

function punchTimestamp(timingDetails: RefObject<TimingDetails>) {
  try {
    const stamp = performance.now();
    if (!timingDetails.current.startTime) {
      timingDetails.current.startTime = stamp;
    }
    const startTime = timingDetails.current.startTime;
    timingDetails.current.numberOfResponses++;
    timingDetails.current.lastResponseTimestamp = stamp;
    timingDetails.current.totalResponseDuration = stamp - startTime;
    if (!timingDetails.current.firstResponseTimestamp) {
      timingDetails.current.firstResponseTimestamp = stamp;
      timingDetails.current.firstResponseDuration = stamp - startTime;
    }
    timingDetails.current.timestamps?.push(stamp);
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: used for debugging
    console.error('Error updating timing details', error);
  }
}

function resetTimingDetails(timingDetails: RefObject<TimingDetails>) {
  timingDetails.current = {
    startTime: performance.now(),
    numberOfResponses: 0,
    timestamps: [],
  };
}

function printTimingDetails(timingDetails: TimingDetails) {
  // biome-ignore lint/suspicious/noConsole: console.table is used for debugging
  console.table({
    startTime: timingDetails.startTime,
    firstResponseTimestamp: timingDetails.firstResponseTimestamp,
    lastResponseTimestamp: timingDetails.lastResponseTimestamp,

    firstResponseDuration: timingDetails.firstResponseDuration,
    totalResponseDuration: timingDetails.totalResponseDuration,
    ...Object.fromEntries(
      dropLast(
        1,
        timingDetails.timestamps
          .map(
            (timestamp: number) => timestamp - (timingDetails.startTime ?? 0),
          )
          .filter((duration) => duration > 100)
          .reduce((acc: number[], curr: number) => {
            if (acc.length === 0) {
              acc.push(curr);
              return acc;
            }
            if (curr - (acc.at(-1) ?? 0) > 100) {
              acc.push(curr);
            }
            return acc;
          }, [])
          .reduce((acc: number[], curr: number) => {
            if (acc.length === 0) {
              acc.push(curr);
              return acc;
            }
            acc.push(curr - (acc.at(-1) ?? 0));
            return acc;
          }, [] as number[]),
      ).map((duration, index) => [`response_${index + 1}_duration`, duration]),
    ),
  });
}

interface TimingDetails {
  startTime?: number | null;
  numberOfResponses: number;
  timestamps: number[];
  firstResponseTimestamp?: number | null;
  firstResponseDuration?: number | null;
  lastResponseTimestamp?: number | null;
  totalResponseDuration?: number | null;
}
