'use client';

import { useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { withAdminGuard } from '@/components/admin/admin-guard';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { PageShell } from '@/components/page-shell';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@namefi-astra/ui/components/shadcn/form';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import {
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Search,
  Settings,
  ExternalLink,
  Loader2,
  X,
  Play,
  Pause,
  Edit,
  MoreHorizontal,
} from 'lucide-react';
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import type { AppRouterOutput } from '@/lib/trpc';
import { AsyncButton } from '@/components/buttons/async-button';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils/namefi-flavor';
import { getDomainLevelLabel } from '@namefi-astra/utils/parse-domain-name';
import {
  computeDefaultAdditionalAllowedHostnames,
  isTldOnly,
} from '@/lib/pbn-defaults';
import { HostnamesChipInput } from './forms/hostnames-chip-input';
import { EditHostnamesDialog } from './forms/edit-hostnames-form';
import { DnsStatusCell } from './cells/dns-status-cell';
import type { ColumnDef } from '@tanstack/react-table';
import { useDebounceValue } from 'usehooks-ts';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import {
  useDrizzlerServerFilterStrategy,
  convertToDrizzlerFilterOptions,
  type DrizzlerFilterState,
} from '@/components/table/filters';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';

// Form schema for creating powered by namefi domains
const createDomainSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  additionalAllowedHostnames: z.array(namefiNormalizedDomainSchema).default([]),
  additionalReservedNames: z.array(z.string().trim().toLowerCase()).default([]),
  durationConstraints: z
    .object({
      minDurationInYears: z.number().min(1),
      maxDurationInYears: z.number().min(1),
    })
    .refine((data) => data.minDurationInYears <= data.maxDurationInYears, {
      message: 'Min duration must be less than or equal to max duration',
      path: ['durationConstraints'],
    }),
  costPerYearInUsdCents: z.number().min(0),
  metadata: z.record(z.string(), z.any()).optional(),
  ownerId: z.string().uuid().optional(),
  // Setup options
  setupVercelAndDns: z.boolean().default(false),
  setupNamefiIo: z.boolean().default(false),
  setupNamefiDev: z.boolean().default(false),
});

type CreateDomainFormInput = z.input<typeof createDomainSchema>;
type CreateDomainFormData = z.output<typeof createDomainSchema>;

interface SearchedUser {
  id: string;
  privyUserId: string;
  primaryEmail: string | null;
  walletAddresses: string[];
  displayName: string | null;
}

type SetupStatus = NonNullable<
  AppRouterOutput['admin']['poweredByNamefi']['getPoweredByNamefiDomainStatus']['setupStatus']
>[0];

