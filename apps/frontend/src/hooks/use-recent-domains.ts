import { LocalStorageKeys } from '@/utils/localStorageKeys';
import { useEffect, useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { useAuth } from './use-auth';

export function useRecentDomains({
  newlyVisitedDomain,
}: {
  newlyVisitedDomain?: string;
} = {}) {
  const { isAuthenticated, user } = useAuth();

  const [_recentDomains, _setRecentDomains] = useLocalStorage<
    Record<string, string[]>
  >(LocalStorageKeys.RECENT_DOMAINS, {});

  useEffect(() => {
    if (newlyVisitedDomain && isAuthenticated && user) {
      _setRecentDomains((prevRecentDomains) => {
        const currentRecentDomains = prevRecentDomains[user.id] ?? [];
        const filtered = currentRecentDomains.filter(
          (recentDomain) =>
            recentDomain !== '' && recentDomain !== newlyVisitedDomain,
        );
        return {
          ...prevRecentDomains,
          [user.id]: [...filtered, newlyVisitedDomain],
        };
      });
    }
  }, [newlyVisitedDomain, _setRecentDomains, isAuthenticated, user]);

  const recentDomains = useMemo(() => {
    if (!user) {
      return [];
    }
    return _recentDomains[user.id] ?? [];
  }, [_recentDomains, user]);

  return {
    recentDomains,
    setRecentDomains: (recentDomains: string[]) => {
      _setRecentDomains((prevRecentDomains) => {
        if (!user) {
          return prevRecentDomains;
        }
        return { ...prevRecentDomains, [user.id]: recentDomains };
      });
    },
  };
}
