import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';
import { getTranslations } from 'next-intl/server';
import { NO_INDEX_METADATA } from '@/lib/seo/noindex';
import { WagmiProvider } from '@/components/providers/wagmi';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('profile');
  return { ...NO_INDEX_METADATA, title: t('metaTitle') };
}

export default function ProfileLayout({ children }: PropsWithChildren) {
  return <WagmiProvider>{children}</WagmiProvider>;
}
