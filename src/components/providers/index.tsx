import type { PropsWithChildren } from 'react';
import { GoogleAnalyticsCookieConsentGated } from '@/components/ga';
import { CookieConsentProvider } from './cookie-consent';
import { ProgressProvider } from './progress';

export function Providers({ children }: PropsWithChildren) {
  return (
    <ProgressProvider>
      <CookieConsentProvider>
        <GoogleAnalyticsCookieConsentGated />
        {children}
      </CookieConsentProvider>
    </ProgressProvider>
  );
}
