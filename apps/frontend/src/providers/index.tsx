'use client';

import { Loading } from '@/components/loading';
import { config } from '@/lib/env';
import { getWagmiConfig } from '@/lib/wagmiConfig';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { type ReactNode, Suspense, useState } from 'react';
import ReactGA from 'react-ga4';
import { ArtifactsProvider } from './artifacts';
import { ProgressProvider } from './progress';
import { SessionsProvider } from './sessions';
import { ThemeProvider } from './theme';
import { TrpcProvider } from './trpc';

ReactGA.initialize(config.GA_MEASUREMENT_ID);

type Props = { children: ReactNode };

export const Providers = ({ children }: Readonly<Props>) => {
  const [config] = useState(() => getWagmiConfig());
  const [queryClient] = useState(() => new QueryClient());

  return (
    <Suspense fallback={<Loading />}>
      <ThemeProvider
        storageKey="theme"
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange={true}
      >
        <SessionsProvider>
          <TrpcProvider>
            <NuqsAdapter>
              <ProgressProvider>
                <ArtifactsProvider>
                  <QueryClientProvider client={queryClient}>
                    <WagmiProvider config={config}>{children}</WagmiProvider>
                  </QueryClientProvider>
                </ArtifactsProvider>
              </ProgressProvider>
            </NuqsAdapter>
          </TrpcProvider>
        </SessionsProvider>
      </ThemeProvider>
    </Suspense>
  );
};
