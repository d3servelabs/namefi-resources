'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounceValue } from 'usehooks-ts';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  MinusCircle,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type { z } from 'zod';
import type { parkedDomainVerificationSchema } from '@namefi-astra/common/contract/admin/admin-parked-domains-contract';
import { Permission } from '@namefi-astra/utils/permissions';
import { AdminGuard } from '@/components/admin/admin-guard';
import { PermissionGate } from '@/components/access/PermissionGate';
import { PageShell } from '@/components/page-shell';
import { useTRPC } from '@/lib/trpc';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import {
  convertToDrizzlerFilterOptions,
  useDrizzlerServerFilterStrategy,
  type DrizzlerFilterState,
} from '@/components/table/filters';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { AsyncButton } from '@/components/buttons/async-button';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { AddressWithChain as AddressWithChainId } from '@/components/address-with-chain';
import { AdminDomainDetailsButton } from '@/components/admin/domain-details';

type VerificationResult = z.infer<typeof parkedDomainVerificationSchema>;
type CheckStatus = VerificationResult['overall'];

type ParkedDomainRow = {
  normalizedDomainName: string;
  ownerAddress: string | null;
  chainId: number;
  forwardTo: string | null;
  mode: 'park' | 'forward';
};

/** Verify domains in batches that respect the contract's per-call cap. */
const VERIFY_BATCH_SIZE = 50;

const STATUS_META: Record<
  CheckStatus,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  pass: {
    label: 'Pass',
    className: 'bg-green-100 text-green-800 border-green-300',
    Icon: CheckCircle2,
  },
  warn: {
    label: 'Warn',
    className: 'bg-amber-100 text-amber-800 border-amber-300',
    Icon: AlertTriangle,
  },
  fail: {
    label: 'Fail',
    className: 'bg-red-100 text-red-800 border-red-300',
    Icon: XCircle,
  },
  skipped: {
    label: 'N/A',
    className: 'bg-muted text-muted-foreground border-border',
    Icon: MinusCircle,
  },
};

