'use client';

import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CookieConsent } from '@/components/cookie-consent';
import { AnimatePresence } from 'motion/react';

export type ConsentState = 'accepted' | 'declined' | 'unknown';

const COOKIE_NAME = 'cookie-consent';

export interface CookieConsentContextValue {
  consent: ConsentState;
  openConsent: () => void;
  accept: () => void;
  decline: () => void;
}

const CookieConsentContext = createContext<
  CookieConsentContextValue | undefined
>(undefined);

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const cookies = document.cookie ? document.cookie.split(';') : [];
  for (const raw of cookies) {
    const [key, ...rest] = raw.trim().split('=');
    if (decodeURIComponent(key) === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return undefined;
}

function setCookie(
  name: string,
  value: string,
  { maxAgeDays = 365 }: { maxAgeDays?: number } = {},
): void {
  const maxAge = Math.floor(maxAgeDays * 24 * 60 * 60);
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    'path=/',
    `Max-Age=${maxAge}`,
    'SameSite=Lax',
  ];
  // biome-ignore lint: using document.cookie as a fallback for browsers without Cookie Store API
  document.cookie = parts.join('; ');
}

export function CookieConsentProvider({ children }: PropsWithChildren) {
  const [consent, setConsent] = useState<ConsentState>('unknown');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = getCookie(COOKIE_NAME);
    if (existing === 'accepted' || existing === 'declined') {
      setConsent(existing);
      setVisible(false);
    } else {
      setConsent('unknown');
      setVisible(true);
    }
  }, []);

  const accept = useCallback(() => {
    // Prefer Cookie Store API when available
    const cookieStore =
      (typeof window !== 'undefined' && (window as any).cookieStore) ||
      undefined;
    if (cookieStore?.set) {
      void cookieStore.set({
        name: COOKIE_NAME,
        value: 'accepted',
        path: '/',
        sameSite: 'lax',
      });
    } else {
      setCookie(COOKIE_NAME, 'accepted', { maxAgeDays: 3650 });
    }
    setConsent('accepted');
    setVisible(false);
  }, []);

  const decline = useCallback(() => {
    const cookieStore =
      (typeof window !== 'undefined' && (window as any).cookieStore) ||
      undefined;
    if (cookieStore?.set) {
      void cookieStore.set({
        name: COOKIE_NAME,
        value: 'declined',
        path: '/',
        sameSite: 'lax',
      });
    } else {
      setCookie(COOKIE_NAME, 'declined', { maxAgeDays: 365 });
    }
    setConsent('declined');
    setVisible(false);
  }, []);

  const openConsent = useCallback(() => {
    setVisible(true);
  }, []);

  const value = useMemo<CookieConsentContextValue>(
    () => ({ consent, openConsent, accept, decline }),
    [consent, openConsent, accept, decline],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {visible && (
          <CookieConsent
            variant="small"
            onAcceptCallback={accept}
            onDeclineCallback={decline}
          />
        )}
      </AnimatePresence>
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx)
    throw new Error(
      'useCookieConsent must be used within CookieConsentProvider',
    );
  return ctx;
}
