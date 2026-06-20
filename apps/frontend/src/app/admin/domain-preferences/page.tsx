'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useDebounceValue } from 'usehooks-ts';
import { toast } from 'sonner';
import { AdminGuard } from '@/components/admin/admin-guard';
import {
  PermissionGate,
  useHasPermissions,
} from '@/components/access/PermissionGate';
import { Permission } from '@namefi-astra/utils/permissions';
import { PageShell } from '@/components/page-shell';
import { useTRPC } from '@/lib/trpc';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import {
  useDrizzlerServerFilterStrategy,
  convertToDrizzlerFilterOptions,
  type DrizzlerFilterState,
} from '@/components/table/filters';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { AsyncButton } from '@/components/buttons/async-button';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { DomainPreferenceCard } from './domain-preference-card';
import {
  type DomainPreferencesRow,
  DomainNameCell,
  ForwardToCell,
  type PreferenceDraft,
  PreferenceToggleCell,
  UserIdCell,
  WalletCell,
} from './domain-preferences-cells';

const DEFAULT_COLUMN_VISIBILITY = {
  userId: true,
  ownerAddress: true,
  autoRenewEnabled: true,
  autoEnsEnabled: true,
  autoParkEnabled: true,
  forwardTo: true,
  actions: true,
};

export default function DomainPreferencesAdminPage() {
  return (
    <AdminGuard accessDeniedMessage="You are not an admin.">
      <PermissionGate
        permissions={[Permission.READ_DOMAIN_PREFERENCES]}
        loadingFallback={null}
      >
        <DomainPreferencesPage />
      </PermissionGate>
      <PermissionGate
        gateMode="inverted"
        permissions={[Permission.READ_DOMAIN_PREFERENCES]}
        loadingFallback={null}
      >
        <PageShell padding="admin" className="py-6">
          <div>You do not have permission to access this page.</div>
        </PageShell>
      </PermissionGate>
    </AdminGuard>
  );
}

function DomainPreferencesPage() {
  return (
    <PageShell padding="admin" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Domain Preferences</h1>
        <p className="text-muted-foreground">
          Review and update your domain configuration and preferences.
        </p>
        <p className="mt-2 text-sm text-amber-600">
          Note: "Not set" means the value is <code>null</code> in the database
          (no record/value exists).
        </p>
      </div>
      <DomainPreferencesTable />
    </PageShell>
  );
}

