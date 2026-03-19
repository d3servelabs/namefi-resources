import { getOriginRuntime } from '@/lib/origin/utils.server';
import { config } from '@/lib/env';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { OriginProvider } from '@/components/providers/origin';
import { ConsentManagerProvider } from '@c15t/nextjs';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { PropsWithChildren, FC } from 'react';
import { CartProvider } from './cart';
import { ProgressProvider } from './progress';
import { SessionsProvider } from './privy';
import { ThemeProvider } from './theme';
import { TrpcProvider } from './trpc';
import { WishlistProvider } from './wishlist';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { WagmiProvider } from './wagmi';
import { ConsentManagerClient } from '@/components/providers/consent-manager-client';
import { DeferredProviders } from './deferred-providers';
import { ConsentUIComponents } from './consent-ui-lazy';

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
                          'banner.footer.sub-group':
                            'order-1 sm:order-2 sm:ml-auto',
                          'banner.footer.customize-button':
                            'order-2 sm:order-1 c15t-customize-like-reject',
                          'banner.footer.accept-button':
                            '!bg-brand-primary !text-primary-foreground hover:!bg-brand-primary/90 !shadow-none',
                          'widget.footer.accept-button':
                            '!bg-brand-primary !text-primary-foreground hover:!bg-brand-primary/90 !shadow-none',
                          'widget.footer.save-button':
                            'c15t-customize-like-reject',
                        },
                      },
                    }}
                  >
                    <ConsentManagerClient>
                      <ConsentUIComponents />
                      <PreAuthSignalsProvider>
                        <InteractionLoggersProvider>
                          <WishlistProvider>
                            <CartProvider>
                              <DeferredProviders>{children}</DeferredProviders>
                            </CartProvider>
                          </WishlistProvider>
                        </InteractionLoggersProvider>
                      </PreAuthSignalsProvider>
                    </ConsentManagerClient>
                  </ConsentManagerProvider>
                </WagmiProvider>
              </ProgressProvider>
            </NuqsAdapter>
          </TrpcProvider>
        </SessionsProvider>
      </ThemeProvider>
    </OriginProvider>
  );
};
