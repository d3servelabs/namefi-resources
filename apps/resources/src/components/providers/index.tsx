import type { PropsWithChildren } from 'react';
import { ProgressProvider } from './progress';
import {
  ConsentManagerProvider,
  CookieBanner,
  ConsentManagerDialog,
} from '@c15t/nextjs';
import { ConsentManagerClient } from './consent-manager-client';
import { GoogleAnalyticsCookieConsentGated } from '@/components/ga';
import { config } from '@/lib/env';

export function Providers({ children }: PropsWithChildren) {
  return (
    <ProgressProvider>
      <ConsentManagerProvider
        options={{
          mode: 'c15t',
          backendURL: `${config.BACKEND_URL}/c15t`,
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
