import type { PropsWithChildren } from 'react';
import { OriginProvider } from './origin';
import { ThemeProvider } from './theme';
import { getOriginRuntime } from '@/lib/origin';

export const Providers = async ({ children }: PropsWithChildren) => {
  const originInfo = await getOriginRuntime();
  return (
    <OriginProvider originInfo={originInfo}>
      <ThemeProvider>{children}</ThemeProvider>
    </OriginProvider>
  );
};
