'use client';

import { config } from '@/lib/env';
import type { Route } from 'next';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useSyncExternalStore,
} from 'react';

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
    // Dispatch a custom event so all hook instances can sync
    window.dispatchEvent(new CustomEvent('skip-auth-change'));
  } catch {
    // Ignore storage errors
  }
}

// Subscribe to storage changes for cross-instance synchronization
function subscribeToSkipAuthChanges(callback: () => void): () => void {
  const handleChange = () => callback();
  window.addEventListener('skip-auth-change', handleChange);
  window.addEventListener('storage', handleChange);
  return () => {
    window.removeEventListener('skip-auth-change', handleChange);
    window.removeEventListener('storage', handleChange);
  };
}

// Server snapshot always returns false
function getServerSnapshot(): boolean {
  return false;
}

export function useSkipAuth() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Cache devEnvironment check to avoid multiple calls
  const devEnvironment = isDevEnvironment();

  // Use useSyncExternalStore for cross-instance state synchronization
  // This ensures all hook instances stay in sync when localStorage changes
  const isSkipAuthActive = useSyncExternalStore(
    subscribeToSkipAuthChanges,
    () => devEnvironment && getSkipAuthFromStorage(),
    getServerSnapshot,
  );

  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  useEffect(() => {
    if (!devEnvironment) {
      return;
    }

    const urlParam = searchParams.get(SKIP_AUTH_URL_PARAM);

    if (urlParam === '1') {
      setSkipAuthInStorage(true);
      // Reset banner dismissed state when re-enabling via URL
      setIsBannerDismissed(false);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete(SKIP_AUTH_URL_PARAM);
      const newUrl = newParams.toString()
        ? `${pathname}?${newParams.toString()}`
        : pathname;
      router.replace(newUrl as Route);
    } else if (urlParam === '0') {
      setSkipAuthInStorage(false);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete(SKIP_AUTH_URL_PARAM);
      const newUrl = newParams.toString()
        ? `${pathname}?${newParams.toString()}`
        : pathname;
      router.replace(newUrl as Route);
    }
  }, [searchParams, router, pathname, devEnvironment]);

  // Reset banner dismissed state on pathname change only (not query params).
  // Query-only navigation (e.g., filters, pagination) intentionally does not
  // reset the banner to avoid annoying users during normal browsing.
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
  }, []);

  return {
    isSkipAuthActive,
    isBannerDismissed,
    dismissBanner,
    disableSkipAuth,
    mockUser: SKIP_AUTH_MOCK_USER,
    isDevEnvironment: devEnvironment,
  };
}
