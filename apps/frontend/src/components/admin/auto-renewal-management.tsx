'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
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
  Copy,
} from 'lucide-react';
import Link from 'next/link';
import { PageShell } from '@/components/page-shell';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useDrizzlerServerFilterStrategy,
  convertToDrizzlerFilterOptions,
  applyClientSideSorting,
  type DrizzlerFilterState,
} from '@/components/table/filters';
import { applyDrizzlerFilterOnDataset } from '@samyx/drizzler-filters-sorters/experimental';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────

type DomainRow = {
  domain: string;
  userId: string;
  userEmail?: string;
  registrar?: string;
  status: 'SUCCESS' | 'FAILED' | 'PAYMENT_FAILED' | 'MISSING_PRICE';
  chargeAmountUsd?: number | null;
  errorReason?: string;
  actionRequired?: string;
  txHash?: string;
  eppOperationStatus?: string;
  paymentProviders?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────

function getStatusBadge(status: DomainRow['status']) {
  switch (status) {
    case 'SUCCESS':
      return (
        <Badge variant="default" className="gap-1 bg-green-500">
          <CheckCircle2 className="w-3 h-3" />
          Success
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" />
          Failed
        </Badge>
      );
    case 'PAYMENT_FAILED':
      return (
        <Badge className="gap-1 bg-yellow-600 text-white">
          <AlertTriangle className="w-3 h-3" />
          Payment Failed
        </Badge>
      );
    case 'MISSING_PRICE':
      return (
        <Badge className="gap-1 bg-orange-500 text-white">
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
              <code className="text-xs text-muted-foreground">
                {workflowId}
              </code>
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

        {/* KPI Cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
              label="Domains Failed"
              value={metrics.failedRenewals}
              icon={XCircle}
              variant={metrics.failedRenewals > 0 ? 'danger' : 'default'}
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
              label="Success Rate"
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
        {userResults && <DomainsTable userResults={userResults} />}

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
  };
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
  domains: Array<{
    domain: string;
    registrar?: string;
    status: 'SUCCESS' | 'FAILED' | 'PAYMENT_FAILED' | 'MISSING_PRICE';
    chargeAmountUsd?: number | null;
    errorReason?: string;
    actionRequired?: string;
    txHash?: string;
    eppOperationStatus?: string;
  }>;
  payments: Array<{
    provider: string;
    amountInUsdCents: number;
    walletAddress?: string;
    stripeLast4?: string;
  }>;
};

function DomainsTable({ userResults }: { userResults: UserResultItem[] }) {
  const [page, setPage] = useState(1);
  const [drizzlerFilterState, setDrizzlerFilterState] =
    useState<DrizzlerFilterState>({ columnFilters: {}, customFilters: {} });

  const {
    preferences: { columnVisibility, sorting, pageSize },
    setColumnVisibility,
    setSorting,
    setPageSize,
    resetToDefaults,
  } = useTablePreferences({
    tableId: 'admin-auto-renewal-domains',
    defaultPreferences: { pageSize: 25 },
  });

  // Flatten all user results into domain rows
  const allDomains: DomainRow[] = useMemo(() => {
    const rows: DomainRow[] = [];
    for (const user of userResults) {
      const providers = user.payments?.map((p) => p.provider).join(', ') || '';
      for (const d of user.domains) {
        rows.push({
          domain: d.domain,
          userId: user.userId,
          userEmail: user.userEmail,
          registrar: d.registrar,
          status: d.status,
          chargeAmountUsd: d.chargeAmountUsd,
          errorReason: d.errorReason,
          actionRequired: d.actionRequired,
          txHash: d.txHash,
          eppOperationStatus: d.eppOperationStatus,
          paymentProviders: providers,
        });
      }
    }
    return rows;
  }, [userResults]);

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
      paymentProviders: (r) => r.paymentProviders ?? '',
      errorReason: (r) => r.errorReason ?? '',
      actionRequired: (r) => r.actionRequired ?? '',
    }),
    [],
  );

  const sortedDomains = useMemo(
    () => applyClientSideSorting(filteredDomains, sorting, sortAccessors),
    [filteredDomains, sorting, sortAccessors],
  );

  const totalPages = Math.max(1, Math.ceil(sortedDomains.length / pageSize));
  const paginatedDomains = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedDomains.slice(start, start + pageSize);
  }, [sortedDomains, page, pageSize]);

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

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied');
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

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
        id: 'userId',
        accessorKey: 'userId',
        header: 'Owner',
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <code className="text-xs truncate max-w-[120px]">
                {row.original.userId}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => handleCopy(row.original.userId)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            {row.original.userEmail && (
              <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                {row.original.userEmail}
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.original.status),
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
        id: 'paymentProviders',
        accessorKey: 'paymentProviders',
        header: 'Payment',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.paymentProviders || '-'}
          </span>
        ),
      },
      {
        id: 'errorReason',
        accessorKey: 'errorReason',
        header: 'Error / Action',
        cell: ({ row }) => {
          if (!row.original.errorReason)
            return <span className="text-sm">-</span>;
          return (
            <div className="flex flex-col gap-0.5 max-w-[250px]">
              <span className="text-xs text-red-400 truncate">
                {row.original.errorReason}
              </span>
              {row.original.actionRequired && (
                <Badge variant="outline" className="text-xs w-fit">
                  {row.original.actionRequired}
                </Badge>
              )}
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
          return (
            <code className="text-xs truncate max-w-[100px] block">
              {row.original.txHash.slice(0, 10)}...
            </code>
          );
        },
      },
    ],
    [handleCopy],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          Domains ({filteredDomains.length} of {allDomains.length})
        </CardTitle>
        <CardDescription>
          All domains processed in this auto-renewal run, grouped by owner.
        </CardDescription>
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
