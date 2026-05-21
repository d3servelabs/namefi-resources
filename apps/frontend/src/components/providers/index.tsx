import { getOriginRuntime } from '@/lib/origin/utils.server';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { OriginProvider } from '@/components/providers/origin';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { PropsWithChildren, FC } from 'react';
import { CartProvider } from './cart';
import { ConsentProvider } from './consent-provider';
import { ProgressProvider } from './progress';
import { SessionsProvider } from './privy';
import { ThemeProvider } from './theme';
import { TrpcProvider } from './trpc';
import { WishlistProvider } from './wishlist';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { WagmiProvider } from './wagmi';
import { DeferredProviders } from './deferred-providers';

export const Providers: FC<PropsWithChildren> = async ({ children }) => {
  const originInfo = await getOriginRuntime();
  return (
    <OriginProvider originInfo={originInfo}>
      <ThemeProvider>
        <SessionsProvider>
          <TrpcProvider>
            <NuqsAdapter>
              <ProgressProvider>
                <WagmiProvider>
                  <ConsentProvider>
                    <PreAuthSignalsProvider>
                      <InteractionLoggersProvider>
                        <WishlistProvider>
                          <CartProvider>
                            <DeferredProviders>{children}</DeferredProviders>
                          </CartProvider>
                        </WishlistProvider>
                      </InteractionLoggersProvider>
                    </PreAuthSignalsProvider>
                  </ConsentProvider>
                </WagmiProvider>
              </ProgressProvider>
            </NuqsAdapter>
          </TrpcProvider>
        </SessionsProvider>
      </ThemeProvider>
    </OriginProvider>
  );
};
