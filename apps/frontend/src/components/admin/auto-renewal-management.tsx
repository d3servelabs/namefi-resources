'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@namefi-astra/ui/components/shadcn/card';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useCallback, type FC } from 'react';
import {
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  Users,
  Globe,
  Clock,
  ArrowLeft,
  Calendar,
  Play,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { PageShell } from '@/components/page-shell';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import type { ColumnDef, Row, ExpandedState } from '@tanstack/react-table';
import {
  useDrizzlerServerFilterStrategy,
  convertToDrizzlerFilterOptions,
  applyClientSideSorting,
  type DrizzlerFilterState,
} from '@/components/table/filters';
import { applyDrizzlerFilterOnDataset } from '@samyx/drizzler-filters-sorters/experimental';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { UserWalletAvatar } from '@/components/user-avatar';
import { AdminUserLookupButton } from '@/components/admin/user-details';
import { getTransactionExplorerUrl } from '@/components/admin/bulk-burn-management';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { TruncatedTextWithHover } from '@/components/truncated-text-with-hover';
import { toast } from 'sonner';
import { Copy, ExternalLink } from 'lucide-react';
import { cn } from '@namefi-astra/ui/lib/cn';

// ─── Types ───────────────────────────────────────────────────────

type DomainRow = {
  domain: string;
  userId: string;
  userEmail?: string;
  walletAddress?: string;
  registrar?: string;
  chainId?: number;
  status:
    | 'SUCCESS'
    | 'FAILED'
    | 'PAYMENT_FAILED'
    | 'MISSING_PRICE'
    | 'SKIPPED_INSUFFICIENT_FUNDS';
  chargeAmountUsd?: number | null;
  errorReason?: string;
  actionRequired?: string;
  txHash?: string;
  eppOperationStatus?: string;
  /**
   * User-level payment status (SUCCEEDED / FAILED / SKIPPED).
   * Carried on every row of the same user so the group header — which
   * is computed from the currently visible (filtered + paginated) rows —
   * can still display the user-level status without round-tripping back
   * to the full userResults set.
   */
  userPaymentStatus?: string;
  /**
   * Per-user run-start snapshot fields. Same values on every row in the
   * same group; duplicated so the group header (which derives from visible
   * rows) can render balance + payment-method info without a separate map.
   * USD. `availableBalanceInNfsc` is summed across chains at workflow start
   * and does NOT reflect post-charge debits.
   */
  availableBalanceInNfsc?: number;
  nfscBalancesByChain?: Array<{
    walletAddress: string;
    chainId: number;
    balanceInUsd: number | null;
  }>;
  availablePaymentMethods?: Array<
    | { kind: 'NFSC_WALLET'; walletAddress: string }
    | { kind: 'STRIPE'; last4: string | null; paymentMethodId: string }
  >;
  /** USD cents short of covering the full original renewal bill. */
  shortfallInUsdCents?: number;
  snapshotTakenAt?: string;
  /** All payments for the user this domain belongs to. Same array on every row in the same group. */
  payments?: Array<{
    provider: string;
    /** Amount in USD cents (1 USD = 100 cents). */
    amountInUsdCents: number;
    /**
     * Provider-specific external reference.
     * - Stripe: Payment Intent ID (e.g. `pi_...`)
     * - NFSC / X402 / MPP: on-chain transaction hash
     */
    paymentProviderReferenceId?: string;
  }>;
};

// ─── Helpers ─────────────────────────────────────────────────────

function getStatusBadge(status: DomainRow['status']) {
  switch (status) {
    case 'SUCCESS':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-green-300 text-green-300"
        >
          <CheckCircle2 className="w-3 h-3" />
          Success
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="outline" className="gap-1 border-red-300 text-red-300">
          <XCircle className="w-3 h-3" />
          Failed
        </Badge>
      );
    case 'PAYMENT_FAILED':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-amber-200 text-amber-200"
        >
          <AlertTriangle className="w-3 h-3" />
          Could Not Charge
        </Badge>
      );
    case 'SKIPPED_INSUFFICIENT_FUNDS':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-amber-300/80 text-amber-300/80"
        >
          <Clock className="w-3 h-3" />
          Deferred — Low Balance
        </Badge>
      );
    case 'MISSING_PRICE':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-orange-300 text-orange-300"
        >
          <AlertTriangle className="w-3 h-3" />
          Missing Price
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function formatUsd(amount: number | null | undefined): string {
  if (amount == null) return '-';
  return `$${amount.toFixed(2)}`;
}

/**
 * Build a provider-specific external URL for a single payment.
 *
 * - Stripe → Stripe dashboard payment intent page (https://dashboard.stripe.com/payments/<pi_...>).
 * - NFSC_BASE / X402 / MPP → Base block explorer (chain 8453).
 * - NFSC_ETHEREUM → Ethereum mainnet block explorer (chain 1).
 * - NFSC_ETHEREUM_SEPOLIA → Sepolia testnet block explorer (chain 11155111).
 * - Anything else → null.
 *
 * For on-chain providers, prefers the payment-specific reference (the actual
 * settlement tx hash from `paymentsTable.paymentProviderReferenceId`), but
 * falls back to the renewal-tx hash from the row when that field is missing
 * (e.g. for older payments that predate the reference being persisted, or
 * providers that didn't record one). This matches the previous behavior
 * where the cell linked to the renewal tx hash.
 */
function getPaymentExplorerUrl(
  provider: string,
  reference: string | undefined,
  renewalTxHash?: string,
  renewalChainId?: number,
): string | null {
  if (provider === 'STRIPE') {
    if (!reference) return null;
    return `https://dashboard.stripe.com/payments/${reference}`;
  }
  // Map provider → chain id for on-chain settlements.
  const providerChainId =
    provider === 'NFSC_ETHEREUM'
      ? 1
      : provider === 'NFSC_ETHEREUM_SEPOLIA'
        ? 11155111
        : 8453; // NFSC_BASE, X402, MPP — all default to Base mainnet

  // Prefer the payment-specific settlement tx hash; fall back to the
  // renewal tx hash on the same row (which always lives on the NFT chain).
  if (reference) {
    return getTransactionExplorerUrl(providerChainId, reference);
  }
  if (renewalTxHash && renewalChainId) {
    return getTransactionExplorerUrl(renewalChainId, renewalTxHash);
  }
  return null;
}

function formatDuration(ms: number | undefined): string {
  if (!ms) return '-';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function formatRegistrar(registrar: string | undefined): string {
  switch (registrar) {
    case 'dynadot_gdg':
      return 'Dynadot (GDG)';
    case 'dynadot_regular':
      return 'Dynadot (Regular)';
    case 'route53':
      return 'Route 53';
    default:
      return registrar || 'Unknown';
  }
}

// ─── Loading Skeleton ────────────────────────────────────────────

const LoadingSkeletons: FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
    <Skeleton className="h-[400px] rounded-lg" />
  </div>
);

// ─── Run Config Card ─────────────────────────────────────────────

