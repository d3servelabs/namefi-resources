'use client';

import {
  type FC,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  ColumnDef,
  Row,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounceValue } from 'usehooks-ts';
import { format } from 'date-fns';
import { CirclePlay, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FilterOperators } from '@samyx/drizzler-filters-sorters';
import { AuthRequired } from '@/components/auth-required';
import { TruncatedTextWithHover } from '@/components/truncated-text-with-hover';
import { PageShell } from '@/components/page-shell';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import {
  convertToDrizzlerFilterOptions,
  type DrizzlerFilterState,
  useDrizzlerServerFilterStrategy,
} from '@/components/table/filters';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@namefi-astra/ui/components/shadcn/accordion';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';
import { useAuth } from '@/hooks/use-auth';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { useTRPC } from '@/lib/trpc';
import { NftManagementCard } from './nft-management-card';
import {
  AutoRenewBadge,
  ChainCell,
  DateStateBadge,
  DomainNameCell,
  DomainStatusBadge,
  formatDateOnly,
  NftActionsCell,
  type NftManagementRow,
  NftStatusBadge,
  OwnerAddressCell,
  PrimaryEmailValue,
  PrivyUserIdValue,
  RegistrarValue,
  UserIdValue,
  YesNo,
} from './nft-management-cells';
import { NftKnownIssuesCard } from './nft-known-issues-card';

type WorkflowRow = {
  domainName: string;
  chainId: number;
  workflowId: string;
  startTime: Date | string | null;
  status: string;
};

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  normalizedDomainName: true,
  chainId: true,
  ownerAddress: true,
  autoRenewEnabled: true,
  domainStatus: true,
  nftStatus: true,
  nftExpirationTime: true,
  domainExpirationTime: true,
  dateState: true,
  registrarKey: true,
  actions: true,
  userId: false,
  displayName: false,
  primaryEmail: false,
  privyUserId: false,
  isPoweredByNamefiDomain: false,
  canBurn: false,
  hasMissingData: false,
  hasDateMismatch: false,
  needsExpirationReview: false,
  isExpired: false,
  lastIndexedAt: false,
  asOfBlockNumber: false,
};

const BOOLEAN_FILTER_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
] as const;
const TOGGLE_FILTER_OPTIONS = [
  { value: 'true', label: 'Enabled' },
  { value: 'false', label: 'Disabled' },
] as const;
const DOMAIN_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'not-found', label: 'Not Found' },
] as const;
const NFT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'not-available', label: 'N/A' },
] as const;
const DATE_STATE_OPTIONS = [
  { value: 'match', label: 'Match' },
  { value: 'missing-data', label: 'Missing Data' },
  { value: 'date-mismatch', label: 'Date Mismatch' },
] as const;
const REQUIRED_SELECT_OPERATORS: FilterOperators[] = ['eq', 'neq'];

const LOADING_ROW_KEYS = [
  'nft-loading-1',
  'nft-loading-2',
  'nft-loading-3',
  'nft-loading-4',
  'nft-loading-5',
  'nft-loading-6',
] as const;

const formatWorkflowDate = (value: Date | string | null | undefined) => {
  if (!value) return 'N/A';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';

  return format(date, 'yyyy-MM-dd HH:mm');
};

const LoadingSkeletons: FC = () => (
  <Card>
    <CardHeader className="space-y-3">
      <Skeleton className="h-7 w-52" />
      <Skeleton className="h-4 w-80" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-72" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="space-y-3">
        {LOADING_ROW_KEYS.map((key) => (
          <Skeleton key={key} className="h-12 w-full" />
        ))}
      </div>
    </CardContent>
  </Card>
);

