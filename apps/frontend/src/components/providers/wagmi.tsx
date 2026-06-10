'use client';

import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi';
import type { PropsWithChildren } from 'react';
import { getWagmiConfig } from '@/lib/wagmi-config';

let config: ReturnType<typeof getWagmiConfig> | null = null;

function getConfig() {
  config ??= getWagmiConfig();
  return config;
}

export function WagmiProvider({ children }: PropsWithChildren) {
  return (
    <PrivyWagmiProvider config={getConfig()}>{children}</PrivyWagmiProvider>
  );
}
