import type { PropsWithChildren } from 'react';
import { NO_INDEX_METADATA } from '@/lib/seo/noindex';
import { FloatingBatchButton } from '@/components/admin/email-batch/floating-batch-button';
import { WagmiProvider } from '@/components/providers/wagmi';

export const metadata = NO_INDEX_METADATA;

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    <WagmiProvider>
      {children}
      <FloatingBatchButton />
    </WagmiProvider>
  );
}
