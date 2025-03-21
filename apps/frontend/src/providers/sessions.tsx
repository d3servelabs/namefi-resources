'use client';

import { config } from '@/lib/env';
import { PrivyProvider } from '@privy-io/react-auth';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';

type Props = { children: ReactNode };

export const SessionsProvider = ({ children }: Readonly<Props>) => {
  const theme = useTheme();

  return (
    <PrivyProvider
      appId={config.PRIVY_APP_ID}
      config={{
        appearance: {
          theme: theme.theme as 'light' | 'dark',
          accentColor: '#48E59B',
          logo: '/logotype.svg',
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
