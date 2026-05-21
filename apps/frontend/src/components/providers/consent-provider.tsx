'use client';

import { ConsentManagerProvider } from '@c15t/nextjs';
import type { PropsWithChildren } from 'react';
import { ConsentManagerClient } from '@/components/providers/consent-manager-client';
import { ConsentUIComponents } from './consent-ui-lazy';

const C15T_BROWSER_BACKEND_URL = '/api/c15t';
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
        <ConsentUIComponents />
        {children}
      </ConsentManagerClient>
    </ConsentManagerProvider>
  );
}
