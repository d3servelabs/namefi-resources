'use client';

import { WagmiProvider } from '@/components/providers/wagmi';
import ImpersonationBannerInner from './ImpersonationBannerInner';
import type { ImpersonationBannerInnerProps } from './ImpersonationBannerInner';

export default function ImpersonationBannerInnerRuntime(
  props: ImpersonationBannerInnerProps,
) {
  return (
    <WagmiProvider>
      <ImpersonationBannerInner {...props} />
    </WagmiProvider>
  );
}
