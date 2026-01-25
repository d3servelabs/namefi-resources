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
  return config.TYPE === 'local' || config.TYPE === 'development';
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
    if (!isDevEnvironment()) {
      setIsSkipAuthActive(false);
      return;
    }

    const urlParam = searchParams.get(SKIP_AUTH_URL_PARAM);

    if (urlParam === '1') {
      setSkipAuthInStorage(true);
      setIsSkipAuthActive(true);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete(SKIP_AUTH_URL_PARAM);
      const newUrl = newParams.toString()
        ? `${pathname}?${newParams.toString()}`
        : pathname;
      router.replace(newUrl);
    } else if (urlParam === '0') {
      setSkipAuthInStorage(false);
      setIsSkipAuthActive(false);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete(SKIP_AUTH_URL_PARAM);
      const newUrl = newParams.toString()
        ? `${pathname}?${newParams.toString()}`
        : pathname;
      router.replace(newUrl);
    } else {
      setIsSkipAuthActive(getSkipAuthFromStorage());
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
