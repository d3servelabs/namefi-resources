'use client';

import { config } from '@/lib/env';
import { PrivyProvider } from '@privy-io/react-auth';
import type { ReactNode } from 'react';

type Props = { children: ReactNode };

export const SessionsProvider = ({ children }: Readonly<Props>) => {
  return (
    <PrivyProvider
      appId={config.PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
          logo: 'https://your-logo-url',
        },
        embeddedWallets: {
          createOnLogin: 'off',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
};
