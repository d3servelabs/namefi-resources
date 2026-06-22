import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  MarketplaceBrowser,
  MarketplaceBrowserSkeleton,
} from '@/components/mart/marketplace-browser';
import { PageShell } from '@/components/page-shell';
import { WagmiProvider } from '@/components/providers/wagmi';

const canonicalPath = '/mart';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mart');
  const title = t('metaTitle');
  const description = t('metaDescription');

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@namefi_io',
      creator: '@namefi_io',
    },
  };
}

export default async function MarketplacePage() {
  const t = await getTranslations('mart');

  return (
    <PageShell size="wide" padding="relaxed">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t('title')}
        </h1>
      </header>
      <Suspense fallback={<MarketplaceBrowserSkeleton />}>
        <WagmiProvider>
          <MarketplaceBrowser />
        </WagmiProvider>
      </Suspense>
    </PageShell>
  );
}
