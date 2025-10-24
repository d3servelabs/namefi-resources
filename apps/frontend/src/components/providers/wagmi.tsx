'use client';

import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi';
import type { PropsWithChildren } from 'react';
import { getWagmiConfig } from '@/lib/wagmi-config';

const config = getWagmiConfig();

export function WagmiProvider({ children }: PropsWithChildren) {
  return <PrivyWagmiProvider config={config}>{children}</PrivyWagmiProvider>;
}
