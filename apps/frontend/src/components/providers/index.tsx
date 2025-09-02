'use client';

import { Loading } from '@/components/loading';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { OriginProvider } from '@/components/providers/origin';
import { getWagmiConfig } from '@/lib/wagmi-config';
import { WagmiProvider } from '@privy-io/wagmi';
import { CookieConsentProvider } from '@/components/providers/cookie-consent';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { type PropsWithChildren, type FC, Suspense, useState } from 'react';
import { CartProvider } from './cart';
import { ProgressProvider } from './progress';
import { SessionsProvider } from './sessions';
import { ThemeProvider } from './theme';
import { TrpcProvider } from './trpc';
import { WishlistProvider } from './wishlist';
import { FreeMintsGuidanceProvider } from './free-mints-guidance';
import type { OriginRuntime } from '@/lib/origin';

export const Providers: FC<
  PropsWithChildren<{
    originInfo: OriginRuntime;
  }>
> = ({ children, originInfo }) => {
  const [config] = useState(() => getWagmiConfig());
  const [queryClient] = useState(() => new QueryClient());

  return (
    <Suspense fallback={<Loading fullscreen={true} />}>
      <ThemeProvider
        storageKey="theme"
        attribute="data-theme"
        enableSystem={false}
        disableTransitionOnChange={true}
        defaultTheme={originInfo.thirdPartyHostname ?? 'astra'}
        themes={[
          'astra',
          '0x.city',
          'taylor.cv',
          'ali.cv',
          'li.cv',
          'muller.cv',
          'kumar.cv',
          'starts.today',
          'ends.today',
          'promos.today',
          'available.today',
          'discounts.today',
        ]}
      >
        <OriginProvider originInfo={originInfo}>
          <SessionsProvider>
            <TrpcProvider>
              <NuqsAdapter>
                <ProgressProvider>
                  <QueryClientProvider client={queryClient}>
                    <WagmiProvider config={config}>
                      <CookieConsentProvider>
                        <InteractionLoggersProvider>
                          <WishlistProvider>
                            <CartProvider>
                              <FreeMintsGuidanceProvider>
                                {children}
                              </FreeMintsGuidanceProvider>
                            </CartProvider>
                          </WishlistProvider>
                        </InteractionLoggersProvider>
                      </CookieConsentProvider>
                    </WagmiProvider>
                  </QueryClientProvider>
                </ProgressProvider>
              </NuqsAdapter>
            </TrpcProvider>
          </SessionsProvider>
        </OriginProvider>
      </ThemeProvider>
    </Suspense>
  );
};