function WorkflowTableSection(props: {
  value: string;
  title: string;
  count: number;
  workflows: WorkflowRow[] | undefined;
  emptyMessage: string;
  accentClassName: string;
}) {
  const { value, title, count, workflows, emptyMessage, accentClassName } =
    props;

  return (
    <AccordionItem value={value}>
      <AccordionTrigger>
        <div className="flex items-center gap-2 text-start">
          <span>{title}</span>
          <Badge variant="secondary">{count}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {workflows && workflows.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Workflow ID</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow) => (
                  <TableRow key={workflow.workflowId}>
                    <TableCell className="font-medium">
                      <TruncatedTextWithHover maxLength={28}>
                        {workflow.domainName}
                      </TruncatedTextWithHover>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{workflow.chainId}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <TruncatedTextWithHover maxLength={24}>
                        {workflow.workflowId}
                      </TruncatedTextWithHover>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatWorkflowDate(workflow.startTime)}
                    </TableCell>
                    <TableCell>
                      <Badge className={accentClassName}>
                        {workflow.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function ActiveWorkflowsDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  burnWorkflows: WorkflowRow[] | undefined;
  fixWorkflows: WorkflowRow[] | undefined;
  extendWorkflows: WorkflowRow[] | undefined;
}) {
  const { open, onOpenChange, burnWorkflows, fixWorkflows, extendWorkflows } =
    props;

  const totalActiveWorkflows =
    (burnWorkflows?.length ?? 0) +
    (fixWorkflows?.length ?? 0) +
    (extendWorkflows?.length ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-[95vw] overflow-y-auto lg:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CirclePlay className="h-5 w-5" />
            Active Workflows ({totalActiveWorkflows})
          </DialogTitle>
        </DialogHeader>

        <Accordion multiple defaultValue={['burn', 'fix', 'extend']}>
          <WorkflowTableSection
            value="burn"
            title="Burn NFT Workflows"
            count={burnWorkflows?.length ?? 0}
            workflows={burnWorkflows}
            emptyMessage="No active burn workflows"
            accentClassName="bg-red-100 text-red-800 hover:bg-red-100"
          />
          <WorkflowTableSection
            value="fix"
            title="Fix NFT Expiration Workflows"
            count={fixWorkflows?.length ?? 0}
            workflows={fixWorkflows}
            emptyMessage="No active fix expiration workflows"
            accentClassName="bg-blue-100 text-blue-800 hover:bg-blue-100"
          />
          <WorkflowTableSection
            value="extend"
            title="Extend Registration Workflows"
            count={extendWorkflows?.length ?? 0}
            workflows={extendWorkflows}
            emptyMessage="No active extend registration workflows"
            accentClassName="bg-green-100 text-green-800 hover:bg-green-100"
          />
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}

const NftManagementTable = memo(function NftManagementTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [burnInProgress, setBurnInProgress] = useState<Set<string>>(
    () => new Set(),
  );

  const {
    preferences: { sorting, pageSize, columnVisibility },
    setSorting,
    setPageSize,
    setColumnVisibility,
    resetToDefaults,
  } = useTablePreferences({
    tableId: 'admin-nft-management',
    defaultPreferences: {
      sorting: [{ id: 'normalizedDomainName', desc: false }],
      pageSize: 25,
      columnVisibility: DEFAULT_COLUMN_VISIBILITY,
    },
  });

  const [drizzlerFilterState, setDrizzlerFilterState] =
    useState<DrizzlerFilterState>({
      columnFilters: {},
      customFilters: {},
    });
  const [debouncedDrizzlerFilterState] = useDebounceValue(
    drizzlerFilterState,
    500,
  );
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 300);

  const backendFilters = useMemo(
    () =>
      convertToDrizzlerFilterOptions(
        debouncedDrizzlerFilterState.columnFilters,
      ),
    [debouncedDrizzlerFilterState],
  );

  const backendSorting = useMemo(() => {
    if (!sorting || sorting.length === 0) return undefined;

    return sorting.map((sort) => ({
      column: sort.id,
      order: sort.desc ? ('desc' as const) : ('asc' as const),
    }));
  }, [sorting]);

  const nftStatusQuery = useQuery(
    trpc.admin.nft.getNftsWithExpirationStatus.queryOptions(
      {
        page,
        pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        filters: backendFilters,
        sorting: backendSorting,
      },
      {
        placeholderData: (previousData) => previousData,
      },
    ),
  );

  const workflowQueryOptions = useMemo(
    () => ({
      refetchInterval: (query: { state: { error: unknown } }) =>
        query.state.error ? false : workflowModalOpen ? 5000 : 30000,
      retry: 2,
      retryDelay: 1000,
      refetchOnWindowFocus: workflowModalOpen,
      refetchIntervalInBackground: workflowModalOpen,
    }),
    [workflowModalOpen],
  );

  const burnWorkflowsQuery = useQuery({
    ...trpc.admin.nft.getActiveBurnWorkflows.queryOptions(),
    ...workflowQueryOptions,
  });
  const fixWorkflowsQuery = useQuery({
    ...trpc.admin.nft.getActiveFixExpirationWorkflows.queryOptions(),
    ...workflowQueryOptions,
  });
  const extendWorkflowsQuery = useQuery({
    ...trpc.admin.nft.getActiveExtendRegistrationWorkflows.queryOptions(),
    ...workflowQueryOptions,
  });

  const burnNftMutation = useMutation(
    trpc.admin.nft.burnNft.mutationOptions({
      onSuccess: async (result) => {
        toast.success(`NFT burn workflow started: ${result.workflowId}`);
        await queryClient.invalidateQueries({
          queryKey: trpc.admin.nft.getNftsWithExpirationStatus.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(`Failed to burn NFT: ${error.message}`);
      },
      onSettled: (_, __, variables) => {
        setBurnInProgress((previous) => {
          const next = new Set(previous);
          next.delete(`${variables.normalizedDomainName}-${variables.chainId}`);
          return next;
        });
      },
    }),
  );

  const fixNftExpirationMutation = useMutation(
    trpc.admin.nft.fixNftExpiration.mutationOptions({
      onSuccess: async () => {
        toast.success('NFT expiration fix workflow started');
        await queryClient.invalidateQueries({
          queryKey: trpc.admin.nft.getNftsWithExpirationStatus.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(`Failed to fix NFT expiration: ${error.message}`);
      },
    }),
  );

  const activeBurnWorkflowKeys = useMemo(
    () =>
      new Set(
        (burnWorkflowsQuery.data ?? []).map(
          (workflow) => `${workflow.domainName}-${workflow.chainId}`,
        ),
      ),
    [burnWorkflowsQuery.data],
  );

  const totalActiveWorkflows =
    (burnWorkflowsQuery.data?.length ?? 0) +
    (fixWorkflowsQuery.data?.length ?? 0) +
    (extendWorkflowsQuery.data?.length ?? 0);

  const isWorkflowsLoading =
    burnWorkflowsQuery.isLoading ||
    fixWorkflowsQuery.isLoading ||
    extendWorkflowsQuery.isLoading;

  useEffect(() => {
    const totalPages = Math.max(
      nftStatusQuery.data?.pagination.totalPages ?? 1,
      1,
    );
    if (page < 1) {
      setPage(1);
      return;
    }
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, nftStatusQuery.data?.pagination.totalPages]);

  const handleSearchChange = useCallback((value: string) => {
    setPage(1);
    setSearchTerm(value);
  }, []);

  const handleSortingChange = useCallback(
    (updater: SetStateAction<SortingState>) => {
      setPage(1);
      setSorting(updater);
    },
    [setSorting],
  );

  const handleBurnNft = useCallback(
    async (normalizedDomainName: string, chainId: number) => {
      const rowKey = `${normalizedDomainName}-${chainId}`;
      setBurnInProgress((previous) => new Set(previous).add(rowKey));

      try {
        await burnNftMutation.mutateAsync({
          normalizedDomainName,
          chainId,
        });
      } catch {
        // handled by mutation callbacks
      }
    },
    [burnNftMutation],
  );

  const handleFixNftExpiration = useCallback(
    async (normalizedDomainName: string, chainId: number) => {
      try {
        await fixNftExpirationMutation.mutateAsync({
          normalizedDomainName,
          chainId,
        });
      } catch {
        // handled by mutation callbacks
      }
    },
    [fixNftExpirationMutation],
  );

  const filterStrategy = useDrizzlerServerFilterStrategy<NftManagementRow>({
    filterConfig: {
      normalizedDomainName: {
        id: 'normalizedDomainName',
        label: 'Domain',
        type: 'text',
        columnId: 'normalizedDomainName',
      },
      ownerAddress: {
        id: 'ownerAddress',
        label: 'Owner Address',
        type: 'text',
        columnId: 'ownerAddress',
      },
      autoRenewEnabled: {
        id: 'autoRenewEnabled',
        label: 'Auto Renew',
        type: 'select',
        columnId: 'autoRenewEnabled',
        options: [...TOGGLE_FILTER_OPTIONS],
        allowedOperators: ['eq', 'neq', 'isnull', 'not_isnull'],
      },
      domainStatus: {
        id: 'domainStatus',
        label: 'Domain Status',
        type: 'select',
        columnId: 'domainStatus',
        options: [...DOMAIN_STATUS_OPTIONS],
        allowedOperators: REQUIRED_SELECT_OPERATORS,
      },
      nftStatus: {
        id: 'nftStatus',
        label: 'NFT Status',
        type: 'select',
        columnId: 'nftStatus',
        options: [...NFT_STATUS_OPTIONS],
        allowedOperators: REQUIRED_SELECT_OPERATORS,
      },
      chainId: {
        id: 'chainId',
        label: 'Chain',
        type: 'number',
        columnId: 'chainId',
        allowedOperators: ['eq', 'neq'],
      },
      nftExpirationTime: {
        id: 'nftExpirationTime',
        label: 'NFT Expiration',
        type: 'date',
        columnId: 'nftExpirationTime',
      },
      domainExpirationTime: {
        id: 'domainExpirationTime',
        label: 'Domain Expiration',
        type: 'date',
        columnId: 'domainExpirationTime',
      },
      registrarKey: {
        id: 'registrarKey',
        label: 'Registrar',
        type: 'text',
        columnId: 'registrarKey',
      },
      isExpired: {
        id: 'isExpired',
        label: 'Has Any Expired Status',
        type: 'select',
        columnId: 'isExpired',
        options: [...BOOLEAN_FILTER_OPTIONS],
        allowedOperators: REQUIRED_SELECT_OPERATORS,
      },
      canBurn: {
        id: 'canBurn',
        label: 'Can Burn',
        type: 'select',
        columnId: 'canBurn',
        options: [...BOOLEAN_FILTER_OPTIONS],
        allowedOperators: REQUIRED_SELECT_OPERATORS,
      },
      dateState: {
        id: 'dateState',
        label: 'Date State',
        type: 'select',
        columnId: 'dateState',
        options: [...DATE_STATE_OPTIONS],
        allowedOperators: REQUIRED_SELECT_OPERATORS,
      },
      hasMissingData: {
        id: 'hasMissingData',
        label: 'Missing Data',
        type: 'select',
        columnId: 'hasMissingData',
        options: [...BOOLEAN_FILTER_OPTIONS],
        allowedOperators: REQUIRED_SELECT_OPERATORS,
      },
      hasDateMismatch: {
        id: 'hasDateMismatch',
        label: 'Strict Date Mismatch',
        type: 'select',
        columnId: 'hasDateMismatch',
        options: [...BOOLEAN_FILTER_OPTIONS],
        allowedOperators: REQUIRED_SELECT_OPERATORS,
      },
      needsExpirationReview: {
        id: 'needsExpirationReview',
        label: 'Needs Expiration Review',
        type: 'select',
        columnId: 'needsExpirationReview',
        options: [...BOOLEAN_FILTER_OPTIONS],
        allowedOperators: REQUIRED_SELECT_OPERATORS,
      },
      isPoweredByNamefiDomain: {
        id: 'isPoweredByNamefiDomain',
        label: 'Powered by Namefi',
        type: 'select',
        columnId: 'isPoweredByNamefiDomain',
        options: [...BOOLEAN_FILTER_OPTIONS],
        allowedOperators: REQUIRED_SELECT_OPERATORS,
      },
      userId: {
        id: 'userId',
        label: 'User ID',
        type: 'text',
        columnId: 'userId',
      },
      displayName: {
        id: 'displayName',
        label: 'Display Name',
        type: 'text',
        columnId: 'displayName',
      },
      primaryEmail: {
        id: 'primaryEmail',
        label: 'Primary Email',
        type: 'text',
        columnId: 'primaryEmail',
      },
      privyUserId: {
        id: 'privyUserId',
        label: 'Privy User ID',
        type: 'text',
        columnId: 'privyUserId',
      },
    },
    filterDisplayOptions: { showInHeader: false },
    onDrizzlerFilterChange: (newFilterState) => {
      setPage(1);
      setDrizzlerFilterState(newFilterState);
    },
  });

  const columns = useMemo<ColumnDef<NftManagementRow>[]>(
    () => [
      {
        accessorKey: 'chainId',
        header: 'Chain',
        cell: ({ row }) => <ChainCell chainId={row.original.chainId} />,
        size: 130,
      },
      {
        accessorKey: 'normalizedDomainName',
        header: 'Domain',
        cell: ({ row }) => <DomainNameCell row={row.original} />,
        size: 220,
      },
      {
        accessorKey: 'ownerAddress',
        header: 'Owner Address',
        cell: ({ row }) => <OwnerAddressCell row={row.original} />,
        size: 220,
      },
      {
        accessorKey: 'autoRenewEnabled',
        header: 'Auto Renew',
        cell: ({ row }) => (
          <AutoRenewBadge autoRenewEnabled={row.original.autoRenewEnabled} />
        ),
        size: 120,
      },
      {
        accessorKey: 'domainStatus',
        header: 'Domain Status',
        enableSorting: false,
        cell: ({ row }) => (
          <DomainStatusBadge domainStatus={row.original.domainStatus} />
        ),
        size: 120,
      },
      {
        accessorKey: 'nftStatus',
        header: 'NFT Status',
        enableSorting: false,
        cell: ({ row }) => (
          <NftStatusBadge nftStatus={row.original.nftStatus} />
        ),
        size: 120,
      },
      {
        accessorKey: 'nftExpirationTime',
        header: 'NFT Expiration',
        cell: ({ row }) => formatDateOnly(row.original.nftExpirationTime),
        size: 130,
      },
      {
        accessorKey: 'domainExpirationTime',
        header: 'Domain Expiration',
        cell: ({ row }) => formatDateOnly(row.original.domainExpirationTime),
        size: 140,
      },
      {
        id: 'dateState',
        header: 'Date State',
        accessorKey: 'dateState',
        cell: ({ row }) => (
          <DateStateBadge dateState={row.original.dateState} />
        ),
        size: 130,
      },
      {
        accessorKey: 'registrarKey',
        header: 'Registrar',
        cell: ({ row }) => (
          <RegistrarValue registrarKey={row.original.registrarKey} />
        ),
        size: 130,
      },
      {
        accessorKey: 'displayName',
        header: 'Display Name',
        cell: ({ row }) => row.original.displayName ?? '-',
        size: 160,
      },
      {
        accessorKey: 'primaryEmail',
        header: 'Primary Email',
        cell: ({ row }) => (
          <PrimaryEmailValue primaryEmail={row.original.primaryEmail} />
        ),
        size: 180,
      },
      {
        accessorKey: 'userId',
        header: 'User ID',
        cell: ({ row }) => <UserIdValue userId={row.original.userId} />,
        size: 170,
      },
      {
        accessorKey: 'privyUserId',
        header: 'Privy User ID',
        cell: ({ row }) => (
          <PrivyUserIdValue privyUserId={row.original.privyUserId} />
        ),
        size: 180,
      },
      {
        accessorKey: 'isPoweredByNamefiDomain',
        header: 'Powered by Namefi',
        cell: ({ row }) => (
          <YesNo value={row.original.isPoweredByNamefiDomain} />
        ),
        size: 130,
      },
      {
        accessorKey: 'canBurn',
        header: 'Can Burn',
        cell: ({ row }) => <YesNo value={row.original.canBurn} />,
        size: 100,
      },
      {
        accessorKey: 'hasMissingData',
        header: 'Missing Data',
        cell: ({ row }) => <YesNo value={row.original.hasMissingData} />,
        size: 110,
      },
      {
        accessorKey: 'hasDateMismatch',
        header: 'Strict Date Mismatch',
        cell: ({ row }) => <YesNo value={row.original.hasDateMismatch} />,
        size: 150,
      },
      {
        accessorKey: 'needsExpirationReview',
        header: 'Needs Expiration Review',
        cell: ({ row }) => <YesNo value={row.original.needsExpirationReview} />,
        size: 170,
      },
      {
        accessorKey: 'isExpired',
        header: 'Expired',
        cell: ({ row }) => <YesNo value={row.original.isExpired} />,
        size: 90,
      },
      {
        accessorKey: 'lastIndexedAt',
        header: 'Last Indexed',
        cell: ({ row }) => formatDateOnly(row.original.lastIndexedAt),
        size: 120,
      },
      {
        accessorKey: 'asOfBlockNumber',
        header: 'As Of Block',
        cell: ({ row }) => row.original.asOfBlockNumber?.toString() ?? '-',
        size: 130,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const burnKey = `${row.original.normalizedDomainName}-${row.original.chainId}`;

          return (
            <NftActionsCell
              row={row.original}
              isBurning={burnInProgress.has(burnKey)}
              isBurnWorkflowActive={activeBurnWorkflowKeys.has(burnKey)}
              isFixPending={fixNftExpirationMutation.isPending}
              onBurn={handleBurnNft}
              onFix={handleFixNftExpiration}
            />
          );
        },
        size: 220,
      },
    ],
    [
      activeBurnWorkflowKeys,
      burnInProgress,
      fixNftExpirationMutation.isPending,
      handleBurnNft,
      handleFixNftExpiration,
    ],
  );

  // Mobile card renderer. Maps each row to a stacked card built from the same
  // shared cell components the desktop columns use, so a phone gets a readable
  // labeled list instead of a horizontally-scrolling table.
  const renderMobileCard = useCallback(
    (row: Row<NftManagementRow>) => {
      const burnKey = `${row.original.normalizedDomainName}-${row.original.chainId}`;

      return (
        <NftManagementCard
          row={row.original}
          isBurning={burnInProgress.has(burnKey)}
          isBurnWorkflowActive={activeBurnWorkflowKeys.has(burnKey)}
          isFixPending={fixNftExpirationMutation.isPending}
          onBurn={handleBurnNft}
          onFix={handleFixNftExpiration}
        />
      );
    },
    [
      activeBurnWorkflowKeys,
      burnInProgress,
      fixNftExpirationMutation.isPending,
      handleBurnNft,
      handleFixNftExpiration,
    ],
  );

  return (
    <>
      <ActiveWorkflowsDialog
        open={workflowModalOpen}
        onOpenChange={setWorkflowModalOpen}
        burnWorkflows={burnWorkflowsQuery.data}
        fixWorkflows={fixWorkflowsQuery.data}
        extendWorkflows={extendWorkflowsQuery.data}
      />

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle>NFT Management</CardTitle>
            <CardDescription>
              Compare NFT expirations with indexed domain data, filter with the
              new drizzler scheme, and run burn or fix workflows.
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setWorkflowModalOpen(true)}
            disabled={isWorkflowsLoading}
            className="shrink-0"
          >
            {isWorkflowsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CirclePlay className="h-4 w-4" />
            )}
            Active Workflows
            <Badge variant="secondary">{totalActiveWorkflows}</Badge>
          </Button>
        </CardHeader>

        <CardContent>
          <ExtensibleDataTable<NftManagementRow, typeof filterStrategy>
            filterStrategy={filterStrategy}
            columns={columns}
            data={nftStatusQuery.data?.data ?? []}
            isLoading={nftStatusQuery.isLoading}
            isFetching={nftStatusQuery.isFetching}
            page={page}
            pageSize={pageSize}
            totalPages={nftStatusQuery.data?.pagination.totalPages ?? 1}
            totalCount={nftStatusQuery.data?.pagination.totalCount ?? 0}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPage(1);
              setPageSize(size);
            }}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search domain or owner address..."
            emptyMessage="No NFTs found"
            loadingMessage="Loading NFTs..."
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            onResetPreferences={resetToDefaults}
            renderMobileCard={renderMobileCard}
          />
        </CardContent>
      </Card>
    </>
  );
});

export function AdminNftManagement() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!(isLoading || isAuthenticated)) {
    return <AuthRequired />;
  }

  return (
    <PageShell padding="admin" className="space-y-6">
      {isLoading ? (
        <LoadingSkeletons />
      ) : (
        <>
          <NftKnownIssuesCard />
          <NftManagementTable />
        </>
      )}
    </PageShell>
  );
}