function DomainPreferencesTable() {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const {
    preferences: { sorting, pageSize, columnVisibility },
    setSorting,
    setPageSize,
    setColumnVisibility,
    resetToDefaults,
  } = useTablePreferences({
    tableId: 'admin-domain-preferences',
    defaultPreferences: {
      sorting: [{ id: 'normalizedDomainName', desc: false }],
      pageSize: 25,
      columnVisibility: DEFAULT_COLUMN_VISIBILITY,
    },
  });

  const { hasPermissions: canWrite } = useHasPermissions([
    Permission.WRITE_DOMAIN_PREFERENCES,
  ]);

  const [drafts, setDrafts] = useState<Record<string, PreferenceDraft>>({});

  const [drizzlerFilterState, setDrizzlerFilterState] =
    useState<DrizzlerFilterState>({
      columnFilters: {},
      customFilters: {},
    });

  const [debouncedDrizzlerFilterState] = useDebounceValue(
    drizzlerFilterState,
    500,
  );

  const backendFilters = useMemo(() => {
    return convertToDrizzlerFilterOptions(
      debouncedDrizzlerFilterState.columnFilters,
    );
  }, [debouncedDrizzlerFilterState]);

  const backendSorting = useMemo(() => {
    if (!sorting || sorting.length === 0) return undefined;
    return sorting.map((s) => ({
      column: s.id,
      order: s.desc ? ('desc' as const) : ('asc' as const),
    }));
  }, [sorting]);

  const query = useQuery(
    trpc.admin.domainPreferences.listDomainPreferences.queryOptions(
      {
        page,
        pageSize,
        filters: backendFilters,
        sorting: backendSorting,
      },
      {
        placeholderData: (prev) => prev,
      },
    ),
  );

  const updateMutation = useMutation(
    trpc.admin.domainPreferences.updateDomainPreferences.mutationOptions({
      onSuccess: async (_, variables) => {
        toast('Domain preferences updated');
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[variables.domainName];
          return next;
        });
        await query.refetch();
      },
      onError: (error) => {
        toast('Failed to update domain preferences', {
          description: error.message,
        });
      },
    }),
  );

  const setDraftValue = useCallback(
    <K extends keyof PreferenceDraft>(
      domainName: string,
      key: K,
      value: PreferenceDraft[K],
    ) => {
      setDrafts((prev) => ({
        ...prev,
        [domainName]: {
          ...prev[domainName],
          [key]: value,
        },
      }));
    },
    [],
  );

  const resetDraft = useCallback((domainName: string) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[domainName];
      return next;
    });
  }, []);

  const hasRowChanges = useCallback(
    (row: DomainPreferencesRow) => {
      const draft = drafts[row.normalizedDomainName];
      if (!draft) return false;
      if (
        draft.autoRenewEnabled !== undefined &&
        draft.autoRenewEnabled !== row.autoRenewEnabled
      ) {
        return true;
      }
      if (
        draft.autoEnsEnabled !== undefined &&
        draft.autoEnsEnabled !== row.autoEnsEnabled
      ) {
        return true;
      }
      if (
        draft.autoParkEnabled !== undefined &&
        draft.autoParkEnabled !== row.autoParkEnabled
      ) {
        return true;
      }
      if (draft.forwardTo !== undefined && draft.forwardTo !== row.forwardTo) {
        return true;
      }
      return false;
    },
    [drafts],
  );

  const applyChanges = useCallback(
    async (row: DomainPreferencesRow) => {
      const draft = drafts[row.normalizedDomainName];
      if (!draft) return;

      const payload: PreferenceDraft = {};
      if (
        draft.autoRenewEnabled !== undefined &&
        draft.autoRenewEnabled !== row.autoRenewEnabled
      ) {
        payload.autoRenewEnabled = draft.autoRenewEnabled;
      }
      if (
        draft.autoEnsEnabled !== undefined &&
        draft.autoEnsEnabled !== row.autoEnsEnabled
      ) {
        payload.autoEnsEnabled = draft.autoEnsEnabled;
      }
      if (
        draft.autoParkEnabled !== undefined &&
        draft.autoParkEnabled !== row.autoParkEnabled
      ) {
        payload.autoParkEnabled = draft.autoParkEnabled;
      }
      if (draft.forwardTo !== undefined && draft.forwardTo !== row.forwardTo) {
        payload.forwardTo = draft.forwardTo;
      }

      if (Object.keys(payload).length === 0) return;

      await updateMutation.mutateAsync({
        domainName: row.normalizedDomainName,
        domainPreferencesAndConfig: payload,
      });
    },
    [drafts, updateMutation],
  );

  const filterStrategy = useDrizzlerServerFilterStrategy({
    filterConfig: {
      userId: {
        id: 'userId',
        label: 'User ID',
        type: 'text',
        columnId: 'userId',
      },
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
      autoRenewEnabled: {
        id: 'autoRenewEnabled',
        label: 'Auto Renew',
        type: 'select',
        columnId: 'autoRenewEnabled',
        options: [
          { value: 'true', label: 'Enabled' },
          { value: 'false', label: 'Disabled' },
        ],
        allowedOperators: ['eq', 'neq', 'isNull', 'isNotNull'],
      },
      autoEnsEnabled: {
        id: 'autoEnsEnabled',
        label: 'Auto ENS',
        type: 'select',
        columnId: 'autoEnsEnabled',
        options: [
          { value: 'true', label: 'Enabled' },
          { value: 'false', label: 'Disabled' },
        ],
        allowedOperators: ['eq', 'neq', 'isNull', 'isNotNull'],
      },
      autoParkEnabled: {
        id: 'autoParkEnabled',
        label: 'Auto Park',
        type: 'select',
        columnId: 'autoParkEnabled',
        options: [
          { value: 'true', label: 'Enabled' },
          { value: 'false', label: 'Disabled' },
        ],
        allowedOperators: ['eq', 'neq', 'isNull', 'isNotNull'],
      },
      forwardTo: {
        id: 'forwardTo',
        label: 'Forward To',
        type: 'text',
        columnId: 'forwardTo',
      },
    },
    onDrizzlerFilterChange: (newFilterState) => {
      setPage(1);
      setDrizzlerFilterState(newFilterState);
    },
  });

  const columns = useMemo<ColumnDef<DomainPreferencesRow>[]>(
    () => [
      {
        accessorKey: 'normalizedDomainName',
        header: 'Domain',
        cell: ({ row }) => (
          <DomainNameCell domainName={row.original.normalizedDomainName} />
        ),
        size: 240,
      },
      {
        accessorKey: 'userId',
        header: 'User ID',
        cell: ({ row }) => <UserIdCell userId={row.original.userId} />,
        size: 180,
      },
      {
        accessorKey: 'ownerAddress',
        header: 'Wallet',
        cell: ({ row }) => (
          <WalletCell
            ownerAddress={row.original.ownerAddress}
            chainId={row.original.chainId}
          />
        ),
        size: 220,
      },
      {
        accessorKey: 'autoRenewEnabled',
        header: 'Auto Renew',
        cell: ({ row }) => (
          <PreferenceToggleCell
            row={row.original}
            draft={drafts[row.original.normalizedDomainName]}
            field="autoRenewEnabled"
            disabled={!canWrite}
            onChange={(checked) =>
              setDraftValue(
                row.original.normalizedDomainName,
                'autoRenewEnabled',
                checked,
              )
            }
          />
        ),
        size: 140,
      },
      {
        accessorKey: 'autoEnsEnabled',
        header: 'Auto ENS',
        cell: ({ row }) => (
          <PreferenceToggleCell
            row={row.original}
            draft={drafts[row.original.normalizedDomainName]}
            field="autoEnsEnabled"
            disabled={!canWrite}
            onChange={(checked) =>
              setDraftValue(
                row.original.normalizedDomainName,
                'autoEnsEnabled',
                checked,
              )
            }
          />
        ),
        size: 140,
      },
      {
        accessorKey: 'autoParkEnabled',
        header: 'Auto Park',
        cell: ({ row }) => (
          <PreferenceToggleCell
            row={row.original}
            draft={drafts[row.original.normalizedDomainName]}
            field="autoParkEnabled"
            disabled={!canWrite}
            onChange={(checked) =>
              setDraftValue(
                row.original.normalizedDomainName,
                'autoParkEnabled',
                checked,
              )
            }
          />
        ),
        size: 140,
      },
      {
        accessorKey: 'forwardTo',
        header: 'Forward To',
        cell: ({ row }) => (
          <ForwardToCell
            row={row.original}
            draft={drafts[row.original.normalizedDomainName]}
            disabled={!canWrite}
            onChange={(nextValue) =>
              setDraftValue(
                row.original.normalizedDomainName,
                'forwardTo',
                nextValue,
              )
            }
          />
        ),
        size: 220,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const isDirty = hasRowChanges(row.original);
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!isDirty || !canWrite || updateMutation.isPending}
                onClick={() => resetDraft(row.original.normalizedDomainName)}
              >
                Reset
              </Button>
              <AsyncButton
                size="sm"
                disabled={!isDirty || !canWrite || updateMutation.isPending}
                onClick={async () => applyChanges(row.original)}
              >
                Save
              </AsyncButton>
            </div>
          );
        },
        size: 160,
      },
    ],
    [
      applyChanges,
      canWrite,
      drafts,
      hasRowChanges,
      resetDraft,
      setDraftValue,
      updateMutation.isPending,
    ],
  );

  // Mobile card renderer. On phones ExtensibleDataTable swaps the wide,
  // horizontally-scrolling table for these stacked cards. The card composes the
  // SAME extracted cells the desktop columns use and edits flow through the same
  // draft state + Reset/Save mutation (switch layout, reuse logic).
  const renderMobileCard = useCallback(
    (row: Row<DomainPreferencesRow>) => {
      const domainName = row.original.normalizedDomainName;
      return (
        <DomainPreferenceCard
          row={row.original}
          draft={drafts[domainName]}
          canWrite={canWrite}
          isDirty={hasRowChanges(row.original)}
          isSaving={updateMutation.isPending}
          onDraftChange={(field, value) =>
            setDraftValue(domainName, field, value)
          }
          onReset={() => resetDraft(domainName)}
          onSave={async () => applyChanges(row.original)}
        />
      );
    },
    [
      applyChanges,
      canWrite,
      drafts,
      hasRowChanges,
      resetDraft,
      setDraftValue,
      updateMutation.isPending,
    ],
  );

  return (
    <ExtensibleDataTable<DomainPreferencesRow, typeof filterStrategy>
      filterStrategy={filterStrategy}
      columns={columns}
      data={query.data?.data ?? []}
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
      emptyMessage="No domains found"
      loadingMessage="Loading domain preferences..."
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
      onResetPreferences={resetToDefaults}
      renderMobileCard={renderMobileCard}
    />
  );
}
