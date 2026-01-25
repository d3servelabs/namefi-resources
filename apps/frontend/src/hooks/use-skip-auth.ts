'use client';

import { config } from '@/lib/env';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';

const SKIP_AUTH_STORAGE_KEY = 'namefi-skip-auth';
const SKIP_AUTH_URL_PARAM = 'skip_auth';

export const SKIP_AUTH_MOCK_USER = {
  email: 'tester+alice@d3serve.xyz',
  id: 'skip-auth-mock-user-id',
  privyUserId: 'skip-auth-mock-privy-user-id',
} as const;

function isDevEnvironment(): boolean {
  const isDev =
    config.TYPE === 'local' ||
    config.TYPE === 'development' ||
    config.TYPE === 'preview';
  if (typeof window !== 'undefined') {
    console.log(
      '[skip-auth] Environment check:',
      `config.TYPE="${config.TYPE}"`,
      `isDevEnvironment=${isDev}`,
    );
  }
  return isDev;
}

function getSkipAuthFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SKIP_AUTH_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function setSkipAuthInStorage(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      window.localStorage.setItem(SKIP_AUTH_STORAGE_KEY, '1');
    } else {
      window.localStorage.removeItem(SKIP_AUTH_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function useSkipAuth() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isSkipAuthActive, setIsSkipAuthActive] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  useEffect(() => {
    const isDev = isDevEnvironment();
    console.log('[skip-auth] useEffect triggered:', {
      isDev,
      pathname,
      searchParamsString: searchParams.toString(),
    });

    if (!isDev) {
      console.log('[skip-auth] Not in dev environment, disabling skip auth');
      setIsSkipAuthActive(false);
      return;
    }

    const urlParam = searchParams.get(SKIP_AUTH_URL_PARAM);
    console.log('[skip-auth] URL param value:', urlParam);

    if (urlParam === '1') {
      console.log('[skip-auth] Activating skip auth from URL param');
      setSkipAuthInStorage(true);
      setIsSkipAuthActive(true);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete(SKIP_AUTH_URL_PARAM);
      const newUrl = newParams.toString()
        ? `${pathname}?${newParams.toString()}`
        : pathname;
      console.log('[skip-auth] Redirecting to:', newUrl);
      router.replace(newUrl);
    } else if (urlParam === '0') {
      console.log('[skip-auth] Deactivating skip auth from URL param');
      setSkipAuthInStorage(false);
      setIsSkipAuthActive(false);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete(SKIP_AUTH_URL_PARAM);
      const newUrl = newParams.toString()
        ? `${pathname}?${newParams.toString()}`
        : pathname;
      console.log('[skip-auth] Redirecting to:', newUrl);
      router.replace(newUrl);
    } else {
      const storedValue = getSkipAuthFromStorage();
      console.log('[skip-auth] No URL param, checking storage:', storedValue);
      setIsSkipAuthActive(storedValue);
    }
  }, [searchParams, router, pathname]);

  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      setIsBannerDismissed(false);
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
  }, []);

  const disableSkipAuth = useCallback(() => {
    setSkipAuthInStorage(false);
    setIsSkipAuthActive(false);
  }, []);

  return {
    isSkipAuthActive: isDevEnvironment() && isSkipAuthActive,
    isBannerDismissed,
    dismissBanner,
    disableSkipAuth,
    mockUser: SKIP_AUTH_MOCK_USER,
    isDevEnvironment: isDevEnvironment(),
  };
}
