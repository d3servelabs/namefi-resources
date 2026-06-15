import type { PropsWithChildren } from 'react';
import { SessionsProvider } from '@/components/providers/privy';

export default function FaucetLayout({ children }: PropsWithChildren) {
  return <SessionsProvider>{children}</SessionsProvider>;
}
