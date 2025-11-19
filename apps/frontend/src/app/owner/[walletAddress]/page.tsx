import {
  WalletNftGrid,
  WalletNftGridSkeleton,
} from '@/components/owner/wallet-nft-grid';
import { getOriginRuntime } from '@/lib/origin/utils.server';
import type { OriginInfo } from '@/lib/origin';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

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

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 lg:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Domains owned by this wallet
        </h1>
        <p className="font-mono text-lg text-muted-foreground break-all">
          {decoded}
        </p>
      </div>
      <Suspense fallback={<WalletNftGridSkeleton />}>
        <WalletNftGrid walletIdentifier={decoded} origin={originInfo} />
      </Suspense>
    </div>
  );
}
