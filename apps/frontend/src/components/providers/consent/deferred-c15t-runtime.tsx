'use client';

import { ConsentManagerProvider, useConsentManager } from '@c15t/nextjs';
import { useEffect, useRef, type FC } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useConsentIdentify } from '@/hooks/use-consent-identify';
import { ConsentUIComponents } from '../consent-ui-lazy';
import {
  consumePendingConsentOpen,
  NAMEFI_OPEN_CONSENT_EVENT,
  useNamefiConsent,
} from './namefi-consent';

const C15T_BROWSER_BACKEND_URL = '/api/c15t';

const c15tTheme = {
  consentActions: {
    accept: { variant: 'primary', mode: 'filled' },
    reject: { variant: 'neutral', mode: 'ghost' },
    customize: { variant: 'neutral', mode: 'ghost' },
  },
  slots: {
    consentBanner: { style: { left: 'auto', right: 0 } },
    consentBannerFooterSubGroup: 'order-1 sm:order-2 sm:ms-auto',
    consentWidgetFooterSubGroup: 'sm:ms-auto',
    buttonPrimary:
      '!bg-brand-primary !text-primary-foreground hover:!bg-brand-primary/90 !shadow-none',
    buttonSecondary: 'c15t-customize-like-reject',
  },
} as const;

/**
 * Lives inside the real c15t provider AND inside AuthProvider, so it can:
 *  - feed c15t's live consent state up into the lightweight NamefiConsent
 *    context the app reads,
 *  - seed the default `measurement` consent (was ConsentManagerClient),
 *  - run the auth-gated consent-identify (was in AuthProvider),
 *  - open the dialog when the footer dispatches `namefi:open-consent`.
 */
const C15tBridge: FC = () => {
  const {
    consents,
    isLoadingConsentInfo,
    consentCategories,
    hasConsented,
    selectedConsents,
    setSelectedConsent,
    setActiveUI,
  } = useConsentManager();
  const { _setSnapshot } = useNamefiConsent();
  const { authReady, isAuthenticated, user } = useAuth();

  // Mirror c15t's live state into the lightweight context the app reads.
  useEffect(() => {
    _setSnapshot({
      consents: {
        measurement: Boolean(consents.measurement),
        necessary: Boolean(consents.necessary),
      },
      isLoadingConsentInfo,
    });
  }, [
    consents.measurement,
    consents.necessary,
    isLoadingConsentInfo,
    _setSnapshot,
  ]);

  // Seed the default measurement consent ONCE (formerly ConsentManagerClient).
  // One-shot via a ref: `selectedConsents.measurement` is a dep, so without the
  // guard, a user un-checking measurement before saving (while hasConsented() is
  // still false) would re-trigger this effect and immediately re-seed it true,
  // fighting their choice.
  const hasSeededDefault = hasConsented();
  const hasSeededRef = useRef(false);
  useEffect(() => {
    if (hasSeededRef.current) return;
    // Already has a saved decision — nothing to seed, and never seed later.
    if (hasSeededDefault) {
      hasSeededRef.current = true;
      return;
    }
    // Wait until the measurement category is available, then seed exactly once.
    if (!consentCategories.includes('measurement')) return;
    if (!selectedConsents.measurement) setSelectedConsent('measurement', true);
    hasSeededRef.current = true;
  }, [
    hasSeededDefault,
    consentCategories,
    selectedConsents.measurement,
    setSelectedConsent,
  ]);

  // Footer's "Cookie settings" dispatches an event instead of holding the
  // consent context — open the dialog here.
  useEffect(() => {
    const handler = () => setActiveUI('dialog', { force: true });
    window.addEventListener(NAMEFI_OPEN_CONSENT_EVENT, handler);
    // Honor an open requested before this idle runtime mounted — the event would
    // have fired with no listener yet and been dropped.
    if (consumePendingConsentOpen()) handler();
    return () => window.removeEventListener(NAMEFI_OPEN_CONSENT_EVENT, handler);
  }, [setActiveUI]);

  // Auth-gated consent-identify (moved out of AuthProvider so AuthProvider no
  // longer pulls c15t eagerly). `user` here is `userDataForCurrentSubject`.
  useConsentIdentify({
    ready: authReady,
    authenticated: isAuthenticated,
    userId: user?.id,
  });

  return null;
};

export function DeferredC15tRuntime() {
  return (
    <ConsentManagerProvider
      options={{
        mode: 'hosted',
        backendURL: C15T_BROWSER_BACKEND_URL,
        consentCategories: ['necessary', 'measurement'],
        theme: c15tTheme,
        translations: {
          translations: { en: { common: { rejectAll: 'Essential Only' } } },
        },
      }}
    >
      <C15tBridge />
      <ConsentUIComponents />
    </ConsentManagerProvider>
  );
}

export default DeferredC15tRuntime;
