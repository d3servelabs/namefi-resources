'use client';

import { ConsentManagerProvider, useConsentManager } from '@c15t/nextjs';
import { useEffect } from 'react';
import { GoogleAnalyticsCookieConsentGated } from '@/components/ga';
import { PostHogCookieConsentGated } from '@/components/posthog-consent';
import { C15T_BROWSER_BACKEND_URL } from '@/lib/c15t';
import { ConsentManagerClient } from './consent-manager-client';
import { ConsentUI } from './consent-ui';
import { OPEN_COOKIE_SETTINGS_EVENT } from './cookie-consent-event';

const c15tTheme = {
  consentActions: {
    accept: { variant: 'primary', mode: 'filled' },
    reject: { variant: 'neutral', mode: 'ghost' },
    customize: { variant: 'neutral', mode: 'ghost' },
  },
  slots: {
    consentBanner: {
      style: {
        left: 'auto',
        right: 0,
      },
    },
    consentBannerFooterSubGroup: 'order-1 sm:order-2 sm:ml-auto',
    consentWidgetFooterSubGroup: 'sm:ml-auto',
    buttonPrimary:
      '!bg-brand-primary !text-primary-foreground hover:!bg-brand-primary/90 !shadow-none',
    buttonSecondary: 'c15t-customize-like-reject',
  },
} as const;

// Bridges the footer's "Cookie Settings" button (a plain button that dispatches
// a window event, with no c15t import) to the consent dialog. Lives inside the
// provider so it has access to the c15t context.
function CookieSettingsListener() {
  const { setActiveUI } = useConsentManager();
  useEffect(() => {
    const handler = () => setActiveUI('dialog', { force: true });
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, handler);
    return () =>
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, handler);
  }, [setActiveUI]);
  return null;
}

// The consent runtime, mounted as a deferred, client-only island (see
// consent-island.tsx). It intentionally does NOT wrap the app's children — only
// the consent consumers (banner/dialog, GA gate, cookie-settings bridge) — so
// the ~40-50KB c15t + zustand runtime stays out of the initial bundle and off
// the article's first-paint critical path.
export function ConsentIslandInner() {
  return (
    <ConsentManagerProvider
      options={{
        mode: 'hosted',
        backendURL: C15T_BROWSER_BACKEND_URL,
        consentCategories: ['necessary', 'measurement'],
        theme: c15tTheme,
      }}
    >
      <ConsentManagerClient>
        <ConsentUI />
        <GoogleAnalyticsCookieConsentGated />
        <PostHogCookieConsentGated />
        <CookieSettingsListener />
      </ConsentManagerClient>
    </ConsentManagerProvider>
  );
}
