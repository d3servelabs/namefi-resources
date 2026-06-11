'use client';

import { WagmiProvider } from '@/components/providers/wagmi';
import { UserDropdownMenu } from './user-dropdown-full';

export function UserDropdownMenuRuntime() {
  return (
    <WagmiProvider>
      <UserDropdownMenu />
    </WagmiProvider>
  );
}
