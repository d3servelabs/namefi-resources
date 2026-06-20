import {
  WalletNftGrid,
  WalletNftGridSkeleton,
} from '@/components/owner/wallet-nft-grid';
import { getOriginRuntime } from '@/lib/origin/utils.server';
import type { OriginInfo } from '@/lib/origin';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { WagmiProvider } from '@/components/providers/wagmi';

interface PageProps {
  params: Promise<{ walletAddress: string }>;
}

export default async function OwnerWalletPage({ params }: PageProps) {
  const { walletAddress } = await params;
  const decoded = decodeURIComponent(walletAddress ?? '').trim();

  if (!decoded) {
    return notFound();
  }

  const originRuntime = await getOriginRuntime();
  const originInfo: OriginInfo = {
    isFirstPartyOrigin: originRuntime.isFirstPartyOrigin,
    thirdPartyHostname: originRuntime.thirdPartyHostname,
    config: originRuntime.config,
  };

  const t = await getTranslations('shared');

  return (
    <PageShell size="wide" padding="relaxed">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('ownerPage.heading')}
        </h1>
        <p className="font-mono text-lg text-muted-foreground break-all">
          {decoded}
        </p>
      </div>
      <Suspense fallback={<WalletNftGridSkeleton />}>
        <WagmiProvider>
          <WalletNftGrid walletIdentifier={decoded} origin={originInfo} />
        </WagmiProvider>
      </Suspense>
    </PageShell>
  );
}
