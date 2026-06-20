import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';
import { getTranslations } from 'next-intl/server';
import { NO_INDEX_METADATA } from '@/lib/seo/noindex';
import { WagmiProvider } from '@/components/providers/wagmi';
import { StuckFeedback } from '@/components/feedback/stuck-feedback';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cart');
  return { ...NO_INDEX_METADATA, title: t('metaTitle') };
}

export default function CartLayout({ children }: PropsWithChildren) {
  return (
    <WagmiProvider>
      {children}
      <StuckFeedback source="cart" />
    </WagmiProvider>
  );
}
