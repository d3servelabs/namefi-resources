'use client';

import { WagmiProvider } from '@/components/providers/wagmi';
import {
  InstantBuyModal,
  type InstantBuyModalProps,
} from './instant-buy-modal';

export function InstantBuyModalRuntime(props: InstantBuyModalProps) {
  return (
    <WagmiProvider>
      <InstantBuyModal {...props} />
    </WagmiProvider>
  );
}
