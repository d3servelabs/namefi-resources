import type { PropsWithChildren } from 'react';
import { NO_INDEX_METADATA } from '@/lib/seo/noindex';
import { SessionsProvider } from '@/components/providers/privy';

export const metadata = NO_INDEX_METADATA;

export default function OrdersLayout({ children }: PropsWithChildren) {
  return <SessionsProvider>{children}</SessionsProvider>;
}
