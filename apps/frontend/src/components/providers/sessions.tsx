'use client';

import { useOrigin } from '@/components/providers/origin';
import { config } from '@/lib/env';
import { PrivyProvider } from '@privy-io/react-auth';
import { useEffect, useState, type FC, type PropsWithChildren } from 'react';
import { toHex } from '@/lib/color';

export const SessionsProvider: FC<PropsWithChildren> = ({ children }) => {
  const origin = useOrigin();
  const [brandPrimary, setBrandPrimary] = useState<string>('#1cd17d');

  useEffect(() => {
    // Only access document on the client side
    const styles = getComputedStyle(document.documentElement);
    const primaryColor = styles.getPropertyValue('--color-brand-primary');
    if (primaryColor) {
      setBrandPrimary(primaryColor);
    }
  }, []);

  return (
    <PrivyProvider
      appId={config.PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: toHex(brandPrimary) as `#${string}`,
          logo: (
            <img
              src={origin.config?.authLogo?.image ?? '/logotype.svg'}
              alt={origin.config?.logo.alt}
              width={180}
            />
          ),
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
