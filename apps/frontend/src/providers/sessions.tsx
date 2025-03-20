'use client';

import { config } from '@/lib/env';
import {
  type PrivyProviderProps,
  PrivyProvider as _PrivyProvider,
} from '@privy-io/react-auth';
import type { ReactNode } from 'react';
import type React from 'react';

type Props = { children: ReactNode };

// TODO: This is temporary until we have a proper type from Privy
const PrivyProvider = _PrivyProvider as unknown as React.FC<PrivyProviderProps>;

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
