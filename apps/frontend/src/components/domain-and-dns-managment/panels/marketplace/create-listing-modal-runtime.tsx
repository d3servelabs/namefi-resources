'use client';

import { WagmiProvider } from '@/components/providers/wagmi';
import { CreateListingModal } from './create-listing-modal';
import type { ComponentProps } from 'react';

type CreateListingModalRuntimeProps = ComponentProps<typeof CreateListingModal>;

export function CreateListingModalRuntime(
  props: CreateListingModalRuntimeProps,
) {
  return (
    <WagmiProvider>
      <CreateListingModal {...props} />
    </WagmiProvider>
  );
}
