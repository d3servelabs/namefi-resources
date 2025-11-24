import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  type RefObject,
} from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { useQuery } from '@tanstack/react-query';
import { useSubscription } from '@trpc/tanstack-react-query';
import { useTRPC } from '@/lib/trpc';
import type { DomainAvailabilityInfo } from '@namefi-astra/backend/trpc/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
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
  const {
    error: suggestionError,
    data: suggestionData,
    isFetching: suggestionIsFetching,
    isSuccess: suggestionIsSuccess,
    isError: suggestionIsError,
    refetch: refetchSuggestions,
  } = useQuery({
    ...trpc.search.getDomainSuggestions.queryOptions(
      {
        query: sanitized.toLowerCase(),
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

  const [_domainInfo, setDomainInfo] = useState<
    Map<NamefiNormalizedDomain, DomainAvailabilityInfo>
  >(new Map());

  const { data: preliminaryDomainAvailability } = useQuery({
    queryKey: ['preliminaryDomainAvailability', domains],
    queryFn: () => getPreliminaryDomainAvailability(domains),
    enabled: domains.length > 0,
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset infoMap when domains change
  useEffect(() => {
    setDomainInfo(new Map());
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
    freeClaimEligibility,
    refetchFreeClaimEligibility,
  } as const;
};

function resolveNsDOH(domain: NamefiNormalizedDomain) {
  return fetch(`https://dns.google/resolve?name=${domain}&type=NS`)
    .then((res) => res.json())
    .then((data) => data.Answer.map((answer: any) => answer.data))
    .then((ns) => ns.map((ns: string) => ns.trim()))
    .catch((error) => {
      // biome-ignore lint/suspicious/noConsole: used for debugging
      console.error('Error resolving NS for', domain, error);
      return [];
    });
}

const getPreliminaryDomainAvailability = async (
  _domains: NamefiNormalizedDomain[],
): Promise<DomainAvailabilityInfo[]> => {
  const domains = _domains.filter((domain) => domain.split('.').length === 2); //todo use actual public suffix list

  return Promise.all(
    domains.map(async (domain) => {
      const [_error, nameservers] = await resolve(resolveNsDOH(domain));
      const availability = isNil(nameservers) || isEmpty(nameservers);
      return {
        domain,
        availability,
        pricingDetails: undefined,
        currentOwner: undefined,
        durationValidationInYears: { min: 1, max: 1 },
        importable: !availability,
        registrarKey: 'preliminary',
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