type RunConfigShape = {
  runType: 'scheduled' | 'manual' | 'unknown';
  scheduleId?: string;
  scheduledStartTime?: Date | string | null;
  input?: {
    dryRun?: boolean;
    forceSendReport?: boolean;
    allowExpired?: boolean;
    ownersIdFilter?: string[];
    overrideRecipientEmail?: string;
  };
};

function RunConfigCard({ runConfig }: { runConfig: RunConfigShape }) {
  const { runType, scheduleId, scheduledStartTime, input } = runConfig;
  const scheduledAt =
    scheduledStartTime instanceof Date
      ? scheduledStartTime
      : scheduledStartTime
        ? new Date(scheduledStartTime)
        : null;

  const runTypeBadge =
    runType === 'scheduled' ? (
      <Badge
        variant="outline"
        className="gap-1 border-blue-300/80 text-blue-300/80"
      >
        <Calendar className="w-3 h-3" />
        Scheduled
      </Badge>
    ) : runType === 'manual' ? (
      <Badge
        variant="outline"
        className="gap-1 border-muted-foreground/60 text-muted-foreground"
      >
        <Play className="w-3 h-3" />
        Manual
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">
        Unknown
      </Badge>
    );

  const ownersFilter = input?.ownersIdFilter ?? [];
  const ownersSummary =
    ownersFilter.length === 0
      ? null
      : ownersFilter.length <= 6
        ? ownersFilter.join(', ')
        : `${ownersFilter.slice(0, 6).join(', ')} +${ownersFilter.length - 6} more`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Run Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 text-xs">
          <div>
            <dt className="text-muted-foreground">Run Type</dt>
            <dd className="font-medium mt-0.5">{runTypeBadge}</dd>
          </div>
          {scheduleId && (
            <div>
              <dt className="text-muted-foreground">Schedule ID</dt>
              <dd className="font-mono text-[11px] mt-0.5 break-all">
                {scheduleId}
              </dd>
            </div>
          )}
          {scheduledAt && !Number.isNaN(scheduledAt.getTime()) && (
            <div>
              <dt className="text-muted-foreground">Scheduled For</dt>
              <dd className="font-medium mt-0.5">
                {scheduledAt.toLocaleString()}
              </dd>
            </div>
          )}
          {typeof input?.dryRun === 'boolean' && (
            <div>
              <dt className="text-muted-foreground">dryRun</dt>
              <dd className="font-medium mt-0.5">
                {input.dryRun ? (
                  <Badge
                    variant="outline"
                    className="text-xs border-amber-300/80 text-amber-300/80"
                  >
                    true
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">false</span>
                )}
              </dd>
            </div>
          )}
          {typeof input?.forceSendReport === 'boolean' && (
            <div>
              <dt className="text-muted-foreground">forceSendReport</dt>
              <dd className="font-medium mt-0.5">
                {String(input.forceSendReport)}
              </dd>
            </div>
          )}
          {typeof input?.allowExpired === 'boolean' && (
            <div>
              <dt className="text-muted-foreground">allowExpired</dt>
              <dd className="font-medium mt-0.5">
                {String(input.allowExpired)}
              </dd>
            </div>
          )}
          {ownersSummary && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">
                ownersIdFilter ({ownersFilter.length})
              </dt>
              <dd className="font-mono text-[11px] mt-0.5 break-all">
                {ownersSummary}
              </dd>
            </div>
          )}
          {input?.overrideRecipientEmail && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">overrideRecipientEmail</dt>
              <dd className="mt-0.5">
                <Badge
                  variant="outline"
                  className="gap-1 text-xs border-amber-300/80 text-amber-300/80"
                  title="User-facing emails for this run were redirected away from real users"
                >
                  <Mail className="w-3 h-3" />
                  {input.overrideRecipientEmail}
                </Badge>
              </dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string;
  value: string | number;
  icon: FC<{ className?: string }>;
  variant?: 'default' | 'success' | 'danger';
}) {
  const colorClass =
    variant === 'success'
      ? 'text-green-500'
      : variant === 'danger'
        ? 'text-red-500'
        : 'text-muted-foreground';

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Icon className={`w-4 h-4 ${colorClass}`} />
        </div>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export default function AutoRenewalManagement({
  workflowId,
  runId,
}: {
  workflowId: string;
  runId?: string;
}) {
  const trpc = useTRPC();

  const { data, isLoading, isError, error, refetch } = useQuery({
    ...trpc.admin.autoRenewal.getAutoRenewalWorkflowById.queryOptions({
      workflowId,
      runId,
    }),
    refetchInterval: (query) => {
      const d = query.state.data;
      if (d && 'status' in d) {
        const status = d.status;
        if (
          status === 'COMPLETED' ||
          status === 'FAILED' ||
          status === 'CANCELLED' ||
          status === 'TERMINATED'
        ) {
          return false;
        }
      }
      return 10_000;
    },
  });

  if (isLoading) {
    return (
      <PageShell padding="admin">
        <LoadingSkeletons />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell padding="admin">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold">Failed to Load Workflow</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error?.message || 'An unexpected error occurred.'}
            </p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="mt-4 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!data || !data.exists) {
    return (
      <PageShell padding="admin">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Workflow not found.</p>
            <Link href="/admin/auto-renewal">
              <Button variant="outline" className="mt-4 gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to List
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // Extract optional fields from the union type
  const metrics = 'metrics' in data ? data.metrics : undefined;
  const userResults = 'userResults' in data ? data.userResults : undefined;

  // Build the Temporal UI URL for this workflow run.
  // The backend's apiUrl is the gRPC API endpoint; the UI is hosted at
  // localhost:8233 in dev or cloud.temporal.io in prod.
  const temporalUiNamespaceBase = (() => {
    if (!('temporal' in data) || !data.temporal) return null;
    const { apiUrl, namespace } = data.temporal;
    const uiBase = apiUrl?.includes('localhost')
      ? 'http://localhost:8233'
      : 'https://cloud.temporal.io';
    return `${uiBase}/namespaces/${namespace}`;
  })();
  const temporalUiUrl = temporalUiNamespaceBase
    ? `${temporalUiNamespaceBase}/workflows/${encodeURIComponent(
        data.workflowId,
      )}/${encodeURIComponent(data.runId)}`
    : null;

  const formatDateTime = (d: Date | string | null | undefined) => {
    if (!d) return '-';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleString();
  };

  const runDuration =
    data.startTime && data.closeTime
      ? new Date(data.closeTime).getTime() - new Date(data.startTime).getTime()
      : null;

  return (
    <PageShell padding="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/auto-renewal">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Auto-Renewal Run</h1>
              <p className="text-xs text-muted-foreground">
                {data.startTime
                  ? new Date(data.startTime).toLocaleDateString()
                  : ''}
              </p>
            </div>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Workflow Details */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Workflow Details</CardTitle>
              {temporalUiUrl && (
                <a
                  href={temporalUiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:underline"
                >
                  Open in Temporal UI
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 text-xs">
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium mt-0.5">{data.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Started</dt>
                <dd className="font-medium mt-0.5">
                  {formatDateTime(data.startTime)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Completed</dt>
                <dd className="font-medium mt-0.5">
                  {formatDateTime(data.closeTime)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="font-medium mt-0.5">
                  {runDuration != null ? formatDuration(runDuration) : '-'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Workflow ID</dt>
                <dd className="font-mono text-[11px] mt-0.5 break-all">
                  {data.workflowId}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Run ID</dt>
                <dd className="font-mono text-[11px] mt-0.5 break-all">
                  {data.runId}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Run Configuration — runType + control params */}
        {'runConfig' in data && data.runConfig && (
          <RunConfigCard runConfig={data.runConfig} />
        )}

        {/* KPI Cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <KpiCard
              label="Users Processed"
              value={metrics.totalUsersProcessed}
              icon={Users}
            />
            <KpiCard
              label="Domains Renewed"
              value={metrics.successfulRenewals}
              icon={Globe}
              variant="success"
            />
            <KpiCard
              label="Domains Not Renewed"
              value={metrics.failedRenewals}
              icon={XCircle}
              variant={metrics.failedRenewals > 0 ? 'danger' : 'default'}
            />
            <KpiCard
              label="Deferred (Low Balance)"
              value={metrics.failureBreakdown?.deferredInsufficientBalance ?? 0}
              icon={Clock}
              variant={
                (metrics.failureBreakdown?.deferredInsufficientBalance ?? 0) > 0
                  ? 'danger'
                  : 'default'
              }
            />
            <KpiCard
              label="Net Revenue"
              value={formatUsd(
                metrics.totalAmountChargedInUsd -
                  metrics.totalAmountRefundedInUsd,
              )}
              icon={DollarSign}
            />
            <KpiCard
              label="Completion Rate"
              value={
                metrics.totalDomainsProcessed > 0
                  ? `${((metrics.successfulRenewals / metrics.totalDomainsProcessed) * 100).toFixed(1)}%`
                  : 'N/A'
              }
              icon={CheckCircle2}
              variant="success"
            />
            <KpiCard
              label="Execution Time"
              value={formatDuration(
                metrics.executionMetrics?.totalExecutionTime,
              )}
              icon={Clock}
            />
          </div>
        )}

        {/* Breakdowns */}
        {metrics && <BreakdownCards metrics={metrics} />}

        {/* Domains Table */}
        {userResults && (
          <DomainsTable
            userResults={userResults}
            temporalUiNamespaceBase={temporalUiNamespaceBase}
          />
        )}

        {/* Critical Issues */}
        {metrics &&
          metrics.criticalDomains &&
          metrics.criticalDomains.length > 0 && (
            <CriticalIssuesCard criticalDomains={metrics.criticalDomains} />
          )}

        {/* System Health */}
        {metrics && <SystemHealthCard metrics={metrics} />}
      </div>
    </PageShell>
  );
}

// ─── Breakdown Cards ─────────────────────────────────────────────

type MetricsShape = {
  totalUsersProcessed: number;
  totalDomainsProcessed: number;
  successfulRenewals: number;
  failedRenewals: number;
  totalAmountChargedInUsd: number;
  totalAmountRefundedInUsd: number;
  paymentMethodBreakdown: Record<
    string,
    { count: number; amountInUsd: number }
  >;
  failureBreakdown: {
    failedToCharge: number;
    registrarErrors: number;
    missingPriceData: number;
    deferredInsufficientBalance: number;
  };
  totalShortfallInUsdCents: number;
  totalNfscBalanceInUsdAtRunStart: number;
  usersWithInsufficientBalance: number;
  criticalDomains: Array<{
    domain: string;
    userId: string;
    userEmail?: string;
    issue: string;
    registrar?: string;
    actionRequired: string;
  }>;
  userCommunication?: {
    upcomingRenewalNotifications: number;
    successfulRenewalConfirmations: number;
    failedRenewalAlerts: number;
    paymentFailureNotifications: number;
  };
  executionMetrics?: {
    totalExecutionTime: number;
    averageTimePerUser: number;
    childWorkflowsSpawned: number;
  };
  registrarBreakdown: Record<string, { successful: number; failed: number }>;
  largestTransaction: { userId: string; amount: number; domainCount: number };
};

function BreakdownCards({ metrics }: { metrics: MetricsShape }) {
  const paymentEntries = Object.entries(metrics.paymentMethodBreakdown ?? {});
  const registrarEntries = Object.entries(metrics.registrarBreakdown ?? {});

  if (paymentEntries.length === 0 && registrarEntries.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {paymentEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Payment Method Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {paymentEntries.map(([method, data]) => {
                const pct =
                  metrics.totalAmountChargedInUsd > 0
                    ? (
                        (data.amountInUsd / metrics.totalAmountChargedInUsd) *
                        100
                      ).toFixed(0)
                    : '0';
                return (
                  <div
                    key={method}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{method}</span>
                    <span className="text-muted-foreground">
                      {data.count} txn &middot; ${data.amountInUsd.toFixed(2)} (
                      {pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {registrarEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Registrar Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {registrarEntries.map(([registrar, stats]) => {
                const total = stats.successful + stats.failed;
                const rate =
                  total > 0
                    ? ((stats.successful / total) * 100).toFixed(0)
                    : '0';
                return (
                  <div
                    key={registrar}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{formatRegistrar(registrar)}</span>
                    <span className="text-muted-foreground">
                      {stats.successful} ok / {stats.failed} fail ({rate}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Domains Table ───────────────────────────────────────────────

type UserResultItem = {
  userId: string;
  userEmail?: string;
  paymentStatus: string;
  totalAmountInUsd: number;
  refundAmountInUsd?: number;
  orderId?: string;
  /**
   * Child workflow ID for the per-user Temporal run — exposed so the
   * admin UI can link directly to that subworkflow's Temporal page.
   */
  childWorkflowId?: string;
  /** NFSC balance available at workflow start (USD, summed across chains). */
  availableBalanceInNfsc?: number;
  nfscBalancesByChain?: Array<{
    walletAddress: string;
    chainId: number;
    balanceInUsd: number | null;
  }>;
  availablePaymentMethods?: Array<
    | { kind: 'NFSC_WALLET'; walletAddress: string }
    | { kind: 'STRIPE'; last4: string | null; paymentMethodId: string }
  >;
  shortfallInUsdCents?: number;
  snapshotTakenAt?: string;
  domains: Array<{
    domain: string;
    registrar?: string;
    chainId?: number;
    status:
      | 'SUCCESS'
      | 'FAILED'
      | 'PAYMENT_FAILED'
      | 'MISSING_PRICE'
      | 'SKIPPED_INSUFFICIENT_FUNDS';
    chargeAmountUsd?: number | null;
    errorReason?: string;
    actionRequired?: string;
    txHash?: string;
    eppOperationStatus?: string;
  }>;
  payments: Array<{
    provider: string;
    /** Amount in USD cents (1 USD = 100 cents). */
    amountInUsdCents: number;
    walletAddress?: string;
    stripeLast4?: string;
    /**
     * Provider-specific external reference.
     * - Stripe: Payment Intent ID (e.g. `pi_...`)
     * - NFSC / X402 / MPP: on-chain transaction hash
     */
    paymentProviderReferenceId?: string;
  }>;
};

// ─── Per-user Snapshot Modal ─────────────────────────────────────

function formatChainLabel(chainId: number | undefined): string {
  if (chainId === undefined) return '—';
  if (chainId === 1) return 'Ethereum';
  if (chainId === 8453) return 'Base';
  if (chainId === 11155111) return 'Sepolia';
  return `Chain ${chainId}`;
}

/**
 * Full per-user snapshot dialog — balance breakdown by chain, every
 * payment method available at run start, every domain (grouped by
 * category), and a link to the per-user sub-workflow's Temporal UI
 * page when `childWorkflowId` is known.
 *
 * Opened from a "Details" button on each user's group header row.
 */
function UserSnapshotDialog({
  user,
  rows,
  temporalUiNamespaceBase,
}: {
  user: UserResultItem;
  /** All flattened rows for this user (one per domain). */
  rows: DomainRow[];
  temporalUiNamespaceBase: string | null;
}) {
  const totalRequiredInUsd = rows.reduce(
    (sum, r) => sum + (r.chargeAmountUsd ?? 0),
    0,
  );
  const shortfallInUsd = user.shortfallInUsdCents
    ? user.shortfallInUsdCents / 100
    : 0;
  const snapshotTakenAt = user.snapshotTakenAt
    ? new Date(user.snapshotTakenAt)
    : null;
  const childWorkflowUrl =
    temporalUiNamespaceBase && user.childWorkflowId
      ? `${temporalUiNamespaceBase}/workflows/${encodeURIComponent(user.childWorkflowId)}`
      : null;

  // Group domains by status for the modal sections.
  const byStatus: Record<DomainRow['status'], DomainRow[]> = {
    SUCCESS: [],
    FAILED: [],
    PAYMENT_FAILED: [],
    MISSING_PRICE: [],
    SKIPPED_INSUFFICIENT_FUNDS: [],
  };
  for (const r of rows) byStatus[r.status].push(r);

  const sections: Array<{
    label: string;
    rows: DomainRow[];
    accent: string;
  }> = [
    {
      label: `Renewed (${byStatus.SUCCESS.length})`,
      rows: byStatus.SUCCESS,
      accent: 'text-green-300',
    },
    {
      label: `Deferred — Low Balance (${byStatus.SKIPPED_INSUFFICIENT_FUNDS.length})`,
      rows: byStatus.SKIPPED_INSUFFICIENT_FUNDS,
      accent: 'text-amber-300',
    },
    {
      label: `Payment Failed (${byStatus.PAYMENT_FAILED.length})`,
      rows: byStatus.PAYMENT_FAILED,
      accent: 'text-amber-200',
    },
    {
      label: `Failed (${byStatus.FAILED.length})`,
      rows: byStatus.FAILED,
      accent: 'text-red-300',
    },
    {
      label: `Missing Price (${byStatus.MISSING_PRICE.length})`,
      rows: byStatus.MISSING_PRICE,
      accent: 'text-orange-300',
    },
  ].filter((s) => s.rows.length > 0);

  return (
    <Dialog>
      {/*
        Base UI's DialogTrigger uses `render` (not Radix-style `asChild`).
        Passing a <Button> element via `render` substitutes the element
        while preserving Base UI's trigger props (aria, onClick, etc.).
      */}
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-6 px-2"
            onClick={(e) => e.stopPropagation()}
          >
            Details
          </Button>
        }
      />
      <DialogContent
        className="max-w-3xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="text-base">
            {user.userEmail || user.userId}
          </DialogTitle>
          <DialogDescription className="text-xs font-mono break-all">
            {user.userId}
            {snapshotTakenAt && !Number.isNaN(snapshotTakenAt.getTime()) && (
              <span className="ml-2 text-muted-foreground">
                · Snapshot {snapshotTakenAt.toLocaleString()}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Run summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs border rounded-md p-3">
          <div>
            <p className="text-muted-foreground">Required (USD)</p>
            <p className="font-medium">${totalRequiredInUsd.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Balance at start (USD)</p>
            <p className="font-medium">
              {typeof user.availableBalanceInNfsc === 'number'
                ? `$${user.availableBalanceInNfsc.toFixed(2)}`
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Charged (USD)</p>
            <p className="font-medium">${user.totalAmountInUsd.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Shortfall (USD)</p>
            <p
              className={cn(
                'font-medium',
                shortfallInUsd > 0 ? 'text-amber-300' : '',
              )}
            >
              {shortfallInUsd > 0 ? `$${shortfallInUsd.toFixed(2)}` : '—'}
            </p>
          </div>
        </div>

        {/* NFSC balances by chain */}
        <div className="mt-1">
          <h4 className="text-xs font-medium mb-2">NFSC balances by chain</h4>
          {user.nfscBalancesByChain && user.nfscBalancesByChain.length > 0 ? (
            <div className="text-xs border rounded-md divide-y">
              {user.nfscBalancesByChain.map((b) => (
                <div
                  key={`${b.walletAddress}-${b.chainId}`}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] truncate">
                      <TruncatedTextWithHover maxLength={16}>
                        {b.walletAddress}
                      </TruncatedTextWithHover>
                    </span>
                    <span className="text-muted-foreground">
                      {formatChainLabel(b.chainId)}
                    </span>
                  </div>
                  <span className="font-mono">
                    {typeof b.balanceInUsd === 'number'
                      ? `$${b.balanceInUsd.toFixed(2)}`
                      : '—'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No NFSC wallets linked.
            </p>
          )}
        </div>

        {/* Available payment methods */}
        <div className="mt-1">
          <h4 className="text-xs font-medium mb-2">
            Available payment methods
          </h4>
          {user.availablePaymentMethods &&
          user.availablePaymentMethods.length > 0 ? (
            <ul className="text-xs border rounded-md divide-y">
              {user.availablePaymentMethods.map((m, i) => (
                <li
                  key={`${m.kind}-${i}`}
                  className="px-3 py-2 flex items-center gap-2"
                >
                  {m.kind === 'STRIPE' ? (
                    <>
                      <span className="text-muted-foreground">Stripe</span>
                      <span className="font-mono">
                        {m.last4 ? `••${m.last4}` : '(no last4)'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground">Wallet</span>
                      <span className="font-mono text-[11px]">
                        <TruncatedTextWithHover maxLength={16}>
                          {m.walletAddress}
                        </TruncatedTextWithHover>
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              No payment methods on file.
            </p>
          )}
        </div>

        {/* Categorized domains */}
        {sections.map((s) => (
          <div key={s.label} className="mt-1">
            <h4 className={cn('text-xs font-medium mb-2', s.accent)}>
              {s.label}
            </h4>
            <div className="text-xs border rounded-md divide-y">
              {s.rows.map((r) => (
                <div
                  key={`${r.domain}-${r.status}`}
                  className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-3 py-2"
                >
                  <span className="font-mono truncate">{r.domain}</span>
                  <span className="font-mono text-right whitespace-nowrap">
                    {typeof r.chargeAmountUsd === 'number'
                      ? `$${r.chargeAmountUsd.toFixed(2)}`
                      : '—'}
                  </span>
                  <span
                    className="text-muted-foreground max-w-[260px] truncate"
                    title={r.errorReason || ''}
                  >
                    {r.errorReason || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Subworkflow link */}
        {(childWorkflowUrl || user.childWorkflowId) && (
          <div className="mt-3 pt-3 border-t">
            {childWorkflowUrl ? (
              <a
                href={childWorkflowUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:underline"
              >
                Open subworkflow in Temporal UI
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">
                Subworkflow ID:{' '}
                <span className="font-mono">{user.childWorkflowId}</span>
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DomainsTable({
  userResults,
  temporalUiNamespaceBase,
}: {
  userResults: UserResultItem[];
  /**
   * Base URL like `https://cloud.temporal.io/namespaces/default`. The
   * per-user snapshot modal appends `/workflows/{childWorkflowId}` to
   * link to the subworkflow's Temporal UI page.
   */
  temporalUiNamespaceBase: string | null;
}) {
  const userById = useMemo(() => {
    const map = new Map<string, UserResultItem>();
    for (const u of userResults) map.set(u.userId, u);
    return map;
  }, [userResults]);
  const [page, setPage] = useState(1);
  const [groupByUser, setGroupByUser] = useState(true);
  const [drizzlerFilterState, setDrizzlerFilterState] =
    useState<DrizzlerFilterState>({ columnFilters: {}, customFilters: {} });

  const {
    preferences: { columnVisibility, sorting, pageSize },
    setColumnVisibility,
    setSorting,
    setPageSize,
    resetToDefaults,
  } = useTablePreferences({
    tableId: 'admin-auto-renewal-domains-v2',
    defaultPreferences: {
      pageSize: 25,
      columnVisibility: { userId: false },
    },
  });

  // Flatten all user results into domain rows. Per-user snapshot fields
  // (balance, payment methods, shortfall) are duplicated onto every row
  // in the same group so the group header — which reads the first visible
  // row — can render them without a lookup map.
  const allDomains: DomainRow[] = useMemo(() => {
    const rows: DomainRow[] = [];
    for (const user of userResults) {
      const wallet = user.payments?.find((p) => p.walletAddress)?.walletAddress;
      const payments = user.payments?.map((p) => ({
        provider: p.provider,
        amountInUsdCents: p.amountInUsdCents,
        paymentProviderReferenceId: p.paymentProviderReferenceId,
      }));
      for (const d of user.domains) {
        rows.push({
          domain: d.domain,
          userId: user.userId,
          userEmail: user.userEmail,
          walletAddress: wallet,
          registrar: d.registrar,
          chainId: d.chainId,
          status: d.status,
          chargeAmountUsd: d.chargeAmountUsd,
          errorReason: d.errorReason,
          actionRequired: d.actionRequired,
          txHash: d.txHash,
          eppOperationStatus: d.eppOperationStatus,
          userPaymentStatus: user.paymentStatus,
          availableBalanceInNfsc: user.availableBalanceInNfsc,
          nfscBalancesByChain: user.nfscBalancesByChain,
          availablePaymentMethods: user.availablePaymentMethods,
          shortfallInUsdCents: user.shortfallInUsdCents,
          snapshotTakenAt: user.snapshotTakenAt,
          payments,
        });
      }
    }
    return rows;
  }, [userResults]);

  const grouping = useMemo(
    () => (groupByUser ? ['userId'] : undefined),
    [groupByUser],
  );

  // Expand the first user group by default. This is captured once at mount
  // and never re-derived, so it doesn't depend on filter/pagination state.
  const initialExpanded = useMemo<ExpandedState>(() => {
    if (allDomains.length === 0) return {};
    const firstUserId = allDomains[0].userId;
    return { [`userId:${firstUserId}`]: true };
  }, [allDomains]);

  const [expanded, setExpanded] = useState<ExpandedState>(initialExpanded);

  const renderGroupHeader = useCallback(
    (row: Row<DomainRow>) => {
      const userId = String(row.getGroupingValue('userId'));

      // Derive header data from the rows actually visible in this group
      // (which already reflect the current filter + pagination state).
      // Falls back to leaf rows if the group hasn't been expanded yet.
      const visibleRows: Array<Row<DomainRow>> =
        row.subRows.length > 0 ? row.subRows : row.getLeafRows();
      const first = visibleRows[0]?.original;

      let successCount = 0;
      let failedCount = 0;
      let deferredCount = 0;
      let totalChargedInUsd = 0;
      // Required includes deferred rows (what the user *wanted* to renew,
      // before any subset trimming) so the header can contrast
      // "needed vs. had".
      let totalRequiredInUsd = 0;
      for (const r of visibleRows) {
        if (r.original.status === 'SUCCESS') {
          successCount++;
        } else if (r.original.status === 'SKIPPED_INSUFFICIENT_FUNDS') {
          deferredCount++;
        } else {
          failedCount++;
        }
        totalRequiredInUsd += r.original.chargeAmountUsd ?? 0;
        // Only count actually-charged rows toward the user total —
        // deferred rows did not incur a charge.
        if (r.original.status !== 'SKIPPED_INSUFFICIENT_FUNDS') {
          totalChargedInUsd += r.original.chargeAmountUsd ?? 0;
        }
      }

      const info = first
        ? {
            email: first.userEmail,
            walletAddress: first.walletAddress,
            paymentStatus: first.userPaymentStatus,
            domainCount: visibleRows.length,
            successCount,
            failedCount,
            deferredCount,
            totalAmountInUsd: totalChargedInUsd,
            totalRequiredInUsd,
            refundAmountInUsd: 0, // refunds are user-level and not represented per-row
            availableBalanceInNfsc: first.availableBalanceInNfsc,
            availablePaymentMethods: first.availablePaymentMethods,
            shortfallInUsdCents: first.shortfallInUsdCents,
          }
        : undefined;

      const allPaymentFailed =
        info?.paymentStatus === 'FAILED' &&
        info.failedCount === info.domainCount;
      const shortfallInUsd =
        info?.shortfallInUsdCents && info.shortfallInUsdCents > 0
          ? info.shortfallInUsdCents / 100
          : 0;
      const paymentMethodsLabel = (() => {
        if (!info?.availablePaymentMethods?.length) return null;
        return info.availablePaymentMethods
          .map((method) => {
            if (method.kind === 'STRIPE') {
              return method.last4 ? `Stripe ••${method.last4}` : 'Stripe';
            }
            const short = method.walletAddress
              ? `${method.walletAddress.slice(0, 6)}…${method.walletAddress.slice(-4)}`
              : 'Wallet';
            return `Wallet ${short}`;
          })
          .join(' · ');
      })();
      const netAmount =
        (info?.totalAmountInUsd ?? 0) - (info?.refundAmountInUsd ?? 0);
      const isExpanded = row.getIsExpanded();

      return (
        <div
          className={cn(
            'grid grid-cols-[350px_1fr_auto_auto] items-center gap-x-3 gap-y-0 text-sm w-full py-2  hover:opacity-100',
            isExpanded ? 'opacity-30' : 'opacity-60',
          )}
        >
          {/* Col 1: avatar + user + balance/payment snapshot */}
          <div className="flex items-center gap-2 min-w-0">
            {info?.walletAddress && (
              <UserWalletAvatar
                address={info.walletAddress}
                adminOpenTarget="wallet"
                userId={userId}
                className="size-6 shrink-0"
              />
            )}
            <div className="flex flex-col min-w-0">
              <AdminUserLookupButton
                reference={{ userId }}
                variant="ghost"
                size="sm"
                className="h-auto px-1 py-0 font-medium text-sm hover:underline justify-start"
              >
                {info?.email || <code className="text-xs">{userId}</code>}
              </AdminUserLookupButton>
              {info &&
                (typeof info.availableBalanceInNfsc === 'number' ||
                  paymentMethodsLabel) && (
                  // Multi-line — wraps naturally instead of truncating.
                  // The subtitle can span 2–3 lines without overflowing
                  // the 350px col-1 width, and the "Details" dialog has
                  // the full breakdown when a single line of context
                  // isn't enough.
                  <span className="text-[11px] text-muted-foreground whitespace-normal leading-snug px-1">
                    {typeof info.availableBalanceInNfsc === 'number' && (
                      <>Balance ${info.availableBalanceInNfsc.toFixed(2)}</>
                    )}
                    {/*
                    When any domain was deferred (partial or full),
                    show the total required bill and the shortfall so
                    on-call can see needed vs. had without computing
                    it themselves. `shortfallInUsdCents` is the user's
                    aggregate run-total shortfall (not per-row).
                  */}
                    {(info.deferredCount > 0 || shortfallInUsd > 0) &&
                      info.totalRequiredInUsd > 0 && (
                        <>
                          {' · Needed $'}
                          {info.totalRequiredInUsd.toFixed(2)}
                          {shortfallInUsd > 0 && (
                            <>
                              {' · '}
                              <span className="text-amber-300/80 font-medium">
                                Short ${shortfallInUsd.toFixed(2)}
                              </span>
                            </>
                          )}
                        </>
                      )}
                    {typeof info.availableBalanceInNfsc === 'number' &&
                      paymentMethodsLabel &&
                      ' · '}
                    {paymentMethodsLabel && <>Pays via {paymentMethodsLabel}</>}
                  </span>
                )}
            </div>
          </div>

          {/* Col 2: domain count + details dialog + status */}
          <div className="flex justify-start items-start gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="text-xs min-w-[15ch] w-[15ch] font-mono"
            >
              {row.subRows.length}{' '}
              {row.subRows.length === 1 ? 'domain' : 'domains'}
            </Badge>
            {(() => {
              const userForDialog = userById.get(userId);
              if (!userForDialog) return null;
              const rowsForDialog = visibleRows.map((r) => r.original);
              return (
                <UserSnapshotDialog
                  user={userForDialog}
                  rows={rowsForDialog}
                  temporalUiNamespaceBase={temporalUiNamespaceBase}
                />
              );
            })()}
            {allPaymentFailed ? (
              <>
                <Badge
                  variant="outline"
                  className="text-xs border-amber-300/80 text-amber-300/80 min-w-[15ch] w-[15ch]"
                >
                  No payment
                </Badge>
                {info?.email &&
                  (() => {
                    const domains = row.subRows
                      .map((r) => r.original.domain)
                      .filter(Boolean);
                    const failureLines = row.subRows
                      .map(
                        (r) =>
                          `- ${r.original.domain}${
                            r.original.errorReason
                              ? ` — ${r.original.errorReason}`
                              : ''
                          }`,
                      )
                      .join('\n');
                    const total = (info.totalAmountInUsd ?? 0).toFixed(2);
                    const subject = `Auto-renewal payment failed for ${domains.length} ${domains.length === 1 ? 'domain' : 'domains'}`;
                    const body =
                      'Hi,\n\n' +
                      `Your auto-renewal attempt for the following ${domains.length === 1 ? 'domain' : 'domains'} could not be completed because we were unable to charge your payment method.\n\n` +
                      `Total required: $${total}\n\n` +
                      `Affected domains:\n${failureLines}\n\n` +
                      'Please update your payment method or contact us to resolve this so we can complete the renewal.\n\n' +
                      'Thank you.';
                    const href = `mailto:${info.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    return (
                      <a href={href} onClick={(e) => e.stopPropagation()}>
                        <Badge
                          variant="outline"
                          className="text-xs border-blue-300 text-blue-300 hover:bg-blue-300/10 cursor-pointer"
                        >
                          Contact user about payment
                        </Badge>
                      </a>
                    );
                  })()}
              </>
            ) : (
              <>
                {(info?.successCount ?? 0) > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs border-green-300/80 text-green-300/80 min-w-[15ch] w-[15ch]"
                  >
                    {info!.successCount} success
                  </Badge>
                )}
                {(info?.failedCount ?? 0) > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs border-red-300/80 text-red-300/80 min-w-[15ch] w-[15ch]"
                  >
                    {info!.failedCount} failure
                  </Badge>
                )}
                {(info?.deferredCount ?? 0) > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs border-amber-300/80 text-amber-300/80 min-w-[15ch] w-[15ch]"
                  >
                    {info!.deferredCount} deferred
                  </Badge>
                )}
                {shortfallInUsd > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs border-amber-300/80 text-amber-300/80"
                  >
                    Short ${shortfallInUsd.toFixed(2)}
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* Col 3: amounts */}
          <span className="text-xs text-muted-foreground text-right whitespace-nowrap">
            {allPaymentFailed ? (
              <>
                ${(info?.totalAmountInUsd ?? 0).toFixed(2)}{' '}
                <span className="text-red-300">required</span>
              </>
            ) : (
              <>
                ${(info?.totalAmountInUsd ?? 0).toFixed(2)} charged
                {(info?.refundAmountInUsd ?? 0) > 0 && (
                  <> / ${info!.refundAmountInUsd.toFixed(2)} refunded</>
                )}
              </>
            )}
          </span>

          {/* Col 4: net */}
          <span className="text-xs text-right whitespace-nowrap w-[80px]">
            {allPaymentFailed ? (
              <span className="text-red-300">$0.00 net</span>
            ) : netAmount > 0 ? (
              <span className="text-green-300">
                ${netAmount.toFixed(2)} net
              </span>
            ) : (
              <span className="text-muted-foreground">$0.00 net</span>
            )}
          </span>
        </div>
      );
    },
    [userById, temporalUiNamespaceBase],
  );

  const drizzlerFilterOptions = useMemo(
    () =>
      convertToDrizzlerFilterOptions<DomainRow>(
        drizzlerFilterState.columnFilters,
      ),
    [drizzlerFilterState],
  );

  const filteredDomains = useMemo(() => {
    if (!drizzlerFilterOptions) return allDomains;
    return applyDrizzlerFilterOnDataset(
      allDomains,
      drizzlerFilterOptions,
    ) as DomainRow[];
  }, [allDomains, drizzlerFilterOptions]);

  const sortAccessors: Record<string, (row: DomainRow) => unknown> = useMemo(
    () => ({
      domain: (r) => r.domain,
      userId: (r) => r.userId,
      userEmail: (r) => r.userEmail ?? '',
      status: (r) => r.status,
      registrar: (r) => r.registrar ?? '',
      chargeAmountUsd: (r) => r.chargeAmountUsd ?? 0,
      payments: (r) => r.payments?.map((p) => p.provider).join(',') ?? '',
      errorReason: (r) => r.errorReason ?? '',
      actionRequired: (r) => r.actionRequired ?? '',
    }),
    [],
  );

  const sortedDomains = useMemo(
    () => applyClientSideSorting(filteredDomains, sorting, sortAccessors),
    [filteredDomains, sorting, sortAccessors],
  );

  // When grouping by user, pagination is disabled and the table shows all
  // sorted rows so groups are never split across pages. Otherwise we slice
  // into the requested page.
  const totalPages = groupByUser
    ? 1
    : Math.max(1, Math.ceil(sortedDomains.length / pageSize));
  const paginatedDomains = useMemo(() => {
    if (groupByUser) return sortedDomains;
    const start = (page - 1) * pageSize;
    return sortedDomains.slice(start, start + pageSize);
  }, [sortedDomains, page, pageSize, groupByUser]);

  // Unique user IDs that have at least one row visible on the current page.
  // Used so "Expand All" only targets groups actually rendered, and so the
  // toggle reflects only what the user can currently see.
  const allUserIds = useMemo(
    () => [...new Set(paginatedDomains.map((d) => d.userId))],
    [paginatedDomains],
  );

  const allExpanded = useMemo(() => {
    if (typeof expanded === 'boolean') return expanded;
    if (allUserIds.length === 0) return false;
    return allUserIds.every((id) => expanded[`userId:${id}`]);
  }, [expanded, allUserIds]);

  const toggleExpandAll = useCallback(() => {
    if (allExpanded) {
      setExpanded({});
    } else {
      const next: Record<string, boolean> = {};
      for (const id of allUserIds) {
        next[`userId:${id}`] = true;
      }
      setExpanded(next);
    }
  }, [allExpanded, allUserIds]);

  const filterStrategy = useDrizzlerServerFilterStrategy<DomainRow>({
    filterConfig: {
      domain: {
        id: 'domain',
        label: 'Domain',
        type: 'text',
        columnId: 'domain',
      },
      userId: {
        id: 'userId',
        label: 'Owner ID',
        type: 'text',
        columnId: 'userId',
      },
      userEmail: {
        id: 'userEmail',
        label: 'Owner Email',
        type: 'text',
        columnId: 'userEmail',
      },
      status: {
        id: 'status',
        label: 'Status',
        type: 'select',
        columnId: 'status',
        options: [
          { value: 'SUCCESS', label: 'Success' },
          { value: 'FAILED', label: 'Failed' },
          { value: 'PAYMENT_FAILED', label: 'Payment Failed' },
          {
            value: 'SKIPPED_INSUFFICIENT_FUNDS',
            label: 'Deferred — Low Balance',
          },
          { value: 'MISSING_PRICE', label: 'Missing Price' },
        ],
        allowedOperators: ['eq', 'neq'],
      },
      registrar: {
        id: 'registrar',
        label: 'Registrar',
        type: 'text',
        columnId: 'registrar',
      },
      actionRequired: {
        id: 'actionRequired',
        label: 'Action Required',
        type: 'select',
        columnId: 'actionRequired',
        options: [
          { value: 'Check pricing data', label: 'Check Pricing Data' },
          { value: 'Unlock domain and retry', label: 'Unlock Domain' },
          { value: 'Retry renewal', label: 'Retry Renewal' },
          { value: 'Check registrar API', label: 'Check Registrar API' },
          {
            value: 'Wait for transfer period to end',
            label: 'Wait for Transfer Period',
          },
          { value: 'Domain already expired', label: 'Domain Already Expired' },
          {
            value: 'Contact user about payment',
            label: 'Contact User (Payment)',
          },
          {
            value: 'Top up balance or wait for next cycle',
            label: 'Top Up Balance',
          },
          {
            value: 'Manual investigation required',
            label: 'Manual Investigation',
          },
        ],
        allowedOperators: ['eq', 'neq'],
      },
    },
    onDrizzlerFilterChange: (newState: DrizzlerFilterState) => {
      setDrizzlerFilterState(newState);
      setPage(1);
    },
  });

  const columns: ColumnDef<DomainRow>[] = useMemo(
    () => [
      {
        id: 'domain',
        accessorKey: 'domain',
        header: 'Domain',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.domain}</span>
        ),
      },
      {
        id: 'walletAddress',
        accessorKey: 'walletAddress',
        header: 'Wallet',
        cell: ({ row }) =>
          row.original.walletAddress ? (
            <UserWalletAvatar
              address={row.original.walletAddress}
              adminOpenTarget="wallet"
              userId={row.original.userId}
              className="size-6"
            />
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          ),
      },
      {
        id: 'userEmail',
        accessorKey: 'userEmail',
        header: 'Owner Email',
        cell: ({ row }) =>
          row.original.userEmail ? (
            <AdminUserLookupButton
              reference={{ userId: row.original.userId }}
              variant="ghost"
              size="sm"
              className="h-auto px-0 py-0 text-xs hover:underline justify-start max-w-[200px]"
            >
              <TruncatedTextWithHover maxLength={24}>
                {row.original.userEmail}
              </TruncatedTextWithHover>
            </AdminUserLookupButton>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          ),
      },
      {
        id: 'userId',
        accessorKey: 'userId',
        header: 'Owner ID',
        cell: ({ row }) => (
          <AdminUserLookupButton
            reference={{ userId: row.original.userId }}
            variant="ghost"
            size="sm"
            className="h-auto px-0 py-0 text-xs font-mono hover:underline justify-start max-w-[140px]"
          >
            <TruncatedTextWithHover maxLength={12}>
              {row.original.userId}
            </TruncatedTextWithHover>
          </AdminUserLookupButton>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            {getStatusBadge(row.original.status)}
          </div>
        ),
      },
      {
        id: 'registrar',
        accessorKey: 'registrar',
        header: 'Registrar',
        cell: ({ row }) => (
          <span className="text-sm">
            {formatRegistrar(row.original.registrar)}
          </span>
        ),
      },
      {
        id: 'chargeAmountUsd',
        accessorKey: 'chargeAmountUsd',
        header: 'Charge (USD)',
        cell: ({ row }) => (
          <span className="text-sm font-mono">
            {formatUsd(row.original.chargeAmountUsd)}
          </span>
        ),
      },
      {
        id: 'payments',
        accessorKey: 'payments',
        header: 'Payment',
        cell: ({ row }) => {
          const payments = row.original.payments;
          if (!payments || payments.length === 0)
            return <span className="text-xs text-muted-foreground">-</span>;
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              {payments.map((p, i) => {
                const url = getPaymentExplorerUrl(
                  p.provider,
                  p.paymentProviderReferenceId,
                  row.original.txHash,
                  row.original.chainId,
                );
                const inner = (
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-muted-foreground">{p.provider}</span>
                    <span className="font-mono">
                      ${(p.amountInUsdCents / 100).toFixed(2)}
                    </span>
                    {url && <ExternalLink className="h-3 w-3 opacity-60" />}
                  </span>
                );
                return url ? (
                  <a
                    key={`${p.provider}-${i}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:underline text-blue-300"
                    title={`View on ${p.provider === 'STRIPE' ? 'Stripe dashboard' : 'block explorer'}`}
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={`${p.provider}-${i}`}>{inner}</div>
                );
              })}
            </div>
          );
        },
      },
      {
        id: 'errorReason',
        accessorKey: 'errorReason',
        header: 'Error / Action',
        cell: ({ row }) => {
          if (!row.original.errorReason)
            return <span className="text-sm">-</span>;
          const isContactAction =
            row.original.actionRequired === 'Contact user about payment';
          const canEmail = isContactAction && row.original.userEmail;
          return (
            <div className="flex flex-col gap-0.5 max-w-[250px]">
              <span className="text-xs text-red-400">
                <TruncatedTextWithHover maxLength={40}>
                  {row.original.errorReason}
                </TruncatedTextWithHover>
              </span>
              {row.original.actionRequired &&
                (canEmail ? (
                  (() => {
                    const subject = `Domain Renewal Issue: ${row.original.domain}`;
                    const body =
                      'Hi,\n\n' +
                      `We noticed an issue with the renewal of your domain ${row.original.domain}.\n\n` +
                      `Reason: ${row.original.errorReason ?? 'Unknown'}\n\n` +
                      'Please contact us if you need assistance.';
                    const params = new URLSearchParams({ subject, body });
                    const href = `mailto:${row.original.userEmail}?${params.toString()}`;
                    return (
                      <a href={href} onClick={(e) => e.stopPropagation()}>
                        <Badge
                          variant="outline"
                          className="text-xs w-fit border-blue-300 text-blue-300 hover:bg-blue-300/10 cursor-pointer"
                        >
                          {row.original.actionRequired}
                        </Badge>
                      </a>
                    );
                  })()
                ) : (
                  <Badge variant="outline" className="text-xs w-fit">
                    {row.original.actionRequired}
                  </Badge>
                ))}
            </div>
          );
        },
      },
      {
        id: 'txHash',
        accessorKey: 'txHash',
        header: 'Tx Hash',
        cell: ({ row }) => {
          if (!row.original.txHash) return <span className="text-sm">-</span>;
          const hash = row.original.txHash;
          const url = row.original.chainId
            ? getTransactionExplorerUrl(row.original.chainId, hash)
            : null;
          return (
            <div className="flex items-center gap-1 max-w-[160px]">
              <span className="font-mono text-xs flex-1 min-w-0">
                <AutoTruncateTextV2
                  initialCharactersCountToDisplay={8}
                  minCharactersToDisplay={8}
                >
                  {hash}
                </AutoTruncateTextV2>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                title="Copy tx hash"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await navigator.clipboard.writeText(hash);
                    toast.success('Copied tx hash');
                  } catch {
                    toast.error('Failed to copy');
                  }
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="View on explorer"
                  className="flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">
              Domains ({filteredDomains.length} of {allDomains.length})
            </CardTitle>
            <CardDescription>
              All domains processed in this auto-renewal run, grouped by owner.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={groupByUser ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setGroupByUser((v) => !v);
                setPage(1);
              }}
              className="text-xs"
            >
              Group by Owner
            </Button>
            {groupByUser && allUserIds.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleExpandAll}
                className="text-xs"
              >
                {allExpanded ? 'Collapse All' : 'Expand All'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ExtensibleDataTable<DomainRow, typeof filterStrategy>
          columns={columns}
          data={paginatedDomains}
          filterStrategy={filterStrategy}
          sorting={sorting}
          onSortingChange={setSorting}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          totalCount={filteredDomains.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPage(1);
            setPageSize(size);
          }}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          onResetPreferences={resetToDefaults}
          grouping={grouping}
          groupedColumnMode={false}
          renderGroupHeader={renderGroupHeader}
          expanded={expanded}
          onExpandedChange={setExpanded}
          paginationVisibility={groupByUser ? 'hidden' : 'always'}
          emptyMessage="No domains in this run"
        />
      </CardContent>
    </Card>
  );
}

// ─── Critical Issues Card ────────────────────────────────────────

function CriticalIssuesCard({
  criticalDomains,
}: {
  criticalDomains: Array<{
    domain: string;
    userId: string;
    userEmail?: string;
    issue: string;
    registrar?: string;
    actionRequired: string;
  }>;
}) {
  // Group by actionRequired
  const grouped = useMemo(() => {
    const map = new Map<string, typeof criticalDomains>();
    for (const d of criticalDomains) {
      const key = d.actionRequired;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return Array.from(map.entries());
  }, [criticalDomains]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          Critical Issues ({criticalDomains.length})
        </CardTitle>
        <CardDescription>
          Domains that require manual action from the team.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {grouped.map(([action, domains]) => (
          <div key={action}>
            <h4 className="text-sm font-medium mb-2">
              {action}{' '}
              <span className="text-muted-foreground">({domains.length})</span>
            </h4>
            <div className="rounded border divide-y text-xs">
              {domains.slice(0, 20).map((d, i) => (
                <div
                  key={`${d.domain}-${i}`}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <span className="font-mono">{d.domain}</span>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>{d.userEmail || d.userId}</span>
                    <span>{formatRegistrar(d.registrar)}</span>
                  </div>
                </div>
              ))}
              {domains.length > 20 && (
                <div className="px-3 py-2 text-muted-foreground">
                  ...and {domains.length - 20} more
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── System Health Card ──────────────────────────────────────────

function SystemHealthCard({ metrics }: { metrics: MetricsShape }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">System Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Execution Time</p>
            <p className="font-medium">
              {formatDuration(metrics.executionMetrics?.totalExecutionTime)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg Time / User</p>
            <p className="font-medium">
              {metrics.executionMetrics?.averageTimePerUser
                ? `${(metrics.executionMetrics.averageTimePerUser / 1000).toFixed(1)}s`
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Child Workflows</p>
            <p className="font-medium">
              {metrics.executionMetrics?.childWorkflowsSpawned ?? '-'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Emails Sent</p>
            <p className="font-medium">
              {(metrics.userCommunication?.upcomingRenewalNotifications ?? 0) +
                (metrics.userCommunication?.successfulRenewalConfirmations ??
                  0) +
                (metrics.userCommunication?.failedRenewalAlerts ?? 0) +
                (metrics.userCommunication?.paymentFailureNotifications ?? 0)}
            </p>
          </div>
        </div>

        {/* Financial summary */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Charged</p>
            <p className="font-medium">
              {formatUsd(metrics.totalAmountChargedInUsd)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Refunded</p>
            <p className="font-medium">
              {formatUsd(metrics.totalAmountRefundedInUsd)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Failure Breakdown</p>
            <p className="font-medium text-xs">
              Charge: {metrics.failureBreakdown?.failedToCharge ?? 0} &middot;
              Registrar: {metrics.failureBreakdown?.registrarErrors ?? 0}{' '}
              &middot; Price: {metrics.failureBreakdown?.missingPriceData ?? 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
