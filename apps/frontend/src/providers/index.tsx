'use client';

import { Loading } from '@/components/loading';
import { InteractionLoggersProvider } from '@/components/providers/interactionLoggersProvider';
import { OriginProvider } from '@/components/providers/originProvider';
import { ThemeProvider as OriginThemeProvider } from '@/components/providers/themeProvider';
import { getWagmiConfig } from '@/lib/wagmiConfig';
import { WagmiProvider } from '@privy-io/wagmi';
import { UsercentricsProvider } from '@s-group/react-usercentrics';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { type ReactNode, Suspense, useState } from 'react';
import { CartProvider } from './cart';
import { ProgressProvider } from './progress';
import { FORCED_THEME, SessionsProvider } from './sessions';
import { ThemeProvider } from './theme';
import { TrpcProvider } from './trpc';
import { WishlistProvider } from './wishlist';

type Props = { children: ReactNode };

export const Providers = ({ children }: Readonly<Props>) => {
  const [config] = useState(() => getWagmiConfig());
  const [queryClient] = useState(() => new QueryClient());

  return (
    <Suspense fallback={<Loading />}>
      <OriginProvider>
        <OriginThemeProvider>
          <ThemeProvider
            storageKey="theme"
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange={true}
            forcedTheme={FORCED_THEME}
          >
            <SessionsProvider>
              <TrpcProvider>
                <NuqsAdapter>
                  <ProgressProvider>
                    <QueryClientProvider client={queryClient}>
                      <WagmiProvider config={config}>
                        <UsercentricsProvider>
                          <InteractionLoggersProvider>
                            <WishlistProvider>
                              <CartProvider>{children}</CartProvider>
                            </WishlistProvider>
                          </InteractionLoggersProvider>
                        </UsercentricsProvider>
                      </WagmiProvider>
                    </QueryClientProvider>
                  </ProgressProvider>
                </NuqsAdapter>
              </TrpcProvider>
            </SessionsProvider>
          </ThemeProvider>
        </OriginThemeProvider>
      </OriginProvider>
    </Suspense>
  );
};
