import { getOriginRuntime } from '@/lib/origin';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { OriginProvider } from '@/components/providers/origin';
import { CookieConsentProvider } from '@/components/providers/cookie-consent';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { PropsWithChildren, FC } from 'react';
import { CartProvider } from './cart';
import { ProgressProvider } from './progress';
import { SessionsProvider } from './privy';
import { ThemeProvider } from './theme';
import { TrpcProvider } from './trpc';
import { WishlistProvider } from './wishlist';
import { FreeMintsGuidanceProvider } from './free-mints-guidance';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { AdminFeatureFlagsProvider } from '@/components/admin/feature-flags/context';
import { WagmiProvider } from './wagmi';
import { FeedbackProvider } from './feedback';

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
                  <CookieConsentProvider>
                    <PreAuthSignalsProvider>
                      <InteractionLoggersProvider>
                        <WishlistProvider>
                          <CartProvider>
                            <AdminFeatureFlagsProvider>
                              <FreeMintsGuidanceProvider>
                                <FeedbackProvider>{children}</FeedbackProvider>
                              </FreeMintsGuidanceProvider>
                            </AdminFeatureFlagsProvider>
                          </CartProvider>
                        </WishlistProvider>
                      </InteractionLoggersProvider>
                    </PreAuthSignalsProvider>
                  </CookieConsentProvider>
                </WagmiProvider>
              </ProgressProvider>
            </NuqsAdapter>
          </TrpcProvider>
        </SessionsProvider>
      </ThemeProvider>
    </OriginProvider>
  );
};
