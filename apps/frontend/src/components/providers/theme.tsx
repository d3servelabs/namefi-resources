'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { PropsWithChildren } from 'react';
import { useOrigin } from './origin';
import { POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES } from '@/lib/env/consts';

export function ThemeProvider({ children }: PropsWithChildren) {
  const originInfo = useOrigin();
  return (
    <NextThemesProvider
      storageKey="theme"
      attribute="data-theme"
      enableSystem={false}
      disableTransitionOnChange={true}
      themes={['astra', ...POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES]}
      defaultTheme={
        originInfo.isFirstPartyOrigin
          ? 'astra'
          : (originInfo.config.theme ??
            originInfo.thirdPartyHostname ??
            'fallback-thirdparty')
      }
    >
      {children}
    </NextThemesProvider>
  );
}
