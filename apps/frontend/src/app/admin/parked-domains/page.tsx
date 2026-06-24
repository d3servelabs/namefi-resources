'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounceValue } from 'usehooks-ts';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
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
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { AddressWithChain as AddressWithChainId } from '@/components/address-with-chain';
import {
  type CheckStatus,
  DomainNameCell,
  ForwardToValue,
  LastCheckedCell,
  ModeBadge,
  type ParkedDomainRow,
  StatusBadge,
  type VerificationResult,
  VerificationDetailDialog,
} from './parked-domains-cells';
import { ParkedDomainCard } from './parked-domain-card';

/** Verify domains in batches that respect the contract's per-call cap. */
const VERIFY_BATCH_SIZE = 50;

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
  // A row is "verified" if it has an in-session result or a stored one.
  const verifiedCount = rows.filter(
    (r) => results[r.normalizedDomainName] ?? r.lastResult,
  ).length;
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
    // Latest result to display: an in-session re-verify wins, else the stored
    // record from the list query (so badges show on load, not just after a click).
    const effectiveResult = (
      row: ParkedDomainRow,
    ): VerificationResult | undefined =>
      results[row.normalizedDomainName] ?? row.lastResult ?? undefined;

    const statusColumn = (
      id: string,
      header: string,
      pick: (r: VerificationResult) => { status: CheckStatus; detail: string },
    ): ColumnDef<ParkedDomainRow> => ({
      id,
      header,
      enableSorting: false,
      cell: ({ row }) => {
        const result = effectiveResult(row.original);
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
            data-testid="admin.parked-domains.select-all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selected.has(row.original.normalizedDomainName)}
            onCheckedChange={(checked) =>
              toggleRow(row.original.normalizedDomainName, checked === true)
            }
            aria-label={`Select ${row.original.normalizedDomainName}`}
            data-testid={`admin.parked-domains.row.select.${row.original.normalizedDomainName}`}
          />
        ),
        size: 40,
      },
      {
        accessorKey: 'normalizedDomainName',
        header: 'Domain',
        cell: ({ row }) => (
          <DomainNameCell domainName={row.original.normalizedDomainName} />
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
        cell: ({ row }) => <ModeBadge mode={row.original.mode} />,
        size: 100,
      },
      {
        accessorKey: 'forwardTo',
        header: 'Forward To',
        enableSorting: false,
        cell: ({ row }) => (
          <ForwardToValue forwardTo={row.original.forwardTo} />
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
          const result = effectiveResult(row.original);
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
        id: 'lastCheckedAt',
        header: 'Last checked',
        enableSorting: true,
        cell: ({ row }) => <LastCheckedCell at={row.original.lastCheckedAt} />,
        size: 140,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const result = effectiveResult(row.original);
          return (
            <div className="flex items-center gap-2">
              <AsyncButton
                size="sm"
                variant="outline"
                onClick={async () =>
                  verifyDomains([row.original.normalizedDomainName])
                }
                data-testid={`admin.parked-domains.row.verify.${row.original.normalizedDomainName}`}
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

  // Mobile card renderer. Reuses the same shared cell components the desktop
  // columns use, so a phone-sized viewport gets a readable stacked card per
  // domain instead of a horizontally-scrolling table (switch layout, reuse
  // logic).
  const renderMobileCard = useCallback(
    (row: Row<ParkedDomainRow>) => (
      <ParkedDomainCard
        row={row.original}
        result={
          results[row.original.normalizedDomainName] ??
          row.original.lastResult ??
          undefined
        }
        isSelected={selected.has(row.original.normalizedDomainName)}
        onSelectedChange={toggleRow}
        onVerify={verifyDomains}
      />
    ),
    [results, selected, toggleRow, verifyDomains],
  );

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap items-center justify-between gap-3"
        data-testid="admin.parked-domains.toolbar"
      >
        <div
          className="text-sm text-muted-foreground"
          data-testid="admin.parked-domains.verified-count"
        >
          {verifiedCount} of {visibleDomains.length} visible verified
          {selectedCount ? ` · ${selectedCount} selected` : ''}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AsyncButton
            variant="outline"
            onClick={async () => verifyDomains([...selected])}
            disabled={selectedCount === 0}
            data-testid="admin.parked-domains.verify-selected"
          >
            Verify selected{selectedCount ? ` (${selectedCount})` : ''}
          </AsyncButton>
          <AsyncButton
            variant="outline"
            onClick={async () => verifyDomains(visibleDomains)}
            disabled={visibleDomains.length === 0}
            data-testid="admin.parked-domains.verify-visible"
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Verify visible page
          </AsyncButton>
          <AsyncButton
            onClick={verifyAll}
            data-testid="admin.parked-domains.verify-all"
          >
            Verify all
          </AsyncButton>
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
        renderMobileCard={renderMobileCard}
      />
    </div>
  );
}
