import type { PropsWithChildren } from 'react';
import { ProgressProvider } from './progress';
import {
  ConsentManagerProvider,
  CookieBanner,
  ConsentManagerDialog,
} from '@c15t/nextjs';
import { ConsentManagerClient } from './consent-manager-client';
import { GoogleAnalyticsCookieConsentGated } from '@/components/ga';

export function Providers({ children }: PropsWithChildren) {
  return (
    <ProgressProvider>
      <ConsentManagerProvider
        options={{
          mode: 'offline',
          consentCategories: ['necessary', 'measurement'],
        }}
      >
        <ConsentManagerClient>
          <CookieBanner />
          <ConsentManagerDialog />
          <GoogleAnalyticsCookieConsentGated />
          {children}
        </ConsentManagerClient>
      </ConsentManagerProvider>
    </ProgressProvider>
  );
}
