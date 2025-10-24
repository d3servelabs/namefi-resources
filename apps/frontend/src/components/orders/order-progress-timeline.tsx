'use client';

import { useMemo } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/cn';
import { StatusBadge } from '@/components/status-badge';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import type { AppRouterOutput } from '@/lib/trpc';
import {
  CheckCircle2,
  Loader2,
  XCircle,
  MinusCircle,
  Clock,
} from 'lucide-react';

type OrderProgress = AppRouterOutput['orders']['getOrderProgress'];
type Step = NonNullable<OrderProgress['state']>['steps'][number];

interface OrderProgressTimelineProps {
  progress: OrderProgress | null;
  isLoading?: boolean;
}

const iconByStatus = (status: Step['status']) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case 'IN_PROGRESS':
      return <Loader2 className="h-5 w-5 text-brand-primary animate-spin" />;
    case 'FAILED':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'SKIPPED':
      return <MinusCircle className="h-5 w-5 text-muted-foreground" />;
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />;
  }
};

const copyByStepId: Record<
  Step['id'],
  {
    label: string;
    helper: string;
  }
> = {
  'order-details': {
    label: 'Preparing your order',
    helper: 'Validating domains and wallet configuration.',
  },
  payments: {
    label: 'Collecting payment',
    helper: 'Confirming the payment method you selected.',
  },
  items: {
    label: 'Registering domains',
    helper: 'Securing each domain on the blockchain.',
  },
  'post-processing': {
    label: 'Final touches',
    helper: 'Updating indexes and generating NFT assets.',
  },
  'final-status': {
    label: 'Finalising order status',
    helper: 'Applying the final status to your order.',
  },
  refund: {
    label: 'Handling refunds',
    helper: 'Returning funds for any items we could not secure.',
  },
  notification: {
    label: 'Sending confirmation',
    helper: 'Preparing your receipt and order summary email.',
  },
};

const friendlyPaymentStatus: Record<
  NonNullable<OrderProgress['state']>['payment']['status'],
  string
> = {
  PENDING: 'Payment details queued',
  CHARGING: 'Charging your payment method',
  CHARGED: 'Payment confirmed',
  FAILED: 'Payment failed',
};

const friendlyRefundStatus: Record<
  NonNullable<OrderProgress['state']>['refund']['status'],
  string
> = {
  NOT_REQUIRED: 'No refund needed',
  PENDING: 'Preparing refund',
  PROCESSING: 'Refund in progress',
  COMPLETED: 'Refund completed',
  FAILED: 'Refund failed',
};

const friendlyNotificationStatus: Record<
  NonNullable<OrderProgress['state']>['notification']['status'],
  string
> = {
  PENDING: 'We will email you when everything is ready',
  SENT: 'Confirmation email sent',
  SKIPPED: 'Notification skipped',
  FAILED: 'Unable to send notification',
};

export function OrderProgressTimeline({
  progress,
  isLoading = false,
}: OrderProgressTimelineProps) {
  const effectiveLoading = isLoading || !progress;
  const steps = progress?.state?.steps ?? [];
  const summary = progress?.state?.summary;

  const activeStepId = useMemo(() => {
    const active =
      steps.find((step) => step.status === 'IN_PROGRESS') ??
      steps.find((step) => step.status === 'PENDING');
    return active?.id;
  }, [steps]);

  const refreshedAt = progress?.fetchedAt ? new Date(progress.fetchedAt) : null;

  const summaryLine = useMemo(() => {
    if (!summary) return null;
    const total = summary.totalItems ?? 0;
    const succeeded = summary.succeededItems ?? 0;
    const failed = summary.failedItems ?? 0;
    const pieces: string[] = [];
    pieces.push(`${succeeded}/${total} domains secured`);
    if (failed > 0) {
      pieces.push(`${failed} need attention`);
    }
    return pieces.join(' • ');
  }, [summary]);

  if (effectiveLoading) {
    return <OrderProgressTimelineSkeleton />;
  }

  return (
    <div className="rounded-2xl border border-border bg-background/60 p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Live order updates</p>
          <h2 className="text-xl font-semibold">
            {activeStepId
              ? copyByStepId[activeStepId].label
              : 'We are processing your order'}
          </h2>
        </div>
        <StatusBadge
          status={progress?.orderStatus ?? 'PROCESSING'}
          type="order"
        />
      </div>

      {summaryLine ? (
        <div className="mt-3 rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {summaryLine}
        </div>
      ) : null}

      <ol className="mt-5 space-y-4">
        {steps.map((step) => {
          const copy = copyByStepId[step.id];
          return (
            <li
              key={step.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors',
                step.id === activeStepId
                  ? 'border-brand-primary/30 bg-brand-primary/5'
                  : 'bg-muted/10',
              )}
            >
              <span className="mt-0.5">{iconByStatus(step.status)}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {copy.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {step.message ?? copy.helper}
                </p>
              </div>
              <StepStatusPill status={step.status} />
            </li>
          );
        })}
      </ol>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <InfoTile
          title="Payment"
          value={
            friendlyPaymentStatus[progress?.state?.payment.status ?? 'PENDING']
          }
        />
        <InfoTile
          title="Refunds"
          value={
            friendlyRefundStatus[
              progress?.state?.refund.status ?? 'NOT_REQUIRED'
            ]
          }
          muted={progress?.state?.refund.status === 'NOT_REQUIRED'}
        />
        <InfoTile
          title="Notifications"
          value={
            friendlyNotificationStatus[
              progress?.state?.notification.status ?? 'PENDING'
            ]
          }
          muted={progress?.state?.notification.status === 'PENDING'}
        />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {refreshedAt
          ? `Updated ${formatDistanceToNowStrict(refreshedAt, { addSuffix: true })}`
          : 'Waiting for the first update…'}
      </p>
    </div>
  );
}

const stepStatusCopy: Record<Step['status'], string> = {
  COMPLETED: 'Complete',
  IN_PROGRESS: 'In progress',
  FAILED: 'Needs attention',
  SKIPPED: 'Skipped',
  PENDING: 'Pending',
} as const;

function StepStatusPill({ status }: { status: Step['status'] }) {
  const label = stepStatusCopy[status] ?? status;
  const tone =
    status === 'COMPLETED'
      ? 'bg-emerald-500/15 text-emerald-600'
      : status === 'IN_PROGRESS'
        ? 'bg-brand-primary/10 text-brand-primary'
        : status === 'FAILED'
          ? 'bg-red-500/15 text-red-600'
          : 'bg-muted/40 text-muted-foreground';

  return (
    <span
      className={cn(
        'rounded-full px-2 py-1 text-xs font-medium capitalize',
        tone,
      )}
    >
      {label}
    </span>
  );
}

interface InfoTileProps {
  title: string;
  value: string;
  muted?: boolean;
}

function InfoTile({ title, value, muted = false }: InfoTileProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border/80 bg-muted/20 px-3 py-2',
        muted && 'opacity-80',
      )}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function OrderProgressTimelineSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-56" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <div className="mt-5 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`order-progress-skeleton-${index}`}
            className="flex items-start gap-3 rounded-lg border border-transparent bg-muted/10 px-3 py-2"
          >
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`order-progress-info-skeleton-${index}`}
            className="rounded-lg border border-border/80 bg-muted/20 px-3 py-3"
          >
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-4 h-3 w-48" />
    </div>
  );
}
