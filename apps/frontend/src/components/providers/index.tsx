import { getOriginRuntime } from '@/lib/origin/utils.server';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { OriginProvider } from '@/components/providers/origin';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { PropsWithChildren, FC } from 'react';
import { CartProvider } from './cart';
import { ConsentProvider } from './consent-provider';
import { ProgressProvider } from './progress';
import { ThemeProvider } from './theme';
import { TrpcProvider } from './trpc';
import { WishlistProvider } from './wishlist';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { DeferredProviders } from './deferred-providers';
import { AuthProvider } from './auth';
import { cookies, headers } from 'next/headers';
import { getInitialAuthSessionSnapshot } from '@/lib/trpc/server';
import { serializeInitialAuthSessionSnapshot } from './auth-initial-snapshot';

export const Providers: FC<PropsWithChildren> = async ({ children }) => {
  const originInfo = await getOriginRuntime();
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const initialCookieSnapshot = {
    hasPrivyToken: cookieStore.has('privy-token'),
    hasPrivySession: cookieStore.has('privy-session'),
  };
  const hasServerReadableToken = initialCookieSnapshot.hasPrivyToken;
  const initialAuthSessionSnapshot = serializeInitialAuthSessionSnapshot(
    await getInitialAuthSessionSnapshot({
      cookieHeader: headerStore.get('cookie'),
      hasServerReadableToken,
    }),
  );

  return (
    <OriginProvider originInfo={originInfo}>
      <ThemeProvider>
        <TrpcProvider>
          <NuqsAdapter>
            <ProgressProvider>
              <ConsentProvider>
                <PreAuthSignalsProvider>
                  <AuthProvider
                    initialCookieSnapshot={initialCookieSnapshot}
                    initialAuthSessionSnapshot={initialAuthSessionSnapshot}
                  >
                    <InteractionLoggersProvider>
                      <WishlistProvider>
                        <CartProvider>
                          <DeferredProviders>{children}</DeferredProviders>
                        </CartProvider>
                      </WishlistProvider>
                    </InteractionLoggersProvider>
                  </AuthProvider>
                </PreAuthSignalsProvider>
              </ConsentProvider>
            </ProgressProvider>
          </NuqsAdapter>
        </TrpcProvider>
      </ThemeProvider>
    </OriginProvider>
  );
};
