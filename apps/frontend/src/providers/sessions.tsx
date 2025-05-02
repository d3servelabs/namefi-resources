'use client';

import { useOrigin } from '@/components/providers/originProvider';
import { config } from '@/lib/env';
import {
  type PrivyProviderProps,
  PrivyProvider as _PrivyProvider,
} from '@privy-io/react-auth';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';
import type React from 'react';

type Props = { children: ReactNode };

// TODO: This is temporary until we have a proper type from Privy
const PrivyProvider = _PrivyProvider as unknown as React.FC<PrivyProviderProps>;

export const SessionsProvider = ({ children }: Readonly<Props>) => {
  const theme = useTheme();
  const origin = useOrigin();

  return (
    <PrivyProvider
      appId={config.PRIVY_APP_ID}
      config={{
        appearance: {
          theme: theme.theme as 'light' | 'dark',
          accentColor: '#48E59B',
          logo: origin.originInfo?.config?.authLogo?.image ?? '/logotype.svg',
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
