'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import {
  useX402PurchaseProgress,
  x402PurchaseStepDisplayInfo,
  x402ProcessingOrderSubstepDisplayInfo,
} from '@/hooks/use-x402-purchase-progress';
import { ProgressTimeline } from '@namefi-astra/ui/components/namefi/progress-timeline';
import { StatusBadge } from '@/components/status-badge';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { ExternalLink } from 'lucide-react';
import { isNotNil } from 'ramda';

interface PageProps {
  params: Promise<{ purchaseId: string }>;
}

function formatUsdCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getBlockExplorerUrl(network: string, txHash: string): string | null {
  if (network === 'eip155:8453') {
    return `https://basescan.org/tx/${txHash}`;
  }
  if (network === 'eip155:84532') {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  }
  return null;
}

export default function X402PurchaseProgressPage({ params }: PageProps) {
  const { purchaseId } = use(params);

  const { steps, isLoading, phase, data, workflowStatus, purchaseStatus } =
    useX402PurchaseProgress(purchaseId);

  // Handle not found after loading
  if (!isLoading && workflowStatus === 'NOT_FOUND' && !data?.domain) {
    return notFound();
  }

  // Map purchaseStatus to StatusBadge-compatible status
  const displayStatus =
    purchaseStatus === 'COMPLETED'
      ? 'COMPLETED'
      : purchaseStatus === 'FAILED'
        ? 'FAILED'
        : 'PROCESSING';

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Domain Purchase</h1>
        {isLoading ? (
          <Skeleton className="mt-1 h-5 w-40" />
        ) : (
          data?.domain && (
            <p className="text-lg text-muted-foreground">{data.domain}</p>
          )
        )}
      </div>

      {/* Progress Timeline */}
      <ProgressTimeline
        loading={isLoading || phase === 'loading'}
        steps={steps}
        stepDisplayInfo={x402PurchaseStepDisplayInfo}
        subtitle="Live purchase updates"
        badge={<StatusBadge status={displayStatus} type="order" />}
        skeletonStepCount={5}
        getSubstepDisplayInfo={(stepId) =>
          stepId === 'processing-order'
            ? x402ProcessingOrderSubstepDisplayInfo
            : undefined
        }
      />

      {/* Purchase Details */}
      {!isLoading && data && data.domain && (
        <div className="mt-6 rounded-lg border border-border bg-background/60 p-4">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Purchase Details
          </h3>
          <dl className="space-y-2 text-sm">
            {data.buyerWallet && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Buyer Wallet</dt>
                <dd className="font-mono">
                  {shortenAddress(data.buyerWallet)}
                </dd>
              </div>
            )}
            {isNotNil(data.amountInUsdCents) && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Amount</dt>
                <dd>{formatUsdCents(data.amountInUsdCents)} USDC</dd>
              </div>
            )}
            {data.settlementTxHash && data.network && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Transaction</dt>
                <dd>
                  {(() => {
                    const url = getBlockExplorerUrl(
                      data.network,
                      data.settlementTxHash,
                    );
                    return url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {shortenAddress(data.settlementTxHash)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="font-mono">
                        {shortenAddress(data.settlementTxHash)}
                      </span>
                    );
                  })()}
                </dd>
              </div>
            )}
            {data.orderId && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Order</dt>
                <dd>
                  <a
                    href={`/orders/${data.orderId}/details`}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    View order details
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Failed state - generic message */}
      {phase === 'terminal' && purchaseStatus === 'FAILED' && (
        <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Purchase failed. Please contact support if you need assistance.
          </p>
        </div>
      )}
    </div>
  );
}
