import type { PropsWithChildren } from 'react';
import { NO_INDEX_METADATA } from '@/lib/seo/noindex';

export const metadata = NO_INDEX_METADATA;

export default function HuntMineLayout({ children }: PropsWithChildren) {
  return children;
}
