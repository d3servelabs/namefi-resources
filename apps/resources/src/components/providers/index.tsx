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
          trackingBlockerConfig: {
            disableAutomaticBlocking: true,
          },
          react: {
            theme: {
              'banner.footer.sub-group': 'order-1 sm:order-2 sm:ml-auto',
              'banner.footer.customize-button':
                'order-2 sm:order-1 c15t-customize-like-reject',
              'banner.footer.accept-button':
                '!bg-brand-primary !text-primary-foreground hover:!bg-brand-primary/90 !shadow-none',
              'widget.footer.accept-button':
                '!bg-brand-primary !text-primary-foreground hover:!bg-brand-primary/90 !shadow-none',
              'widget.footer.save-button': 'c15t-customize-like-reject',
            },
          },
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
