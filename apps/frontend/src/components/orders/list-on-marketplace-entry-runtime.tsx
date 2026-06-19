'use client';

import type { ComponentProps } from 'react';
import { WagmiProvider } from '@/components/providers/wagmi';
import { ListOnMarketplaceEntry } from './list-on-marketplace-entry';

/**
 * Provider boundary for {@link ListOnMarketplaceEntry}. The order completion
 * page has no wagmi runtime, so this adds one (idempotent — it passes through
 * when a parent already provides one). Stories render the bare entry under a
 * mock wagmi provider instead.
 */
export function ListOnMarketplaceEntryRuntime(
  props: ComponentProps<typeof ListOnMarketplaceEntry>,
) {
  return (
    <WagmiProvider>
      <ListOnMarketplaceEntry {...props} />
    </WagmiProvider>
  );
}