type Domain = {
  normalizedDomainName: string;
  additionalAllowedHostnames: string[] | null;
  additionalReservedNames: string[] | null;
  durationConstraints: {
    minDurationInYears: number;
    maxDurationInYears: number;
  };
  costPerYearInUsdCents: number;
  metadata: unknown;
  ownerId: string | null;
  enabled: boolean;
  startRolloutAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const StatusIcon = ({
  isSetup,
  isPending = false,
}: {
  isSetup: boolean;
  isPending?: boolean;
}) => {
  if (isPending) {
    return <Clock className="h-4 w-4 text-yellow-500" />;
  }
  return isSetup ? (
    <CheckCircle className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-red-500" />
  );
};

const StatusBadge = ({
  isSetup,
  isPending = false,
}: {
  isSetup: boolean;
  isPending?: boolean;
}) => {
  const variant = isPending
    ? 'secondary'
    : isSetup
      ? 'default'
      : ('destructive' as const);
  const text = isPending
    ? 'Pending'
    : isSetup
      ? 'Configured'
      : 'Not Configured';

  return <Badge variant={variant}>{text}</Badge>;
};

/**
 * TLD / SLD / 3LD / 4LD / 5LD+ marker for a PBN parent. The label is
 * computed client-side from `parseDomainName`; see the notes in
 * `packages/utils/src/parse-domain-name.ts` for why we don't expose this
 * as a server-sortable column.
 */
function DomainLevelBadge({ name }: { name: string }) {
  const label = getDomainLevelLabel(name);
  const variant: 'default' | 'secondary' | 'outline' =
    label === 'TLD' ? 'outline' : label === 'SLD' ? 'default' : 'secondary';
  return <Badge variant={variant}>{label}</Badge>;
}

export default withAdminGuard(function PoweredByNamefiDomainsPage() {
  const trpc = useTRPC();

  // Dialog / selection state (unchanged surface).
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [isEditCostDialogOpen, setIsEditCostDialogOpen] = useState(false);
  const [editingHostnamesDomain, setEditingHostnamesDomain] =
    useState<Domain | null>(null);

  // Pagination / sort / visibility persisted per-user via localStorage.
  const [page, setPage] = useState(1);
  const {
    preferences: { sorting, pageSize, columnVisibility },
    setSorting,
    setPageSize,
    setColumnVisibility,
    resetToDefaults,
  } = useTablePreferences({
    tableId: 'admin-pbn-domains',
    defaultPreferences: {
      sorting: [{ id: 'normalizedDomainName', desc: false }],
      pageSize: 25,
      columnVisibility: {
        normalizedDomainName: true,
        domainLevel: true,
        enabled: true,
        dnsStatus: true,
        costPerYearInUsdCents: true,
        duration: true,
        startRolloutAt: true,
        createdAt: true,
        updatedAt: false,
        minDurationInYears: false,
        maxDurationInYears: false,
        actions: true,
      },
    },
  });

  // Drizzler multi-field filter state. Debounced so typing into the
  // Filters panel doesn't hammer the backend.
  const [drizzlerFilterState, setDrizzlerFilterState] =
    useState<DrizzlerFilterState>({ columnFilters: {}, customFilters: {} });
  const [debouncedFilterState] = useDebounceValue(drizzlerFilterState, 500);
  const backendFilters = useMemo(
    () => convertToDrizzlerFilterOptions(debouncedFilterState.columnFilters),
    [debouncedFilterState],
  );
  const backendSorting = useMemo(() => {
    if (!sorting || sorting.length === 0) return undefined;
    return sorting.map((s) => ({
      column: s.id,
      order: s.desc ? ('desc' as const) : ('asc' as const),
    }));
  }, [sorting]);

  // Fetch domains
  const {
    data: domainsData,
    isLoading: isLoadingDomains,
    isFetching: isFetchingDomains,
    refetch: refetchDomains,
  } = useQuery({
    ...trpc.admin.poweredByNamefi.getPoweredByNamefiDomains.queryOptions({
      page,
      pageSize,
      filters: backendFilters,
      sorting: backendSorting,
    }),
    placeholderData: (prev) => prev,
  });

  // Fetch domain status for selected domain
  const {
    data: domainStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useQuery({
    ...trpc.admin.poweredByNamefi.getPoweredByNamefiDomainStatus.queryOptions({
      normalizedDomainName: selectedDomain as string,
    }),
    enabled: !!selectedDomain,
  });

  // Mutations
  const createDomainMutation = useMutation({
    ...trpc.admin.poweredByNamefi.createPoweredByNamefiDomain.mutationOptions(),
    onSuccess: () => {
      toast.success('Domain created successfully');
      setIsCreateDialogOpen(false);
      refetchDomains();
    },
    onError: (error) => {
      toast.error(`Failed to create domain: ${error.message}`);
    },
  });

  const setupVercelMutation = useMutation({
    ...trpc.admin.poweredByNamefi.setupVercelAndDns.mutationOptions(),
    onSuccess: () => {
      toast.success('Vercel and DNS setup completed');
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`Configuration failed: ${error.message}`);
    },
  });

  const setupNamefiIoMutation = useMutation({
    ...trpc.admin.poweredByNamefi.setupNamefiIoSubdomain.mutationOptions(),
    onSuccess: () => {
      toast.success('Namefi.io subdomain setup completed');
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`Configuration failed: ${error.message}`);
    },
  });

  const setupNamefiDevMutation = useMutation({
    ...trpc.admin.poweredByNamefi.setupNamefiDevSubdomain.mutationOptions(),
    onSuccess: () => {
      toast.success('Namefi.dev subdomain setup completed');
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`Configuration failed: ${error.message}`);
    },
  });

  // New mutations for domain actions
  const toggleDomainStatusMutation = useMutation({
    ...trpc.admin.poweredByNamefi.togglePoweredByNamefiDomainStatus.mutationOptions(),
    onSuccess: (data) => {
      toast.success(data.message);
      refetchDomains();
    },
    onError: (error) => {
      toast.error(`Failed to toggle domain status: ${error.message}`);
    },
  });

  const startRolloutMutation = useMutation({
    ...trpc.admin.poweredByNamefi.startPoweredByNamefiDomainRollout.mutationOptions(),
    onSuccess: (data) => {
      toast.success(data.message);
      refetchDomains();
    },
    onError: (error) => {
      toast.error(`Failed to start rollout: ${error.message}`);
    },
  });

  const updateCostAndDurationMutation = useMutation({
    ...trpc.admin.poweredByNamefi.updatePoweredByNamefiDomainCostAndDuration.mutationOptions(),
    onSuccess: (data) => {
      toast.success(data.message);
      refetchDomains();
    },
    onError: (error) => {
      toast.error(`Failed to update cost and duration: ${error.message}`);
    },
  });

  const updateDomainMutation = useMutation({
    ...trpc.admin.poweredByNamefi.updatePoweredByNamefiDomain.mutationOptions(),
    onSuccess: () => {
      toast.success('Hostnames updated');
      setEditingHostnamesDomain(null);
      refetchDomains();
    },
    onError: (error) => {
      toast.error(`Failed to update hostnames: ${error.message}`);
    },
  });

  // Pull out the stable callback (`mutate`) and the single flag the
  // action cells actually read (`isPending`) so the `columns` useMemo
  // only re-runs when one of those actually changes. Depending on
  // the full `useMutation` result object would invalidate the memo
  // on every render because the wrapper object is not reference-
  // stable across renders.
  const { mutate: toggleDomainEnabled, isPending: toggleDomainEnabledPending } =
    toggleDomainStatusMutation;
  const { mutate: startRollout, isPending: startRolloutPending } =
    startRolloutMutation;

  const filterStrategy = useDrizzlerServerFilterStrategy({
    filterConfig: {
      normalizedDomainName: {
        id: 'normalizedDomainName',
        label: 'Domain',
        type: 'text',
        columnId: 'normalizedDomainName',
      },
      enabled: {
        id: 'enabled',
        label: 'Status',
        type: 'select',
        columnId: 'enabled',
        options: [
          { value: 'true', label: 'Enabled' },
          { value: 'false', label: 'Disabled' },
        ],
        allowedOperators: ['eq', 'neq', 'isNull', 'isNotNull'],
      },
      costPerYearInUsdCents: {
        id: 'costPerYearInUsdCents',
        label: 'Cost/Year (cents)',
        type: 'number',
        columnId: 'costPerYearInUsdCents',
      },
      ownerId: {
        id: 'ownerId',
        label: 'Owner ID',
        type: 'text',
        columnId: 'ownerId',
        allowedOperators: ['eq', 'neq', 'isNull', 'isNotNull'],
      },
      startRolloutAt: {
        id: 'startRolloutAt',
        label: 'Rollout Started At',
        type: 'date',
        columnId: 'startRolloutAt',
        allowedOperators: [
          'eq',
          'gt',
          'gte',
          'lt',
          'lte',
          'isNull',
          'isNotNull',
        ],
      },
      createdAt: {
        id: 'createdAt',
        label: 'Created At',
        type: 'date',
        columnId: 'createdAt',
      },
      updatedAt: {
        id: 'updatedAt',
        label: 'Updated At',
        type: 'date',
        columnId: 'updatedAt',
      },
    },
    onDrizzlerFilterChange: (next) => {
      setPage(1);
      setDrizzlerFilterState(next);
    },
  });

  const columns = useMemo<ColumnDef<Domain>[]>(
    () => [
      {
        accessorKey: 'normalizedDomainName',
        header: 'Domain',
        size: 240,
        cell: ({ row }) => (
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={32}
            minCharactersToDisplay={16}
            className="font-medium"
          >
            {row.original.normalizedDomainName}
          </AutoTruncateTextV2>
        ),
      },
      {
        id: 'domainLevel',
        header: 'Level',
        size: 90,
        enableSorting: false,
        cell: ({ row }) => (
          <DomainLevelBadge name={row.original.normalizedDomainName} />
        ),
      },
      {
        accessorKey: 'enabled',
        header: 'Status',
        size: 110,
        cell: ({ row }) => (
          <Badge variant={row.original.enabled ? 'default' : 'secondary'}>
            {row.original.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        ),
      },
      {
        id: 'dnsStatus',
        header: 'DNS Status',
        size: 200,
        enableSorting: false,
        cell: ({ row }) => (
          <DnsStatusCell
            normalizedDomainName={row.original.normalizedDomainName}
            index={row.index}
          />
        ),
      },
      {
        accessorKey: 'costPerYearInUsdCents',
        header: 'Cost/Year',
        size: 110,
        cell: ({ row }) => (
          <span className="tabular-nums">
            ${(row.original.costPerYearInUsdCents / 100).toFixed(2)}
          </span>
        ),
      },
      {
        id: 'duration',
        header: 'Duration',
        size: 110,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.durationConstraints.minDurationInYears}–
            {row.original.durationConstraints.maxDurationInYears} yr
          </span>
        ),
      },
      {
        id: 'minDurationInYears',
        header: 'Min Years',
        size: 90,
        enableSorting: false,
        cell: ({ row }) => row.original.durationConstraints.minDurationInYears,
      },
      {
        id: 'maxDurationInYears',
        header: 'Max Years',
        size: 90,
        enableSorting: false,
        cell: ({ row }) => row.original.durationConstraints.maxDurationInYears,
      },
      {
        accessorKey: 'startRolloutAt',
        header: 'Rollout Started',
        size: 160,
        cell: ({ row }) =>
          row.original.startRolloutAt ? (
            <div className="text-sm">
              <div>
                {format(new Date(row.original.startRolloutAt), 'yyyy-MM-dd')}
              </div>
              <div className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(row.original.startRolloutAt), {
                  addSuffix: true,
                })}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Not started</span>
          ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        size: 140,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.createdAt), {
              addSuffix: true,
            })}
          </span>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        size: 140,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.updatedAt), {
              addSuffix: true,
            })}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 80,
        enableSorting: false,
        cell: ({ row }) => {
          const domain = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="sm" />}
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              {/*
                The project's base DropdownMenuContent pins
                `w-(--anchor-width)` (i.e. the trigger's width). The
                trigger here is a 32px icon button, which clips every
                label. Override with auto width + a comfortable minimum
                so items never truncate, and cap at the viewport on
                mobile.
              */}
              <DropdownMenuContent
                align="end"
                className="w-auto min-w-56 max-w-[calc(100vw-2rem)]"
              >
                {/* Enable/Disable Toggle */}
                <DropdownMenuItem
                  onClick={() =>
                    toggleDomainEnabled({
                      normalizedDomainName: domain.normalizedDomainName,
                      enabled: !domain.enabled,
                    })
                  }
                  disabled={toggleDomainEnabledPending}
                >
                  {domain.enabled ? (
                    <>
                      <Pause className="h-4 w-4 me-2" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 me-2" />
                      Enable
                    </>
                  )}
                </DropdownMenuItem>

                {/* Start Rollout (only if not started) */}
                {!domain.startRolloutAt && (
                  <DropdownMenuItem
                    onClick={() =>
                      startRollout({
                        normalizedDomainName: domain.normalizedDomainName,
                      })
                    }
                    disabled={startRolloutPending}
                  >
                    <Play className="h-4 w-4 me-2" />
                    Start Rollout
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {/* Edit Cost and Duration */}
                <DropdownMenuItem
                  onClick={() => {
                    setEditingDomain(domain);
                    setIsEditCostDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 me-2" />
                  Edit Cost & Duration
                </DropdownMenuItem>

                {/* Edit additionalAllowedHostnames */}
                <DropdownMenuItem
                  onClick={() => setEditingHostnamesDomain(domain)}
                >
                  <Edit className="h-4 w-4 me-2" />
                  Edit Additional Hostnames
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Configuration Dialog */}
                <DropdownMenuItem
                  onClick={() => setSelectedDomain(domain.normalizedDomainName)}
                >
                  <Settings className="h-4 w-4 me-2" />
                  DNS Configuration
                </DropdownMenuItem>

                {/* Visit Domain */}
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      `https://${domain.normalizedDomainName}`,
                      '_blank',
                    )
                  }
                >
                  <ExternalLink className="h-4 w-4 me-2" />
                  Visit Domain
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [
      toggleDomainEnabled,
      toggleDomainEnabledPending,
      startRollout,
      startRolloutPending,
    ],
  );

  const domains = domainsData?.data || [];

  return (
    <PageShell padding="admin">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Powered by Namefi Domains</h1>
        <p className="text-muted-foreground">
          Manage third-party domains powered by Namefi infrastructure.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Domains List</CardTitle>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger render={<Button />}>
                <Plus className="h-4 w-4 me-2" />
                Add Domain
              </DialogTrigger>
              {/*
                Pin the dialog to a viewport-aware size so the header and
                close button stay fixed while the (potentially tall) form
                body scrolls inside. `grid-rows-[auto_1fr]` collaborates
                with the base DialogContent `grid` layout to give the
                form a min-height:0 track — required for nested overflow
                to work.
              */}
              <DialogContent className="sm:max-w-2xl w-full max-h-[min(90vh,920px)] overflow-hidden grid-rows-[auto_1fr]">
                <DialogHeader>
                  <DialogTitle>Add New Powered by Namefi Domain</DialogTitle>
                </DialogHeader>
                <div className="min-h-0 overflow-y-auto pe-1">
                  <CreateDomainForm
                    onSubmit={async (data) => {
                      await createDomainMutation.mutateAsync(data);

                      // Run setup actions if requested
                      if (data.setupVercelAndDns) {
                        await setupVercelMutation.mutateAsync({
                          normalizedDomainName: data.normalizedDomainName,
                        });
                      }

                      if (data.setupNamefiIo) {
                        await setupNamefiIoMutation.mutateAsync({
                          normalizedDomainName: data.normalizedDomainName,
                        });
                      }

                      if (data.setupNamefiDev) {
                        await setupNamefiDevMutation.mutateAsync({
                          normalizedDomainName: data.normalizedDomainName,
                        });
                      }
                    }}
                    isLoading={createDomainMutation.isPending}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ExtensibleDataTable<Domain, typeof filterStrategy>
            filterStrategy={filterStrategy}
            columns={columns}
            data={domains}
            isLoading={isLoadingDomains}
            isFetching={isFetchingDomains}
            page={page}
            pageSize={pageSize}
            totalPages={domainsData?.pagination.totalPages ?? 1}
            totalCount={domainsData?.pagination.totalCount ?? 0}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPage(1);
              setPageSize(size);
            }}
            sorting={sorting}
            onSortingChange={setSorting}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            onResetPreferences={resetToDefaults}
            emptyMessage="No domains found"
            loadingMessage="Loading domains..."
          />
        </CardContent>
      </Card>

      {/* Edit Cost & Duration Dialog */}
      <Dialog
        open={isEditCostDialogOpen}
        onOpenChange={setIsEditCostDialogOpen}
      >
        <DialogContent className="sm:max-w-lg w-full">
          <DialogHeader>
            <DialogTitle className="break-words pe-8">
              Edit Cost &amp; Duration
              {editingDomain ? (
                <span className="ms-2 font-mono text-sm text-muted-foreground">
                  {editingDomain.normalizedDomainName}
                </span>
              ) : null}
            </DialogTitle>
          </DialogHeader>
          {editingDomain && (
            <EditCostAndDurationForm
              domain={editingDomain}
              onSubmit={async (data) => {
                await updateCostAndDurationMutation.mutateAsync({
                  normalizedDomainName: editingDomain.normalizedDomainName,
                  costPerYearInUsdCents: data.costPerYearInUsdCents,
                  durationConstraints: data.durationConstraints,
                });
                setIsEditCostDialogOpen(false);
                setEditingDomain(null);
              }}
              isLoading={updateCostAndDurationMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <EditHostnamesDialog
        domain={editingHostnamesDomain}
        onClose={() => setEditingHostnamesDomain(null)}
        isSubmitting={updateDomainMutation.isPending}
        onSubmit={async ({
          normalizedDomainName,
          additionalAllowedHostnames,
        }) => {
          await updateDomainMutation.mutateAsync({
            normalizedDomainName,
            additionalAllowedHostnames,
          });
        }}
      />

      {/*
        DNS Configuration dialog — a single page-level controlled
        Dialog shared across all rows. The row's dropdown simply sets
        `selectedDomain` and this dialog opens automatically via
        `!!selectedDomain`. Closing clears the selection.
      */}
      <Dialog
        open={!!selectedDomain}
        onOpenChange={(open) => {
          if (!open) setSelectedDomain(null);
        }}
      >
        <DialogContent className="!max-w-[min(96rem,calc(100vw-2rem))] w-full max-h-[min(90vh,960px)] overflow-hidden grid-rows-[auto_1fr]">
          <DialogHeader>
            <DialogTitle className="break-words pe-8">
              Configuration Status:{' '}
              <span className="font-mono text-base">{selectedDomain}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="w-full min-h-0 overflow-y-auto pe-1">
            {isLoadingStatus ? (
              <div className="text-center py-8">Loading setup status...</div>
            ) : domainStatus?.setupStatus &&
              domainStatus.setupStatus.length > 0 ? (
              <SetupStatusDisplay setupStatus={domainStatus.setupStatus[0]} />
            ) : (
              /*
                Backend returned no setup status (null / empty array).
                Most common cause: the upstream Vercel or Google Cloud
                DNS call inside `validateDomainsSetup` threw and the
                router's catch returned null. Give the admin a clear
                message and a retry instead of a blank modal.
              */
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-sm font-medium">
                  No setup status available.
                </p>
                <p className="text-xs text-muted-foreground max-w-md">
                  We couldn&apos;t compute a Vercel + DNS status for this
                  domain. This usually means the upstream Vercel or Google Cloud
                  DNS call failed — try again in a moment.
                </p>
                <AsyncButton
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await refetchStatus();
                  }}
                >
                  Retry
                </AsyncButton>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
});

// Form component for creating powered by namefi domains
function CreateDomainForm({
  onSubmit,
  isLoading = false,
}: {
  onSubmit: (data: CreateDomainFormData) => Promise<void>;
  isLoading?: boolean;
}) {
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const trpc = useTRPC();

  const form = useForm<CreateDomainFormInput, unknown, CreateDomainFormData>({
    resolver: zodResolver(createDomainSchema) as Resolver<
      CreateDomainFormInput,
      unknown,
      CreateDomainFormData
    >,
    defaultValues: {
      normalizedDomainName: '',
      additionalAllowedHostnames: [],
      additionalReservedNames: [],
      durationConstraints: {
        minDurationInYears: 1,
        maxDurationInYears: 10,
      },
      costPerYearInUsdCents: 0,
      setupVercelAndDns: false,
      setupNamefiIo: false,
      setupNamefiDev: false,
    },
  });

  // User search query
  const userSearchQuery = useQuery({
    ...trpc.admin.users.searchUsers.queryOptions({
      searchTerm: userSearchTerm,
      limit: 10,
    }),
    enabled: userSearchTerm.length >= 2,
  });

  const handleUserSelect = (user: SearchedUser) => {
    setSelectedUser(user);
    form.setValue('ownerId', user.id);
    setShowUserSearch(false);
    setUserSearchTerm('');
  };

  const handleClearSelectedUser = () => {
    setSelectedUser(null);
    form.setValue('ownerId', undefined);
  };

  const setupVercelAndDns = form.watch('setupVercelAndDns');

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) =>
          onSubmit(createDomainSchema.parse(data)),
        )}
        className="space-y-6"
      >
        {/* Basic Domain Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Domain Configuration</h3>

          <FormField
            control={form.control}
            name="normalizedDomainName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Domain Name</FormLabel>
                <FormControl>
                  <Input placeholder="example.com" {...field} />
                </FormControl>
                <FormDescription>
                  The normalized domain name (lowercase, no trailing dot)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Owner Selection */}
          <FormField
            control={form.control}
            name="ownerId"
            render={() => (
              <FormItem>
                <FormLabel>Domain Owner (Optional)</FormLabel>
                <FormControl>
                  <div>
                    {selectedUser ? (
                      <div className="flex items-center justify-between p-3 border rounded-md bg-muted">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {selectedUser.displayName ||
                              selectedUser.primaryEmail ||
                              'Unknown User'}
                          </div>
                          {selectedUser.primaryEmail && (
                            <div className="text-sm text-muted-foreground">
                              {selectedUser.primaryEmail}
                            </div>
                          )}
                          {selectedUser.walletAddresses.length > 0 && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {selectedUser.walletAddresses[0]}
                              {selectedUser.walletAddresses.length > 1 &&
                                ` (+${selectedUser.walletAddresses.length - 1} more)`}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            ID: {selectedUser.id}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearSelectedUser}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : showUserSearch ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Search by email, wallet address, or user ID..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            autoFocus
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowUserSearch(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                        {userSearchQuery.isLoading &&
                          userSearchTerm.length >= 2 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Searching users...
                            </div>
                          )}
                        {userSearchQuery.data &&
                          userSearchQuery.data.length > 0 && (
                            <div className="border rounded-md max-h-60 overflow-y-auto">
                              {userSearchQuery.data.map((user) => (
                                <button
                                  type="button"
                                  key={user.id}
                                  className="w-full p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 text-start"
                                  onClick={() => handleUserSelect(user)}
                                >
                                  <div className="space-y-1">
                                    <div className="font-medium">
                                      {user.displayName ||
                                        user.primaryEmail ||
                                        'Unknown User'}
                                    </div>
                                    {user.primaryEmail && (
                                      <div className="text-sm text-muted-foreground">
                                        {user.primaryEmail}
                                      </div>
                                    )}
                                    {user.walletAddresses.length > 0 && (
                                      <div className="text-xs text-muted-foreground font-mono">
                                        {user.walletAddresses[0]}
                                        {user.walletAddresses.length > 1 &&
                                          ` (+${user.walletAddresses.length - 1} more)`}
                                      </div>
                                    )}
                                    <div className="text-xs text-muted-foreground">
                                      ID: {user.id}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        {userSearchQuery.data &&
                          userSearchQuery.data.length === 0 &&
                          userSearchTerm.length >= 2 &&
                          !userSearchQuery.isLoading && (
                            <div className="text-sm text-muted-foreground p-3 border rounded-md">
                              No users found matching "{userSearchTerm}"
                            </div>
                          )}
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setShowUserSearch(true)}
                      >
                        <Search className="h-4 w-4 me-2" />
                        Search for domain owner...
                      </Button>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Select a user who will own this domain. If not specified, the
                  domain will be system-owned.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="durationConstraints.minDurationInYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Duration (Years)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="durationConstraints.maxDurationInYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Duration (Years)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="costPerYearInUsdCents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost per Year (USD Cents)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="500 for $5.00"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Cost in cents (e.g., 500 = $5.00)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="additionalAllowedHostnames"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Allowed Hostnames</FormLabel>
                <FormControl>
                  <HostnamesChipInput
                    value={field.value ?? []}
                    onChange={field.onChange}
                    emptyStateHint={
                      <>
                        Leave empty to auto-populate the standard namefi-hosted
                        mirrors (e.g.{' '}
                        <code className="font-mono">
                          {form.watch('normalizedDomainName') || '<domain>'}
                          .astra.namefi.io
                        </code>
                        ). Override only if you need bespoke entries.
                      </>
                    }
                  />
                </FormControl>
                <FormDescription>
                  Hostnames that are accepted as aliases for this Powered-by-
                  Namefi parent. Press Enter or comma to add an entry.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Setup Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            Automatic Configuration Options
          </h3>
          <p className="text-sm text-muted-foreground">
            Select which components to set up automatically after creating the
            domain.
          </p>

          <FormField
            control={form.control}
            name="setupVercelAndDns"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Configure Vercel Project & DNS A Record</FormLabel>
                  <FormDescription>
                    Add domain to d3servelabs/namefi-astra project and create
                    DNS A record
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* {setupVercelAndDns && (
            <FormField
              control={form.control}
              name="vercelIpAddress"
              render={({ field }) => (
                <FormItem className="ms-6">
                  <FormLabel>Vercel IP Address (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="192.168.1.1" {...field} />
                  </FormControl>
                  <FormDescription>
                    If provided, will create DNS A record pointing to this IP
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )} */}

          <FormField
            control={form.control}
            name="setupNamefiIo"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Configure {form.watch('normalizedDomainName') || '<domain>'}
                    .namefi.io
                  </FormLabel>
                  <FormDescription>
                    Create CNAME record in namefi-io zone
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="setupNamefiDev"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Configure {form.watch('normalizedDomainName') || '<domain>'}
                    .namefi.dev
                  </FormLabel>
                  <FormDescription>
                    Create CNAME record in namefi-dev zone
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-x-2 pt-4 border-t">
          <Button type="submit" disabled={isLoading} className="min-w-[120px]">
            {isLoading ? 'Creating...' : 'Create Domain'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Form component for editing cost and duration constraints
function EditCostAndDurationForm({
  domain,
  onSubmit,
  isLoading = false,
}: {
  domain: Domain;
  onSubmit: (data: {
    costPerYearInUsdCents: number;
    durationConstraints: {
      minDurationInYears: number;
      maxDurationInYears: number;
    };
  }) => Promise<void>;
  isLoading?: boolean;
}) {
  const form = useForm({
    resolver: zodResolver(
      z.object({
        costPerYearInUsdCents: z.number().min(0),
        durationConstraints: z
          .object({
            minDurationInYears: z.number().min(1),
            maxDurationInYears: z.number().min(1),
          })
          .refine(
            (data) => data.minDurationInYears <= data.maxDurationInYears,
            {
              message:
                'Min duration must be less than or equal to max duration',
              path: ['durationConstraints'],
            },
          ),
      }),
    ),
    defaultValues: {
      costPerYearInUsdCents: domain.costPerYearInUsdCents,
      durationConstraints: domain.durationConstraints,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="costPerYearInUsdCents"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost per Year (USD Cents)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="500 for $5.00"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Cost in cents (e.g., 500 = $5.00)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="durationConstraints.minDurationInYears"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Duration (Years)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="durationConstraints.maxDurationInYears"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Duration (Years)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-x-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Component to display setup status for a domain
function SetupStatusDisplay({ setupStatus }: { setupStatus: SetupStatus }) {
  // Vercel's Domains API rejects single-label names — e.g. a PBN that is
  // itself a TLD like `nfi`. The backend already short-circuits the
  // `setupVercelAndDns` mutation in that case and returns the
  // `vercelApplicable` flag on the setup-status entry; reflect it in
  // the UI so admins don't see a "Configure" button that would no-op.
  // Fallback to local TLD detection so we still behave sanely against a
  // stale backend that didn't ship the flag.
  const vercelApplicable =
    setupStatus.vercelApplicable ?? !isTldOnly(setupStatus.apexDomain.domain);

  /*
   * Tri-state helpers. A binary "fully vs. not configured" readout
   * hides the meaningful in-between case where one of the two
   * prerequisites (Vercel registration, DNS records) is done but the
   * other isn't. Admins need to see that as "Pending" so they know
   * the setup was started and what's left.
   */
  type TriState = 'verified' | 'pending' | 'not-configured';
  type SectionStatus = SetupStatus['apexDomain'];
  const triForVercelProject = (s: SectionStatus): TriState => {
    if (s.vercelIsSetup && s.vercelIsVerified) return 'verified';
    if (s.vercelIsSetup) return 'pending';
    return 'not-configured';
  };
  const triForDnsRecords = (s: SectionStatus): TriState => {
    if (s.recordsAreSetup) return 'verified';
    if (s.records && s.records.length > 0) return 'pending';
    return 'not-configured';
  };
  const triForOverall = (s: SectionStatus): TriState => {
    const verified = s.vercelIsSetup && s.vercelIsVerified && s.recordsAreSetup;
    if (verified) return 'verified';
    const hasAny =
      s.vercelIsSetup ||
      s.recordsAreSetup ||
      (s.records && s.records.length > 0);
    if (hasAny) return 'pending';
    return 'not-configured';
  };
  const triLabel = (t: TriState): string =>
    t === 'verified'
      ? 'Verified'
      : t === 'pending'
        ? 'Pending'
        : 'Not Configured';

  const apexOverall = triForOverall(setupStatus.apexDomain);
  const apexVercel = triForVercelProject(setupStatus.apexDomain);
  const apexRecords = triForDnsRecords(setupStatus.apexDomain);
  const ioOverall = triForOverall(setupStatus.namefiIoSubdomain);
  const devOverall = triForOverall(setupStatus.namefiDevSubdomain);

  // Retained for the "Already Configured" button label, which should
  // only flip when the section is fully wired up (not on Pending).
  const apexFullySetup = apexOverall === 'verified';
  const ioFullySetup = ioOverall === 'verified';
  const devFullySetup = devOverall === 'verified';
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const invalidatePoweredByNamefiDomainStatus = () => {
    queryClient.invalidateQueries({
      queryKey:
        trpc.admin.poweredByNamefi.getPoweredByNamefiDomainStatus.queryKey({
          normalizedDomainName: setupStatus.apexDomain.domain,
        }),
    });
  };
  const setupNamefiDevMutation = useMutation({
    ...trpc.admin.poweredByNamefi.setupNamefiDevSubdomain.mutationOptions(),
    onSuccess: () => {
      toast.success('Namefi.dev subdomain setup completed');
      invalidatePoweredByNamefiDomainStatus();
    },
    onError: () => {
      toast.error('Failed to setup Namefi.dev subdomain');
    },
  });
  const setupNamefiIoMutation = useMutation({
    ...trpc.admin.poweredByNamefi.setupNamefiIoSubdomain.mutationOptions(),
    onSuccess: () => {
      toast.success('Namefi.io subdomain setup completed');
      invalidatePoweredByNamefiDomainStatus();
    },
    onError: () => {
      toast.error('Failed to setup Namefi.io subdomain');
    },
  });

  const setupVercelMutation = useMutation({
    ...trpc.admin.poweredByNamefi.setupVercelAndDns.mutationOptions({
      onSuccess: () => {
        toast.success('Vercel and DNS setup completed');
        invalidatePoweredByNamefiDomainStatus();
      },
      onError: () => {
        toast.error('Failed to setup Vercel and DNS');
      },
    }),
  });

  // Parent dialog/container owns the scroll. Layout:
  //  • Summary card pinned to the top at full width — the headline
  //    status and recommendations belong above the detail cards.
  //  • Apex / IO / Dev in a 2-column grid below.
  return (
    <div className="w-full space-y-4">
      {/* Summary — full width, above the detail grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Overall Status</h4>
              <div className="flex items-center gap-x-2">
                <StatusIcon
                  isSetup={
                    setupStatus.summary.overallStatus === 'fully_configured'
                  }
                  isPending={setupStatus.summary.overallStatus === 'partial'}
                />
                <span className="text-sm capitalize">
                  {setupStatus.summary.overallStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            {setupStatus.summary.notice && (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                {setupStatus.summary.notice}
              </div>
            )}

            {setupStatus.summary.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recommendations</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {setupStatus.summary.recommendations.map((rec) => (
                    <li key={`rec-${rec.replace(/\s+/g, '-')}`}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Complete all setup steps to enable the domain for public use.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail cards — 2 columns on tablet+ (Apex/IO on row 1, Dev on
          row 2) so each card stays comfortably wide for the record
          listings. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 1: Apex Domain Setup */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Apex Domain Configuration
              </CardTitle>
              <StatusBadge
                isSetup={apexOverall === 'verified'}
                isPending={apexOverall === 'pending'}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vercel Details */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Vercel Project</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm">Status:</span>
                <div className="flex items-center gap-x-2">
                  <StatusIcon
                    isSetup={apexVercel === 'verified'}
                    isPending={apexVercel === 'pending'}
                  />
                  <span className="text-sm capitalize">
                    {triLabel(apexVercel)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Domain:</span>
                <span className="text-sm text-muted-foreground">
                  {setupStatus.apexDomain.domain}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {setupStatus.apexDomain.message}
              </div>
              {setupStatus.apexDomain.expectedRecords &&
                setupStatus.apexDomain.expectedRecords.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Expected Records:</span>
                    <div className="text-muted-foreground">
                      {setupStatus.apexDomain.expectedRecords.map((r) => (
                        <Record
                          type={'A'}
                          name={'@'}
                          value={r.value}
                          key={`expected-record-${r.value}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* DNS Records */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">DNS Records</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm">Status:</span>
                <div className="flex items-center gap-x-2">
                  <StatusIcon
                    isSetup={apexRecords === 'verified'}
                    isPending={apexRecords === 'pending'}
                  />
                  <span className="text-sm capitalize">
                    {triLabel(apexRecords)}
                  </span>
                </div>
              </div>
              {setupStatus.apexDomain.records &&
                setupStatus.apexDomain.records.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Current Records:</span>
                    <div className="text-muted-foreground">
                      {setupStatus.apexDomain.records.map((r) => (
                        <Record
                          type={r.type}
                          name={r.name}
                          value={r.rdata}
                          key={`current-record-${r.type}-${r.name}-${r.rdata}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {vercelApplicable ? (
              <AsyncButton
                variant="outline"
                size="sm"
                className="w-full"
                disabled={!setupStatus.apexDomain.canSetup}
                onClick={() =>
                  setupVercelMutation.mutateAsync({
                    normalizedDomainName: setupStatus.apexDomain.domain,
                  })
                }
              >
                {apexFullySetup
                  ? 'Already Configured'
                  : 'Configure Apex Domain'}
              </AsyncButton>
            ) : (
              <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                <strong className="block text-foreground">
                  Vercel apex setup is not applicable for TLDs.
                </strong>
                Single-label names (e.g.{' '}
                <code>{setupStatus.apexDomain.domain}</code>) cannot be
                provisioned as Vercel project domains. Use the namefi.io /
                namefi.dev subdomain mirrors below for a previewable URL.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Namefi.io Subdomain Setup */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Namefi.io Subdomain</CardTitle>
              <StatusBadge
                isSetup={ioOverall === 'verified'}
                isPending={ioOverall === 'pending'}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Subdomain:</span>
                <span className="text-sm text-muted-foreground">
                  {setupStatus.namefiIoSubdomain.domain}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <div className="flex items-center gap-x-2">
                  <StatusIcon
                    isSetup={ioOverall === 'verified'}
                    isPending={ioOverall === 'pending'}
                  />
                  <span className="text-sm capitalize">
                    {triLabel(ioOverall)}
                  </span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {setupStatus.namefiIoSubdomain.message}
              </div>
              {setupStatus.namefiIoSubdomain.records &&
                setupStatus.namefiIoSubdomain.records.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Current Records:</span>
                    <div className="text-muted-foreground">
                      {setupStatus.namefiIoSubdomain.records.map((r) => (
                        <Record
                          type={r.type}
                          name={r.name}
                          value={r.rdata}
                          key={`current-record-${r.type}-${r.name}-${r.rdata}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <AsyncButton
              variant="outline"
              size="sm"
              className="w-full"
              disabled={!setupStatus.namefiIoSubdomain.canSetup}
              onClick={() =>
                setupNamefiIoMutation.mutateAsync({
                  normalizedDomainName: setupStatus.apexDomain.domain,
                })
              }
            >
              {ioFullySetup
                ? 'Already Configured'
                : 'Configure Namefi.io Subdomain'}
            </AsyncButton>
          </CardContent>
        </Card>

        {/* Section 3: Namefi.dev Subdomain Setup */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Namefi.dev Subdomain</CardTitle>
              <StatusBadge
                isSetup={devOverall === 'verified'}
                isPending={devOverall === 'pending'}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Subdomain:</span>
                <span className="text-sm text-muted-foreground">
                  {setupStatus.namefiDevSubdomain.domain}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <div className="flex items-center gap-x-2">
                  <StatusIcon
                    isSetup={devOverall === 'verified'}
                    isPending={devOverall === 'pending'}
                  />
                  <span className="text-sm capitalize">
                    {triLabel(devOverall)}
                  </span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {setupStatus.namefiDevSubdomain.message}
              </div>
              {setupStatus.namefiDevSubdomain.records &&
                setupStatus.namefiDevSubdomain.records.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Current Records:</span>
                    <div className="text-muted-foreground">
                      {setupStatus.namefiDevSubdomain.records.map((r) => (
                        <Record
                          type={r.type}
                          name={r.name}
                          value={r.rdata}
                          key={`current-record-${r.type}-${r.name}-${r.rdata}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <AsyncButton
              variant="outline"
              size="sm"
              className="w-full"
              disabled={!setupStatus.namefiDevSubdomain.canSetup}
              onClick={() =>
                setupNamefiDevMutation.mutateAsync({
                  normalizedDomainName: setupStatus.apexDomain.domain,
                })
              }
            >
              {devFullySetup
                ? 'Already Configured'
                : 'Configure Namefi.dev Subdomain'}
            </AsyncButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Record({
  type,
  name,
  value,
}: {
  type: string;
  name: string;
  value: string[] | string;
}) {
  const valueString = Array.isArray(value) ? value : [value];
  return (
    <pre className="text-md font-semibold text-gray-200 border-1 border-brand-primary/50 rounded-md px-2 py-1 my-1 w-min space-x-[6ch] ">
      <span className="align-top">{type}</span>
      <span className="align-top">{name}</span>
      <span className="inline-block align-top">
        {valueString.map((v) => (
          <>
            <span key={v}>{v}</span>
            <br />
          </>
        ))}
      </span>
    </pre>
  );
}
