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
    consentBanner: {
      style: {
        left: 'auto',
        right: 0,
      },
    },
    consentBannerFooterSubGroup: 'order-1 sm:order-2 sm:ms-auto',
    consentWidgetFooterSubGroup: 'sm:ms-auto',
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
        // Relabel the reject button to "Essential Only": it already performs
        // the same action (reject all non-essential cookies; strictly-necessary
        // always stay), and "Essential Only" reads more clearly than the
        // default "Reject All". The label is jurisdiction-agnostic — it conveys
        // rejection of non-essential cookies, which satisfies both GDPR
        // ("reject" parity with accept) and CCPA opt-out. Deep-merged, so every
        // other string keeps the c15t default. Only the English copy is
        // overridden; other languages keep their own translations.
        translations: {
          translations: {
            en: {
              common: { rejectAll: 'Essential Only' },
            },
          },
        },
      }}
    >
      <ConsentManagerClient>
        <ConsentUIComponents />
        {children}
      </ConsentManagerClient>
    </ConsentManagerProvider>
  );
}
