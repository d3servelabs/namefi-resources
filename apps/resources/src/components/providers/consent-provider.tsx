'use client';

import { ConsentManagerProvider } from '@c15t/nextjs';
import dynamic from 'next/dynamic';
import type { PropsWithChildren } from 'react';
import { GoogleAnalyticsCookieConsentGated } from '@/components/ga';
import { C15T_BROWSER_BACKEND_URL } from '@/lib/c15t';
import { ConsentManagerClient } from './consent-manager-client';

// The consent banner/dialog UI (and its ~64KB stylesheet) is loaded lazily and
// client-only so it never blocks the article's first paint. The provider below
// still wraps the tree synchronously, so consent context/state is unaffected.
const ConsentUI = dynamic(
  () => import('./consent-ui').then((m) => m.ConsentUI),
  { ssr: false },
);

const c15tTheme = {
  consentActions: {
    accept: { variant: 'primary', mode: 'filled' },
    reject: { variant: 'neutral', mode: 'ghost' },
    customize: { variant: 'neutral', mode: 'ghost' },
  },
  slots: {
    consentBannerFooterSubGroup: 'order-1 sm:order-2 sm:ml-auto',
    consentWidgetFooterSubGroup: 'sm:ml-auto',
    buttonPrimary:
      '!bg-brand-primary !text-primary-foreground hover:!bg-brand-primary/90 !shadow-none',
    buttonSecondary: 'c15t-customize-like-reject',
  },
} as const;

export function ConsentProvider({ children }: PropsWithChildren) {
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
        {children}
      </ConsentManagerClient>
    </ConsentManagerProvider>
  );
}
