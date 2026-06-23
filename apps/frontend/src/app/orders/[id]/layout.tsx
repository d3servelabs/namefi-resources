import type { PropsWithChildren } from 'react';
import { WagmiProvider } from '@/components/providers/wagmi';

export default function OrderDetailLayout({ children }: PropsWithChildren) {
  return <WagmiProvider>{children}</WagmiProvider>;
}
