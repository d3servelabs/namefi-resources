import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  WalletNftGrid,
  WalletNftGridSkeleton,
} from '@/components/owner/wallet-nft-grid';
import { getOriginRuntime } from '@/lib/origin/utils.server';
import type { OriginInfo } from '@/lib/origin';
import { PageShell } from '@/components/page-shell';
import { WagmiProvider } from '@/components/providers/wagmi';

// 0xmaks.eth — a public, well-known wallet with a diverse Namefi NFT
// portfolio. Hardcoded as the featured holder so this page renders meaningful
// content today without a new backend endpoint.
// TODO(https://github.com/d3servelabs/namefi-astra/issues/4242):
// replace this single-wallet feature with a proper `registry.listRecentDomains`
// procedure that aggregates recent mints across all wallets.
const FEATURED_GALLERY_WALLET = '0x1151465023a03f7b2a652c47ba3d580a1d0adbb0';

const canonicalPath = '/gallery';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('gallery');
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

export default async function GalleryPage() {
  const t = await getTranslations('gallery');
  const originRuntime = await getOriginRuntime();
  const originInfo: OriginInfo = {
    isFirstPartyOrigin: originRuntime.isFirstPartyOrigin,
    thirdPartyHostname: originRuntime.thirdPartyHostname,
    config: originRuntime.config,
  };

  return (
    <PageShell size="wide" padding="relaxed">
      <header className="mb-8 space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
          {t('subtitle')}
        </p>
        <p className="text-sm text-muted-foreground">
          {t.rich('cta', {
            importLink: (chunks) => (
              <Link
                href="/#import"
                className="underline underline-offset-4 hover:text-foreground"
              >
                {chunks}
              </Link>
            ),
            registerLink: (chunks) => (
              <Link
                href="/"
                className="underline underline-offset-4 hover:text-foreground"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </header>
      <Suspense fallback={<WalletNftGridSkeleton />}>
        <WagmiProvider>
          <WalletNftGrid
            walletIdentifier={FEATURED_GALLERY_WALLET}
            origin={originInfo}
          />
        </WagmiProvider>
      </Suspense>
    </PageShell>
  );
}
