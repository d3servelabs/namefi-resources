'use client';
import { Table, Td, Th, Thead, Tr } from '@/components/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@namefi-astra/ui/components/shadcn/card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { TableBody } from '@namefi-astra/ui/components/shadcn/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { useTRPC } from '@/lib/trpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type FC, useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Flame,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { AutoTruncateTextV2 } from '../auto-truncate-text-v2';
import { PageShell } from '@/components/page-shell';
import { UserWalletAvatar } from '../user-avatar';
import { getChain } from '@namefi-astra/utils/chains';
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
import { useDebounceValue } from 'usehooks-ts';

type DomainToBurn = {
  domain: string;
  chainId: number;
  ownerAddress: string;
  nftExpirationDate: Date;
  daysSinceExpiration: number;
  registrar?: string;
  [key: string]: unknown;
};

type EnrichedDomainToBurn = DomainToBurn & {
  autoRenewEnabled: boolean | null;
  userEmail: string | null;
};

const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center gap-x-4 p-4 border rounded-lg"
      >
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[120px]" />
      </div>
    ))}
  </div>
);

interface BulkBurnManagementContentProps {
  workflowId: string;
}

function BulkBurnManagementContent({
  workflowId,
}: BulkBurnManagementContentProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(
    new Set(),
  );
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Fetch bulk burn workflow - either by ID or get the pending one
  const {
    data: workflowData,
    isLoading,
    refetch,
  } = useQuery({
    ...trpc.admin.bulkBurn.getBulkBurnWorkflowById.queryOptions({ workflowId }),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Approve mutation
  const approveMutation = useMutation(
    trpc.admin.bulkBurn.approveBulkBurn.mutationOptions({
      onSuccess: () => {
        toast.success('Bulk burn approved successfully');
        setSelectedDomains(new Set());
        setApproveDialogOpen(false);
        queryClient.invalidateQueries({
          queryKey: trpc.admin.bulkBurn.getPendingBulkBurnWorkflow.queryKey(),
        });
      },
      onError: (error: any) => {
        toast.error(`Failed to approve bulk burn: ${error.message}`);
      },
    }),
  );

  // Cancel mutation
  const cancelMutation = useMutation(
    trpc.admin.bulkBurn.cancelBulkBurn.mutationOptions({
      onSuccess: () => {
        toast.success('Bulk burn cancelled successfully');
        setCancelDialogOpen(false);
        queryClient.invalidateQueries({
          queryKey: trpc.admin.bulkBurn.getPendingBulkBurnWorkflow.queryKey(),
        });
      },
      onError: (error: any) => {
        toast.error(`Failed to cancel bulk burn: ${error.message}`);
      },
    }),
  );

  const verifiedDomains = workflowData?.state?.verifiedDomains || [];
  const verifiedDomainsMap = useMemo(() => {
    return new Map(verifiedDomains.map((d) => [d.domain, d]));
  }, [verifiedDomains]);
  const isWaitingApproval = workflowData?.status === 'WAITING_APPROVAL';

  const skippedDomains = workflowData?.state?.skippedDomains || [];
  const successfulBurns = useMemo(
    () =>
      workflowData?.state?.successfulBurns.map((d) => ({
        ...d,
        chainId: verifiedDomainsMap.get(d.domain)?.chainId,
      })) ?? [],
    [workflowData?.state?.successfulBurns, verifiedDomainsMap],
  );
  const failedBurns = useMemo(
    () =>
      workflowData?.state?.failedBurns.map((d) => ({
        ...d,
        chainId: verifiedDomainsMap.get(d.domain)?.chainId,
      })) ?? [],
    [workflowData?.state?.failedBurns, verifiedDomainsMap],
  );

  // Enrichment query for autorenew + user email
  const enrichmentQuery = useQuery({
    ...trpc.admin.bulkBurn.enrichBulkBurnDomains.queryOptions({
      domainNames: verifiedDomains.map((d) => d.domain),
    }),
    enabled: verifiedDomains.length > 0,
    staleTime: 60_000,
  });

  const enrichedDomains = useMemo<EnrichedDomainToBurn[]>(() => {
    if (!enrichmentQuery.isSuccess) {
      return verifiedDomains.map((d) => ({
        ...d,
        autoRenewEnabled: null,
        userEmail: null,
      }));
    }
    const enrichMap = enrichmentQuery.data;
    return verifiedDomains.map((d) => ({
      ...d,
      autoRenewEnabled: enrichMap[d.domain]?.autoRenewEnabled ?? null,
      userEmail: enrichMap[d.domain]?.userEmail ?? null,
    }));
  }, [verifiedDomains, enrichmentQuery.data, enrichmentQuery.isSuccess]);

  // Table state
  const [drizzlerFilterState, setDrizzlerFilterState] =
    useState<DrizzlerFilterState>({ columnFilters: {}, customFilters: {} });
  const [debouncedFilterState] = useDebounceValue(drizzlerFilterState, 300);
  const [page, setPage] = useState(1);

  const {
    preferences: { columnVisibility, sorting, pageSize },
    setColumnVisibility,
    setSorting,
    setPageSize,
    resetToDefaults,
  } = useTablePreferences({
    tableId: 'admin-bulk-burn-verified',
    defaultPreferences: { pageSize: 25 },
  });

  const drizzlerFilterOptions = useMemo(
    () =>
      convertToDrizzlerFilterOptions<EnrichedDomainToBurn>(
        debouncedFilterState.columnFilters,
      ),
    [debouncedFilterState],
  );

  const filteredDomains = useMemo(() => {
    if (!drizzlerFilterOptions) return enrichedDomains;
    return applyDrizzlerFilterOnDataset(enrichedDomains, drizzlerFilterOptions);
  }, [enrichedDomains, drizzlerFilterOptions]);

  const sortAccessors: Record<string, (row: EnrichedDomainToBurn) => unknown> =
    useMemo(
      () => ({
        domain: (r) => r.domain,
        ownerAddress: (r) => r.ownerAddress,
        autoRenewEnabled: (r) => r.autoRenewEnabled,
        userEmail: (r) => r.userEmail,
        daysSinceExpiration: (r) => r.daysSinceExpiration,
        registrar: (r) => r.registrar ?? null,
        chainId: (r) => r.chainId,
        nftExpirationDate: (r) => r.nftExpirationDate,
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

  const filterStrategy = useDrizzlerServerFilterStrategy<EnrichedDomainToBurn>({
    filterConfig: {
      domain: {
        id: 'domain',
        label: 'Domain',
        type: 'text',
        columnId: 'domain',
      },
      ownerAddress: {
        id: 'ownerAddress',
        label: 'Owner',
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
        allowedOperators: ['eq', 'neq'],
      },
      userEmail: {
        id: 'userEmail',
        label: 'User Email',
        type: 'text',
        columnId: 'userEmail',
      },
      daysSinceExpiration: {
        id: 'daysSinceExpiration',
        label: 'Days Expired',
        type: 'number',
        columnId: 'daysSinceExpiration',
      },
      registrar: {
        id: 'registrar',
        label: 'Registrar',
        type: 'text',
        columnId: 'registrar',
      },
    },
    onDrizzlerFilterChange: (newState) => {
      setDrizzlerFilterState(newState);
      setPage(1);
    },
  });

  const handleCopyWallet = useCallback(async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Copied address successfully');
    } catch {
      toast.error('Failed to copy address');
    }
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedDomains.size === filteredDomains.length) {
      setSelectedDomains(new Set());
    } else {
      setSelectedDomains(new Set(filteredDomains.map((d) => d.domain)));
    }
  }, [selectedDomains.size, filteredDomains]);

  const handleSelectDomain = useCallback(
    (domain: string) => {
      const newSelected = new Set(selectedDomains);
      if (newSelected.has(domain)) {
        newSelected.delete(domain);
      } else {
        newSelected.add(domain);
      }
      setSelectedDomains(newSelected);
    },
    [selectedDomains],
  );

  const verifiedColumns = useMemo<ColumnDef<EnrichedDomainToBurn, any>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={
              selectedDomains.size === filteredDomains.length &&
              filteredDomains.length > 0
            }
            disabled={!isWaitingApproval}
            onCheckedChange={handleSelectAll}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedDomains.has(row.original.domain)}
            disabled={!isWaitingApproval}
            onCheckedChange={() => handleSelectDomain(row.original.domain)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'domain',
        header: 'Domain',
        cell: ({ row }) => (
          <AutoTruncateTextV2
            minCharactersToDisplay={30}
            initialCharactersCountToDisplay={30}
          >
            {row.original.domain}
          </AutoTruncateTextV2>
        ),
      },
      {
        accessorKey: 'chainId',
        header: 'Chain',
        cell: ({ row }) => (
          <Badge variant="outline">{getChainName(row.original.chainId)}</Badge>
        ),
      },
      {
        accessorKey: 'ownerAddress',
        header: 'Owner',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 px-1 py-1 bg-muted rounded-xl max-w-full">
            <UserWalletAvatar
              address={row.original.ownerAddress}
              className="size-6"
            />
            <div className="flex-1 min-w-0">
              <AutoTruncateTextV2
                initialCharactersCountToDisplay={16}
                minCharactersToDisplay={16}
                className="font-mono text-xs"
              >
                {row.original.ownerAddress}
              </AutoTruncateTextV2>
            </div>
            <button
              type="button"
              onClick={() => handleCopyWallet(row.original.ownerAddress)}
              className="p-1 hover:bg-background rounded transition-colors flex-shrink-0"
              title="Copy address"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        ),
      },
      {
        accessorKey: 'autoRenewEnabled',
        header: 'Auto Renew',
        cell: ({ row }) => {
          const val = row.original.autoRenewEnabled;
          if (val == null)
            return <span className="text-sm text-muted-foreground">N/A</span>;
          return val ? (
            <Badge variant="default" className="bg-green-600">
              Enabled
            </Badge>
          ) : (
            <Badge variant="secondary">Disabled</Badge>
          );
        },
      },
      {
        accessorKey: 'userEmail',
        header: 'User Email',
        cell: ({ row }) => {
          const email = row.original.userEmail;
          if (!email)
            return <span className="text-sm text-muted-foreground">-</span>;
          return (
            <AutoTruncateTextV2
              minCharactersToDisplay={20}
              initialCharactersCountToDisplay={20}
              className="text-sm"
            >
              {email}
            </AutoTruncateTextV2>
          );
        },
      },
      {
        accessorKey: 'nftExpirationDate',
        header: 'NFT Expiry',
        cell: ({ row }) => (
          <span className="text-sm">
            {format(new Date(row.original.nftExpirationDate), 'yyyy-MM-dd')}
          </span>
        ),
      },
      {
        accessorKey: 'daysSinceExpiration',
        header: 'Days Expired',
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.daysSinceExpiration} days
          </Badge>
        ),
      },
      {
        accessorKey: 'registrar',
        header: 'Registrar',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.registrar || 'N/A'}
          </span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      selectedDomains,
      filteredDomains.length,
      isWaitingApproval,
      handleCopyWallet,
      handleSelectAll,
      handleSelectDomain,
    ],
  );

  const handleApprove = () => {
    if (selectedDomains.size === 0) {
      toast.error('Please select at least one domain to burn');
      return;
    }
    setApproveDialogOpen(true);
  };

  const handleConfirmApprove = () => {
    if (!workflowData?.workflowId) {
      toast.error('Workflow ID is required');
      return;
    }
    approveMutation.mutate({
      workflowId: workflowData.workflowId,
      domainNames: Array.from(selectedDomains),
    });
  };

  const handleCancel = () => {
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!workflowData?.workflowId) {
      toast.error('Workflow ID is required');
      return;
    }
    cancelMutation.mutate({
      workflowId: workflowData.workflowId,
    });
  };

  if (isLoading) {
    return (
      <PageShell padding="admin">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-6 h-6" />
              Bulk Burn Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingSkeletons />
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!workflowData?.exists) {
    return (
      <PageShell padding="admin">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-6 h-6" />
              Bulk Burn Management
            </CardTitle>
            <CardDescription>
              Manage bulk burning of expired domain NFTs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="rounded-full bg-muted p-4">
                <Flame className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  No Pending Bulk Burn Workflow
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  There are currently no bulk burn operations waiting for
                  approval.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Bulk burn workflows are triggered automatically by the daily
                  export/expiration report when expired domains are ready to
                  burn.
                </p>
              </div>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="mt-4"
              >
                <RefreshCw className="w-4 h-4 me-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const {
    workflowId: currentWorkflowId,
    status,
    startTime,
    state,
  } = workflowData;
  const _isProcessing = status === 'PROCESSING';
  const isCompleted = status === 'COMPLETED' || status === 'CANCELLED';

  return (
    <PageShell padding="admin" className="space-y-6">
      {/* Workflow Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-6 h-6" />
                Bulk Burn Workflow
              </CardTitle>
              <CardDescription className="mt-2">
                Workflow ID:{' '}
                <code className="text-xs">{currentWorkflowId}</code>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(status || '')}
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Started</p>
              <p className="text-sm font-medium">
                {startTime
                  ? formatDistanceToNow(new Date(startTime), {
                      addSuffix: true,
                    })
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Requested</p>
              <p className="text-sm font-medium">
                {state?.totalRequested || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Verified</p>
              <p className="text-sm font-medium text-green-600">
                {verifiedDomains.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Skipped</p>
              <p className="text-sm font-medium text-yellow-600">
                {skippedDomains.length}
              </p>
            </div>
          </div>

          {isCompleted && (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">
                  Successful Burns
                </p>
                <p className="text-sm font-medium text-green-600">
                  {successfulBurns.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed Burns</p>
                <p className="text-sm font-medium text-red-600">
                  {failedBurns.length}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Successful Burns */}
      {successfulBurns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Successful Burns ({successfulBurns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <Thead>
                  <Tr>
                    <Th>Domain</Th>
                    <Th>Transaction Hash</Th>
                  </Tr>
                </Thead>
                <TableBody>
                  {successfulBurns.map((burn) => (
                    <Tr key={burn.domain}>
                      <Td>
                        <AutoTruncateTextV2
                          minCharactersToDisplay={30}
                          initialCharactersCountToDisplay={30}
                        >
                          {burn.domain}
                        </AutoTruncateTextV2>
                      </Td>
                      <Td>
                        <a
                          href={
                            getTransactionExplorerUrl(
                              burn.chainId,
                              burn.txHash,
                            ) ?? '#'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <AutoTruncateTextV2
                            minCharactersToDisplay={10}
                            initialCharactersCountToDisplay={10}
                          >
                            {burn.txHash}
                          </AutoTruncateTextV2>
                        </a>
                      </Td>
                    </Tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed Burns */}
      {failedBurns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Failed Burns ({failedBurns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <Thead>
                  <Tr>
                    <Th>Domain</Th>
                    <Th>Error</Th>
                  </Tr>
                </Thead>
                <TableBody>
                  {failedBurns.map((burn) => (
                    <Tr key={burn.domain}>
                      <Td>
                        <AutoTruncateTextV2
                          minCharactersToDisplay={30}
                          initialCharactersCountToDisplay={30}
                        >
                          {burn.domain}
                        </AutoTruncateTextV2>
                      </Td>
                      <Td className="text-sm text-red-600">{burn.error}</Td>
                    </Tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5" />
              Approve Bulk Burn
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to approve burning {selectedDomains.size} domain
              NFT(s). This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Lock the selected NFTs if not already locked</li>
                <li>Permanently burn the NFT tokens</li>
                <li>This action cannot be undone</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmApprove}
              disabled={approveMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 me-2" />
                  Approve Burn
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Cancel Bulk Burn Workflow
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this bulk burn workflow? No
              domains will be burned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Workflow'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Skipped Domains */}
      {skippedDomains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Skipped Domains ({skippedDomains.length})
            </CardTitle>
            <CardDescription>
              These domains were skipped during verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <Thead>
                  <Tr>
                    <Th>Domain</Th>
                    <Th>Reason</Th>
                  </Tr>
                </Thead>
                <TableBody>
                  {skippedDomains.map((domain) => (
                    <Tr key={domain.domain}>
                      <Td>
                        <AutoTruncateTextV2
                          minCharactersToDisplay={30}
                          initialCharactersCountToDisplay={30}
                        >
                          {domain.domain}
                        </AutoTruncateTextV2>
                      </Td>
                      <Td className="text-sm text-muted-foreground">
                        {domain.reason}
                      </Td>
                    </Tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Verified Domains Table */}
      {verifiedDomains.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Domains Ready to Burn</CardTitle>
                <CardDescription>
                  Select domains to approve for burning ({selectedDomains.size}{' '}
                  of {filteredDomains.length} selected)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSelectAll}
                  variant="outline"
                  size="sm"
                  disabled={!isWaitingApproval || filteredDomains.length === 0}
                >
                  {selectedDomains.size === filteredDomains.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
                <Button
                  onClick={handleApprove}
                  variant="default"
                  size="sm"
                  disabled={!isWaitingApproval || selectedDomains.size === 0}
                  className="gap-2"
                >
                  <Flame className="w-4 h-4" />
                  Approve Burn ({selectedDomains.size})
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="destructive"
                  size="sm"
                  disabled={!isWaitingApproval}
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Workflow
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {enrichmentQuery.isError && (
              <div className="mb-4 flex items-center gap-2 rounded-md border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-500">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Failed to load auto-renew and email data. These columns may show
                incomplete results.
              </div>
            )}
            <ExtensibleDataTable<EnrichedDomainToBurn, typeof filterStrategy>
              filterStrategy={filterStrategy}
              columns={verifiedColumns}
              data={paginatedDomains}
              isLoading={isLoading || enrichmentQuery.isLoading}
              isFetching={enrichmentQuery.isFetching}
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              totalCount={filteredDomains.length}
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
              emptyMessage="No verified domains"
              loadingMessage="Loading domains..."
            />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

export function getTransactionExplorerUrl(
  chainId: number | null | undefined,
  txHash: string | null | undefined,
): string | null {
  if (chainId === null || chainId === undefined) return null;
  if (!txHash) return null;
  const chain = getChain(chainId);
  const baseUrl = chain?.blockExplorers?.default?.url;
  if (!baseUrl) return null;
  const normalizedBaseUrl = baseUrl.endsWith('/')
    ? baseUrl.slice(0, -1)
    : baseUrl;
  return `${normalizedBaseUrl}/tx/${txHash}`;
}

export default function BulkBurnManagement({
  workflowId,
}: {
  workflowId?: string;
}) {
  if (!workflowId) {
    return <div>Invalid workflow ID</div>;
  }
  return <BulkBurnManagementContent workflowId={workflowId} />;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'VERIFYING':
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Verifying
        </Badge>
      );
    case 'WAITING_APPROVAL':
      return (
        <Badge variant="default" className="gap-1">
          <Clock className="w-3 h-3" />
          Waiting for Approval
        </Badge>
      );
    case 'PROCESSING':
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Processing Burns
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="default" className="gap-1 bg-green-500">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getChainName(chainId: number) {
  switch (chainId) {
    case 1:
      return 'Ethereum';
    case 8453:
      return 'Base';
    case 11155111:
      return 'Sepolia';
    default:
      return `Chain ${chainId}`;
  }
}
