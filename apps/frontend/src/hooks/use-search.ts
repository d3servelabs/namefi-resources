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
import type { DomainAvailabilityInfo } from '@namefi-astra/contracts/domain-availability';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { SearchMode } from '@/components/search/types';
import { parseCSVDomains } from '@/components/search/utils';
import { useAuth } from './use-auth';
import { dropLast, isNil, isEmpty } from 'ramda';
import { resolve } from '@namefi-astra/utils/promises/resolve';

declare global {
  interface Window {
    getTimingDetails: () => TimingDetails;
    printTimingDetails: () => void;
  }
}
type TldPricingInfo = AppRouterOutput['registry']['getTldPricingTable'][number];

const RANKED_TLD_PAGE_SIZE = 16;

export const useSearch = (parentDomain?: string) => {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>(SearchMode.REGISTER);
  const [debounced] = useDebounceValue(query, 100);
  const sanitized = debounced.trim();
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
    enabled: suggestionEnabled,
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

  const suggestedDomains = useMemo<NamefiNormalizedDomain[]>(() => {
    if (!suggestionEnabled || searchMode !== SearchMode.REGISTER) {
      return [];
    }
    const pages = suggestionData?.pages ?? [];
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
  }, [suggestionData?.pages, suggestionEnabled, searchMode]);

  const domains = useMemo<NamefiNormalizedDomain[]>(
    () =>
      searchMode === SearchMode.IMPORT
        ? Array.from(importQuery.keys())
        : suggestedDomains,
    [searchMode, importQuery, suggestedDomains],
  );

  const [_domainInfo, setDomainInfo] = useState<
    Map<NamefiNormalizedDomain, DomainAvailabilityInfo>
  >(new Map());

  const tldPricingQuery = useQuery(
    trpc.registry.getTldPricingTable.queryOptions(),
  );
  const { data: preliminaryDomainAvailability } = useQuery({
    queryKey: ['preliminaryDomainAvailability', domains],
    queryFn: () =>
      getPreliminaryDomainAvailability(domains, tldPricingQuery.data || []),
    enabled: domains.length > 0 && !tldPricingQuery.isLoading,
  });

  const domainInfo = useMemo(() => {
    return new Map<NamefiNormalizedDomain, DomainAvailabilityInfo>([
      ...((preliminaryDomainAvailability?.map((domain) => [
        domain.domain,
        domain,
      ]) as [NamefiNormalizedDomain, DomainAvailabilityInfo][]) ?? []),
      ...(_domainInfo?.entries() ?? []),
    ]);
  }, [_domainInfo, preliminaryDomainAvailability]);

  const timingDetails = useRef<TimingDetails>({
    numberOfResponses: 0,
    timestamps: [],
  });
  useEffect(() => {
    setDomainInfo((previous) => {
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
          setDomainInfo((m) => new Map(m).set(info.domain, info));
          punchTimestamp(timingDetails);
        },
        onStarted() {
          resetTimingDetails(timingDetails);
        },
      },
    ),
    enabled: domains.length > 0,
  });

  const runSearch = useCallback(() => {
    if (query.trim().length === 0) return;
    if (searchMode === SearchMode.REGISTER) {
      void refetchSuggestions();
    } else {
      setDomainInfo(new Map());
      resetAvailStatus();
    }
  }, [query, refetchSuggestions, searchMode, resetAvailStatus]);

  const loadMore = useCallback(() => {
    if (!hasNextPage) return;
    void fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  const isAvailabilityStreaming =
    domains.length > 0 &&
    domainInfo.size < domains.length &&
    availStatus !== 'error' &&
    availStatus !== 'idle';

  const isRegisterLoading =
    searchMode === SearchMode.REGISTER &&
    suggestionIsFetching &&
    suggestedDomains.length === 0;

  const isLoading = useMemo(
    () => isRegisterLoading || isAvailabilityStreaming,
    [isAvailabilityStreaming, isRegisterLoading],
  );

  const hasData = domains.length > 0;

  const canLoadMore =
    searchMode === SearchMode.REGISTER && !parentDomain && Boolean(hasNextPage);

  const isLoadingMore =
    searchMode === SearchMode.REGISTER && Boolean(isFetchingNextPage);

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

const getPreliminaryDomainAvailability = async (
  _domains: NamefiNormalizedDomain[],
  tldPricingInfo: TldPricingInfo[],
): Promise<DomainAvailabilityInfo[]> => {
  const priceMap = new Map<string, TldPricingInfo>(
    tldPricingInfo.map((info) => [info.tld, info]),
  );
  const domains = _domains.filter((domain) => domain.split('.').length === 2); //todo use actual public suffix list

  return Promise.all(
    domains.map(async (domain) => {
      const [_error, nameservers] = await resolve(resolveNsDOH(domain));
      const availability = isNil(nameservers) || isEmpty(nameservers);
      const tld = domain.split('.').pop();
      const pricingDetails = tld ? priceMap.get(tld) : undefined;

      return {
        domain,
        availability,
        pricingDetails: {
          importPrice: {
            type: 'PER_YEAR',
            price: {
              amount: pricingDetails?.transferPriceUsdPerYear ?? 0,
              currency: 'USD',
            },
          },
          registrationPrice: {
            type: 'PER_YEAR',
            price: {
              amount: pricingDetails?.registrationPriceUsdPerYear ?? 0,
              currency: 'USD',
            },
          },
          renewalPrice: {
            type: 'PER_YEAR',
            price: {
              amount: pricingDetails?.renewalPriceUsdPerYear ?? 0,
              currency: 'USD',
            },
          },
        },
        currentOwner: undefined,
        durationValidationInYears: { min: 1, max: 1 },
        importable: !availability,
        registrarKey: pricingDetails
          ? pricingDetails.registrarKey
          : 'preliminary',
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
