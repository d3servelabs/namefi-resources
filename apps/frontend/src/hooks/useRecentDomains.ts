import { LocalStorageKeys } from '@/utils/localStorageKeys';
import { useTRPC } from '@/utils/trpc';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';

export function useRecentDomains({
  newlyVisitedDomain,
}: {
  newlyVisitedDomain?: string;
} = {}) {
  const trpc = useTRPC();
  const { data: currentUserDomains } = useSuspenseQuery(
    trpc.users.getCurrentUserDomains.queryOptions(),
  );

  const [_recentDomains, setRecentDomains] = useLocalStorage(
    LocalStorageKeys.RECENT_DOMAINS,
    [newlyVisitedDomain] as string[],
  );

  useEffect(() => {
    if (newlyVisitedDomain) {
      setRecentDomains((prevRecentDomains) => {
        const filtered = prevRecentDomains.filter(
          (recentDomain) =>
            recentDomain !== '' && recentDomain !== newlyVisitedDomain,
        );
        return [...filtered, newlyVisitedDomain].filter((recentDomain) =>
          currentUserDomains.some(
            (d) => d.normalizedDomainName === recentDomain,
          ),
        );
      });
    }
  }, [newlyVisitedDomain, currentUserDomains, setRecentDomains]);

  const recentDomains = useMemo(() => {
    return _recentDomains.filter((domain) => {
      return currentUserDomains.some((d) => d.normalizedDomainName === domain);
    });
  }, [_recentDomains, currentUserDomains]);

  return {
    recentDomains,
    setRecentDomains,
  };
}
