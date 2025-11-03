import type { PropsWithChildren } from 'react';
import { CookieConsentProvider } from './cookie-consent';
import { GoogleAnalyticsCookieConsentGated } from '@/components/ga';

export function Providers({ children }: PropsWithChildren) {
  return (
    <CookieConsentProvider>
      <GoogleAnalyticsCookieConsentGated />
      {children}
    </CookieConsentProvider>
  );
}
