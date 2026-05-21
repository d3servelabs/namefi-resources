'use client';

import {
  ConsentBanner,
  ConsentDialog,
  ConsentManagerProvider,
} from '@c15t/nextjs';
import type { PropsWithChildren } from 'react';
import { GoogleAnalyticsCookieConsentGated } from '@/components/ga';
import { C15T_BROWSER_BACKEND_URL } from '@/lib/c15t';
import { ConsentManagerClient } from './consent-manager-client';

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
        <ConsentBanner
          layout={['customize', ['reject', 'accept']]}
          primaryButton="accept"
        />
        <ConsentDialog />
        <GoogleAnalyticsCookieConsentGated />
        {children}
      </ConsentManagerClient>
    </ConsentManagerProvider>
  );
}
