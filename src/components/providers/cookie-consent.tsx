'use client';

import Cookies from 'js-cookie';
import { AnimatePresence } from 'motion/react';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CookieConsent } from '@/components/cookie-consent';

export type ConsentState = 'accepted' | 'declined' | 'unknown';

const COOKIE_NAME = 'cookie-consent';
const ACCEPT_MAX_AGE_DAYS = 3650;
const DECLINE_MAX_AGE_DAYS = 365;

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
  if (typeof window === 'undefined') return undefined;
  return Cookies.get(name);
}

function setCookie(
  name: string,
  value: string,
  { maxAgeDays = 365 }: { maxAgeDays?: number } = {},
): void {
  if (typeof window === 'undefined') return;
  Cookies.set(name, value, {
    path: '/',
    sameSite: 'lax',
    expires: maxAgeDays,
    secure: window.location?.protocol === 'https:',
  });
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
    setCookie(COOKIE_NAME, 'accepted', { maxAgeDays: ACCEPT_MAX_AGE_DAYS });
    setConsent('accepted');
    setVisible(false);
  }, []);

  const decline = useCallback(() => {
    setCookie(COOKIE_NAME, 'declined', { maxAgeDays: DECLINE_MAX_AGE_DAYS });
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
