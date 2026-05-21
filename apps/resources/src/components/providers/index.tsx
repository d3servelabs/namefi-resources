import type { PropsWithChildren } from 'react';
import { ConsentProvider } from './consent-provider';
import { ProgressProvider } from './progress';

export function Providers({ children }: PropsWithChildren) {
  return (
    <ProgressProvider>
      <ConsentProvider>{children}</ConsentProvider>
    </ProgressProvider>
  );
}
