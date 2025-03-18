'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import type { ReactNode } from 'react';

type Props = { children: ReactNode };

export const SessionsProvider = ({ children }: Readonly<Props>) => {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      config={{
        loginMethods: [
          'email',
          'wallet',
          'google',
          'twitter',
          'github',
          'discord',
        ],
        appearance: {
          theme: 'light',
          accentColor: '#7C3AED',
          logo: '/logo.svg',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
};