function StatusBadge({
  status,
  detail,
}: {
  status?: CheckStatus;
  detail?: string;
}) {
  if (!status) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const meta = STATUS_META[status];
  const Icon = meta.Icon;
  const badge = (
    <Badge variant="outline" className={cn('w-fit gap-1', meta.className)}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
  if (!detail) return badge;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className="cursor-help" />}>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{detail}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function CheckRow({
  label,
  status,
  detail,
}: {
  label: string;
  status: CheckStatus;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-16 shrink-0 font-medium">{label}</span>
      <StatusBadge status={status} />
      <span className="flex-1 text-muted-foreground">{detail}</span>
    </div>
  );
}

function VerificationDetailDialog({ result }: { result: VerificationResult }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        Details
      </DialogTrigger>
      <DialogContent className="!max-w-2xl">
        <DialogHeader>
          <DialogTitle className="break-all">{result.domain}</DialogTitle>
          <DialogDescription>
            {result.mode === 'forward'
              ? `Forward → ${result.forwardTo}`
              : 'Parking page'}{' '}
            · checked {new Date(result.checkedAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <CheckRow
            label="DNS"
            status={result.dns.status}
            detail={result.dns.detail}
          />
          <div className="space-y-0.5 pl-4 text-xs text-muted-foreground">
            <div>
              Expected A {result.dns.expected.a} · AAAA{' '}
              {result.dns.expected.aaaa}
            </div>
            <div>
              Observed A {result.dns.observed.a.join(', ') || '—'} · AAAA{' '}
              {result.dns.observed.aaaa.join(', ') || '—'}
            </div>
            {result.dns.gateEnabled ? (
              <div>
                Gate TXT {result.dns.gateTxtPresent ? 'present' : 'missing'}
              </div>
            ) : null}
            {result.dns.redirectTxt ? (
              <div>Redirect TXT → {result.dns.redirectTxt}</div>
            ) : null}
          </div>
          <CheckRow
            label="SSL"
            status={result.ssl.status}
            detail={result.ssl.detail}
          />
          {result.ssl.validTo ? (
            <div className="pl-4 text-xs text-muted-foreground">
              Issuer {result.ssl.issuer ?? '—'} · expires{' '}
              {new Date(result.ssl.validTo).toLocaleDateString()} (
              {result.ssl.daysUntilExpiry} days)
            </div>
          ) : null}
          <CheckRow
            label="Serving"
            status={result.serving.status}
            detail={result.serving.detail}
          />
          <CheckRow
            label="Redirect"
            status={result.redirect.status}
            detail={result.redirect.detail}
          />
          {result.redirect.redirectChain.length > 0 ? (
            <div className="space-y-0.5 pl-4 text-xs text-muted-foreground">
              {result.redirect.redirectChain.map((hop) => (
                <div key={`${hop.status}-${hop.location}`}>
                  {hop.status} → {hop.location}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ParkedDomainsAdminPage() {
  return (
    <AdminGuard accessDeniedMessage="You are not an admin.">
      <PermissionGate
        permissions={[Permission.READ_PARKED_DOMAINS]}
        loadingFallback={null}
      >
        <ParkedDomainsPage />
      </PermissionGate>
      <PermissionGate
        gateMode="inverted"
        permissions={[Permission.READ_PARKED_DOMAINS]}
        loadingFallback={null}
      >
        <PageShell padding="admin" className="py-6">
          <div>You do not have permission to access this page.</div>
        </PageShell>
      </PermissionGate>
    </AdminGuard>
  );
}

function ParkedDomainsPage() {
  return (
    <PageShell padding="admin" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Parked Domains</h1>
        <p className="text-muted-foreground">
          Verify that parked domains have propagated DNS, a valid certificate,
          are serving the parking page, and (for forwards) redirect correctly.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Verification runs live network probes on demand — verify a single row,
          a checkbox selection, the visible page, or all parked domains. A
          weekly job emails the full report.
        </p>
      </div>
      <ParkedDomainsTable />
    </PageShell>
  );
}

function ParkedDomainsTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const {
    preferences: { sorting, pageSize, columnVisibility },
    setSorting,
    setPageSize,
    setColumnVisibility,
    resetToDefaults,
  } = useTablePreferences({
    tableId: 'admin-parked-domains',
    defaultPreferences: {
      sorting: [{ id: 'normalizedDomainName', desc: false }],
      pageSize: 25,
      columnVisibility: {},
    },
  });

  const [results, setResults] = useState<Record<string, VerificationResult>>(
    {},
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [drizzlerFilterState, setDrizzlerFilterState] =
    useState<DrizzlerFilterState>({ columnFilters: {}, customFilters: {} });
  const [debouncedDrizzlerFilterState] = useDebounceValue(
    drizzlerFilterState,
    500,
  );

  const backendFilters = useMemo(
    () =>
      convertToDrizzlerFilterOptions(
        debouncedDrizzlerFilterState.columnFilters,
      ),
    [debouncedDrizzlerFilterState],
  );
  const backendSorting = useMemo(() => {
    if (!sorting || sorting.length === 0) return undefined;
    return sorting.map((s) => ({
      column: s.id,
      order: s.desc ? ('desc' as const) : ('asc' as const),
    }));
  }, [sorting]);

  const query = useQuery(
    trpc.admin.parkedDomains.listParkedDomains.queryOptions(
      { page, pageSize, filters: backendFilters, sorting: backendSorting },
      { placeholderData: (prev) => prev },
    ),
  );

  const verifyMutation = useMutation(
    trpc.admin.parkedDomains.verifyParkedDomains.mutationOptions({
      onSuccess: (data) => {
        setResults((prev) => {
          const next = { ...prev };
          for (const result of data.results) next[result.domain] = result;
          return next;
        });
      },
      onError: (error) => {
        toast.error('Verification failed', { description: error.message });
      },
    }),
  );

  const verifyDomains = useCallback(
    async (domains: string[]) => {
      if (domains.length === 0) return;
      for (let i = 0; i < domains.length; i += VERIFY_BATCH_SIZE) {
        await verifyMutation.mutateAsync({
          domains: domains.slice(i, i + VERIFY_BATCH_SIZE),
        });
      }
    },
    [verifyMutation],
  );

  const rows = (query.data?.data ?? []) as ParkedDomainRow[];
  const visibleDomains = useMemo(
    () => rows.map((row) => row.normalizedDomainName),
    [rows],
  );
  const verifiedCount = visibleDomains.filter((d) => results[d]).length;
  const selectedCount = selected.size;
  const allVisibleSelected =
    visibleDomains.length > 0 && visibleDomains.every((d) => selected.has(d));

  const toggleRow = useCallback((domain: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(domain);
      else next.delete(domain);
      return next;
    });
  }, []);

  const toggleAllVisible = useCallback(
    (checked: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const d of visibleDomains) {
          if (checked) next.add(d);
          else next.delete(d);
        }
        return next;
      });
    },
    [visibleDomains],
  );

  const verifyAll = useCallback(async () => {
    const res = await queryClient.fetchQuery(
      trpc.admin.parkedDomains.listAllParkedDomainNames.queryOptions({
        limit: 500,
      }),
    );
    if (res.truncated) {
      toast.info(
        `Verifying the first ${res.domains.length} of ${res.total} parked domains. The weekly report covers the full set.`,
      );
    }
    await verifyDomains(res.domains);
  }, [queryClient, trpc, verifyDomains]);

  const filterStrategy = useDrizzlerServerFilterStrategy({
    filterConfig: {
      normalizedDomainName: {
        id: 'normalizedDomainName',
        label: 'Domain',
        type: 'text',
        columnId: 'normalizedDomainName',
      },
      ownerAddress: {
        id: 'ownerAddress',
        label: 'Wallet',
        type: 'text',
        columnId: 'ownerAddress',
      },
      forwardTo: {
        id: 'forwardTo',
        label: 'Forward To',
        type: 'text',
        columnId: 'forwardTo',
        allowedOperators: ['like', 'eq', 'isNull', 'isNotNull'],
      },
    },
    onDrizzlerFilterChange: (newFilterState) => {
      setPage(1);
      setDrizzlerFilterState(newFilterState);
    },
  });

  const columns = useMemo<ColumnDef<ParkedDomainRow>[]>(() => {
    const statusColumn = (
      id: string,
      header: string,
      pick: (r: VerificationResult) => { status: CheckStatus; detail: string },
    ): ColumnDef<ParkedDomainRow> => ({
      id,
      header,
      enableSorting: false,
      cell: ({ row }) => {
        const result = results[row.original.normalizedDomainName];
        const check = result ? pick(result) : undefined;
        return <StatusBadge status={check?.status} detail={check?.detail} />;
      },
      size: 100,
    });

    return [
      {
        id: 'select',
        enableSorting: false,
        header: () => (
          <Checkbox
            checked={allVisibleSelected}
            onCheckedChange={(checked) => toggleAllVisible(checked === true)}
            aria-label="Select all visible parked domains"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selected.has(row.original.normalizedDomainName)}
            onCheckedChange={(checked) =>
              toggleRow(row.original.normalizedDomainName, checked === true)
            }
            aria-label={`Select ${row.original.normalizedDomainName}`}
          />
        ),
        size: 40,
      },
      {
        accessorKey: 'normalizedDomainName',
        header: 'Domain',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <AutoTruncateTextV2
              initialCharactersCountToDisplay={32}
              minCharactersToDisplay={16}
              className="font-medium"
            >
              {row.original.normalizedDomainName}
            </AutoTruncateTextV2>
            <AdminDomainDetailsButton
              domainName={row.original.normalizedDomainName}
              size="icon-xs"
            />
          </div>
        ),
        size: 240,
      },
      {
        accessorKey: 'ownerAddress',
        header: 'Wallet',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.ownerAddress ? (
            <AddressWithChainId
              address={row.original.ownerAddress}
              chainId={row.original.chainId}
            />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
        size: 220,
      },
      {
        accessorKey: 'mode',
        header: 'Mode',
        enableSorting: false,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.original.mode === 'forward'
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }
          >
            {row.original.mode === 'forward' ? 'Forward' : 'Park'}
          </Badge>
        ),
        size: 100,
      },
      {
        accessorKey: 'forwardTo',
        header: 'Forward To',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.forwardTo ? (
            <AutoTruncateTextV2
              initialCharactersCountToDisplay={28}
              minCharactersToDisplay={14}
            >
              {row.original.forwardTo}
            </AutoTruncateTextV2>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
        size: 200,
      },
      statusColumn('dns', 'DNS', (r) => r.dns),
      statusColumn('ssl', 'SSL', (r) => r.ssl),
      statusColumn('serving', 'Serving', (r) => r.serving),
      statusColumn('redirect', 'Redirect', (r) => r.redirect),
      {
        id: 'overall',
        header: 'Overall',
        enableSorting: false,
        cell: ({ row }) => {
          const result = results[row.original.normalizedDomainName];
          return (
            <StatusBadge
              status={result?.overall}
              detail={result ? undefined : 'Not yet verified'}
            />
          );
        },
        size: 100,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const result = results[row.original.normalizedDomainName];
          return (
            <div className="flex items-center gap-2">
              <AsyncButton
                size="sm"
                variant="outline"
                onClick={async () =>
                  verifyDomains([row.original.normalizedDomainName])
                }
              >
                {result ? 'Re-verify' : 'Verify'}
              </AsyncButton>
              {result ? <VerificationDetailDialog result={result} /> : null}
            </div>
          );
        },
        size: 200,
      },
    ];
  }, [
    results,
    verifyDomains,
    selected,
    allVisibleSelected,
    toggleRow,
    toggleAllVisible,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {verifiedCount} of {visibleDomains.length} visible verified
          {selectedCount ? ` · ${selectedCount} selected` : ''}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AsyncButton
            variant="outline"
            onClick={async () => verifyDomains([...selected])}
            disabled={selectedCount === 0}
          >
            Verify selected{selectedCount ? ` (${selectedCount})` : ''}
          </AsyncButton>
          <AsyncButton
            variant="outline"
            onClick={async () => verifyDomains(visibleDomains)}
            disabled={visibleDomains.length === 0}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Verify visible page
          </AsyncButton>
          <AsyncButton onClick={verifyAll}>Verify all</AsyncButton>
        </div>
      </div>
      <ExtensibleDataTable<ParkedDomainRow, typeof filterStrategy>
        filterStrategy={filterStrategy}
        columns={columns}
        data={rows}
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        page={page}
        pageSize={pageSize}
        totalPages={query.data?.pagination.totalPages ?? 1}
        totalCount={query.data?.pagination.totalCount ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPage(1);
          setPageSize(size);
        }}
        sorting={sorting}
        onSortingChange={setSorting}
        emptyMessage="No parked domains found"
        loadingMessage="Loading parked domains..."
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        onResetPreferences={resetToDefaults}
      />
    </div>
  );
}
