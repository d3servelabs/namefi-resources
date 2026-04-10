'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
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
import { Switch } from '@/components/ui/shadcn/switch';
import { Input } from '@/components/ui/shadcn/input';
import { AsyncButton } from '@/components/buttons/async-button';
import { Button } from '@/components/ui/shadcn/button';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { AddressWithChain as AddressWithChainId } from '@/components/address-with-chain';

type DomainPreferencesRow = {
  userId: string | null;
  normalizedDomainName: string;
  ownerAddress: string | null;
  chainId: number;
  autoRenewEnabled: boolean | null;
  autoEnsEnabled: boolean | null;
  autoParkEnabled: boolean | null;
  forwardTo: string | null;
};

type PreferenceDraft = {
  autoRenewEnabled?: boolean;
  autoEnsEnabled?: boolean;
  autoParkEnabled?: boolean;
  forwardTo?: string;
};

const DEFAULT_COLUMN_VISIBILITY = {
  userId: true,
  ownerAddress: true,
  autoRenewEnabled: true,
  autoEnsEnabled: true,
  autoParkEnabled: true,
  forwardTo: true,
  actions: true,
};

const NOT_SET_DEFAULTS = {
  autoRenewEnabled: false,
  autoEnsEnabled: true,
  autoParkEnabled: false,
  forwardTo: '',
} as const;

const NOT_SET_TEXT_CLASSNAME = 'text-xs text-amber-600';

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
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={32}
            minCharactersToDisplay={16}
            className="font-medium"
          >
            {row.original.normalizedDomainName}
          </AutoTruncateTextV2>
        ),
        size: 220,
      },
      {
        accessorKey: 'userId',
        header: 'User ID',
        cell: ({ row }) => {
          if (!row.original.userId) {
            return <NotSetText />;
          }
          return (
            <AutoTruncateTextV2
              initialCharactersCountToDisplay={16}
              minCharactersToDisplay={12}
            >
              {row.original.userId}
            </AutoTruncateTextV2>
          );
        },
        size: 180,
      },
      {
        accessorKey: 'ownerAddress',
        header: 'Wallet',
        cell: ({ row }) => {
          if (!row.original.ownerAddress) {
            return <NotSetText />;
          }
          return (
            <AddressWithChainId
              address={row.original.ownerAddress}
              chainId={row.original.chainId}
            />
          );
        },
        size: 220,
      },
      {
        accessorKey: 'autoRenewEnabled',
        header: 'Auto Renew',
        cell: ({ row }) => {
          const draft = drafts[row.original.normalizedDomainName];
          const isNotSet =
            row.original.autoRenewEnabled === null &&
            draft?.autoRenewEnabled === undefined;
          const value =
            draft?.autoRenewEnabled ??
            row.original.autoRenewEnabled ??
            NOT_SET_DEFAULTS.autoRenewEnabled;
          return (
            <PreferenceToggle
              value={value}
              isNotSet={isNotSet}
              disabled={!canWrite}
              onChange={(checked) =>
                setDraftValue(
                  row.original.normalizedDomainName,
                  'autoRenewEnabled',
                  checked,
                )
              }
            />
          );
        },
        size: 140,
      },
      {
        accessorKey: 'autoEnsEnabled',
        header: 'Auto ENS',
        cell: ({ row }) => {
          const draft = drafts[row.original.normalizedDomainName];
          const isNotSet =
            row.original.autoEnsEnabled === null &&
            draft?.autoEnsEnabled === undefined;
          const value =
            draft?.autoEnsEnabled ??
            row.original.autoEnsEnabled ??
            NOT_SET_DEFAULTS.autoEnsEnabled;
          return (
            <PreferenceToggle
              value={value}
              isNotSet={isNotSet}
              disabled={!canWrite}
              onChange={(checked) =>
                setDraftValue(
                  row.original.normalizedDomainName,
                  'autoEnsEnabled',
                  checked,
                )
              }
            />
          );
        },
        size: 140,
      },
      {
        accessorKey: 'autoParkEnabled',
        header: 'Auto Park',
        cell: ({ row }) => {
          const draft = drafts[row.original.normalizedDomainName];
          const isNotSet =
            row.original.autoParkEnabled === null &&
            draft?.autoParkEnabled === undefined;
          const value =
            draft?.autoParkEnabled ??
            row.original.autoParkEnabled ??
            NOT_SET_DEFAULTS.autoParkEnabled;
          return (
            <PreferenceToggle
              value={value}
              isNotSet={isNotSet}
              disabled={!canWrite}
              onChange={(checked) =>
                setDraftValue(
                  row.original.normalizedDomainName,
                  'autoParkEnabled',
                  checked,
                )
              }
            />
          );
        },
        size: 140,
      },
      {
        accessorKey: 'forwardTo',
        header: 'Forward To',
        cell: ({ row }) => {
          const draft = drafts[row.original.normalizedDomainName];
          const isNotSet =
            row.original.forwardTo === null && draft?.forwardTo === undefined;
          const value =
            draft?.forwardTo ??
            row.original.forwardTo ??
            NOT_SET_DEFAULTS.forwardTo;
          return (
            <ForwardToField
              value={value}
              disabled={!canWrite}
              isNotSet={isNotSet}
              onChange={(nextValue) =>
                setDraftValue(
                  row.original.normalizedDomainName,
                  'forwardTo',
                  nextValue,
                )
              }
            />
          );
        },
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
    />
  );
}

function PreferenceToggle({
  value,
  isNotSet,
  disabled,
  onChange,
}: {
  value: boolean;
  isNotSet: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  const checked = value;
  const label = isNotSet ? 'Not set' : checked ? 'Enabled' : 'Disabled';

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={checked}
        onCheckedChange={(next) => onChange(Boolean(next))}
        disabled={disabled}
      />
      <span
        className={
          isNotSet ? NOT_SET_TEXT_CLASSNAME : 'text-xs text-muted-foreground'
        }
      >
        {label}
      </span>
    </div>
  );
}

function ForwardToField({
  value,
  disabled,
  isNotSet,
  onChange,
}: {
  value: string;
  disabled: boolean;
  isNotSet: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-[180px]">
      <Input
        value={value}
        placeholder="Not set"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      {isNotSet && value === '' ? (
        <div className={`${NOT_SET_TEXT_CLASSNAME} mt-1`}>Not set</div>
      ) : null}
    </div>
  );
}

function NotSetText() {
  return <span className={NOT_SET_TEXT_CLASSNAME}>Not set</span>;
}
