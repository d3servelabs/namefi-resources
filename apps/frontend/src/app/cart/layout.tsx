import type { PropsWithChildren } from 'react';
import { NO_INDEX_METADATA } from '@/lib/seo/noindex';
import { WagmiProvider } from '@/components/providers/wagmi';

export const metadata = NO_INDEX_METADATA;

export default function CartLayout({ children }: PropsWithChildren) {
  return <WagmiProvider>{children}</WagmiProvider>;
}
