'use client';

import { Loading } from '@/components/Loading';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { type ReactNode, Suspense } from 'react';
import { ArtifactsProvider } from './artifacts';
import { ProgressProvider } from './progress';
import { SessionsProvider } from './sessions';
import { ThemeProvider } from './theme';
import { TrpcProvider } from './trpc';

type Props = { children: ReactNode };

export const Providers = ({ children }: Readonly<Props>) => {
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
                <ArtifactsProvider>{children}</ArtifactsProvider>
              </ProgressProvider>
            </NuqsAdapter>
          </TrpcProvider>
        </SessionsProvider>
      </ThemeProvider>
    </Suspense>
  );
};
