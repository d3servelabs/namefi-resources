'use client';

import { useOrigin } from '@/components/providers/origin';
import { config } from '@/lib/env';
import { shouldBypassImageOptimization } from '@/lib/image-src';
import { PrivyProvider } from '@privy-io/react-auth';
import { useEffect, useState, type FC, type PropsWithChildren } from 'react';
import { toHex } from '@/lib/color';
import Image from 'next/image';

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

  const logoSrc = origin.config?.pbnLogo?.image ?? '/logotype.svg';
  const logoAlt = origin.config?.logo.alt ?? 'Namefi';

  return (
    <PrivyProvider
      appId={config.PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: toHex(brandPrimary) as `#${string}`,
          logo: (
            <span className="relative block h-10 w-[180px]">
              <Image
                src={logoSrc}
                alt={logoAlt}
                fill
                sizes="180px"
                className="object-contain"
                unoptimized={shouldBypassImageOptimization(logoSrc)}
              />
            </span>
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
