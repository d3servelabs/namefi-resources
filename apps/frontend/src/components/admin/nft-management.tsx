'use client';
import { TruncatedTextWithHover } from '@/components/truncated-text-with-hover';
import { AuthRequired } from '@/components/auth-required';
import { Table, Td, Th, Thead, Tr } from '@/components/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Badge } from '@/components/ui/shadcn/badge';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { TableBody } from '@/components/ui/shadcn/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/shadcn/alert-dialog';
import { Switch } from '@/components/ui/shadcn/switch';
import { Label } from '@/components/ui/shadcn/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/shadcn/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { type FC, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Flame,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Hash,
  List,
  Globe,
  Calendar,
  Link,
  Eye,
  AlertTriangle,
  RefreshCw,
  Wrench,
  Clock,
  ChevronDown,
  ChevronUp,
  CirclePlay,
} from 'lucide-react';

const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center space-x-4 p-4 border rounded-lg"
      >
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-8 w-[80px]" />
      </div>
    ))}
  </div>
);

function NftManagementContent() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<
    'domainName' | 'nftExpiration' | 'domainExpiration' | 'chainId'
  >('domainName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState<
    'all' | 'expired' | 'canBurn' | 'dateMismatch' | 'missingData'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [excludePoweredByNamefiDomains, setExcludePoweredByNamefiDomains] =
    useState(false);
  const [burnInProgress, setBurnInProgress] = useState<Set<string>>(new Set());
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);

  // Separate state for applied filters vs pending filter changes
  const [appliedFilters, setAppliedFilters] = useState({
    filterBy: 'all' as
      | 'all'
      | 'expired'
      | 'canBurn'
      | 'dateMismatch'
      | 'missingData',
    sortBy: 'domainName' as
      | 'domainName'
      | 'nftExpiration'
      | 'domainExpiration'
      | 'chainId',
    sortOrder: 'asc' as 'asc' | 'desc',
    excludePoweredByNamefiDomains: false,
    searchTerm: '',
  });
  const [hasUnappliedChanges, setHasUnappliedChanges] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    ...trpc.admin.getNftsWithExpirationStatus.queryOptions({
      page,
      limit,
      sortBy: appliedFilters.sortBy,
      sortOrder: appliedFilters.sortOrder,
      filterBy: appliedFilters.filterBy,
      searchTerm: appliedFilters.searchTerm || undefined,
      excludePoweredByNamefiDomains:
        appliedFilters.excludePoweredByNamefiDomains,
    }),
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  // Query for active workflows
  const { data: activeBurnWorkflows, isLoading: loadingBurnWorkflows } =
    useQuery({
      ...trpc.admin.getActiveBurnWorkflows.queryOptions(),
      refetchInterval: 5000, // Refresh every 5 seconds
    });

  const { data: activeFixExpirationWorkflows, isLoading: loadingFixWorkflows } =
    useQuery({
      ...trpc.admin.getActiveFixExpirationWorkflows.queryOptions(),
      refetchInterval: 5000, // Refresh every 5 seconds
    });

  const {
    data: activeExtendRegistrationWorkflows,
    isLoading: loadingExtendWorkflows,
  } = useQuery({
    ...trpc.admin.getActiveExtendRegistrationWorkflows.queryOptions(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Keep track of the last known pagination info
  const totalPages = data?.pagination.totalPages ?? 0;
  const totalCount = data?.pagination.totalCount ?? 0;

  const burnNftMutation = useMutation(
    trpc.admin.burnNft.mutationOptions({
      onSuccess: (result) => {
        toast.success(`NFT burn workflow started: ${result.workflowId}`);
        // Refetch the data to update the table
        queryClient.invalidateQueries({
          queryKey: ['admin.getNftsWithExpirationStatus'],
        });
      },
      onError: (error) => {
        toast.error(`Failed to burn NFT: ${error.message}`);
      },
      onSettled: (_, __, variables) => {
        // Remove from burn in progress set
        setBurnInProgress((prev) => {
          const next = new Set(prev);
          next.delete(`${variables.normalizedDomainName}-${variables.chainId}`);
          return next;
        });
      },
    }),
  );

  const fixNftExpirationMutation = useMutation(
    trpc.admin.fixNftExpiration.mutationOptions({
      onSuccess: () => {
        toast.success('NFT expiration fix workflow started');
        queryClient.invalidateQueries({
          queryKey: ['admin.getNftsWithExpirationStatus'],
        });
      },
      onError: (error) => {
        toast.error(`Failed to fix NFT expiration: ${error.message}`);
      },
    }),
  );

  const handleBurnNft = async (
    normalizedDomainName: string,
    chainId: number,
  ) => {
    const key = `${normalizedDomainName}-${chainId}`;
    setBurnInProgress((prev) => new Set([...prev, key]));

    try {
      await burnNftMutation.mutateAsync({
        normalizedDomainName,
        chainId,
      });
    } catch {
      // Error handling is done in onError callback
    }
  };

  const applyFilters = useCallback(() => {
    setAppliedFilters({
      filterBy,
      sortBy,
      sortOrder,
      excludePoweredByNamefiDomains,
      searchTerm,
    });
    setPage(1);
    setHasUnappliedChanges(false);
  }, [filterBy, sortBy, sortOrder, excludePoweredByNamefiDomains, searchTerm]);

  const handleSearch = useCallback(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = useCallback(
    (value: 'all' | 'expired' | 'canBurn' | 'dateMismatch' | 'missingData') => {
      setFilterBy(value);
      setHasUnappliedChanges(true);
    },
    [],
  );

  const handleSortByChange = useCallback(
    (
      value: 'domainName' | 'nftExpiration' | 'domainExpiration' | 'chainId',
    ) => {
      setSortBy(value);
      setHasUnappliedChanges(true);
    },
    [],
  );

  const handleSortOrderChange = useCallback((value: 'asc' | 'desc') => {
    setSortOrder(value);
    setHasUnappliedChanges(true);
  }, []);

  const handleExcludeToggle = useCallback((checked: boolean) => {
    setExcludePoweredByNamefiDomains(checked);
    setHasUnappliedChanges(true);
  }, []);

  const handleLimitChange = useCallback((value: string) => {
    setLimit(Number(value));
    setPage(1);
  }, []);

  const handleFirstPage = useCallback(() => {
    setPage(1);
  }, []);

  const handleLastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  // Helper functions for workflow status
  const isInActiveBurnWorkflow = (domainName: string, chainId: number) => {
    return (
      activeBurnWorkflows?.some(
        (workflow) =>
          workflow.domainName === domainName && workflow.chainId === chainId,
      ) ?? false
    );
  };

  const getTotalActiveWorkflows = () => {
    const burnCount = activeBurnWorkflows?.length ?? 0;
    const fixCount = activeFixExpirationWorkflows?.length ?? 0;
    const extendCount = activeExtendRegistrationWorkflows?.length ?? 0;
    return burnCount + fixCount + extendCount;
  };

  const isWorkflowsLoading =
    loadingBurnWorkflows || loadingFixWorkflows || loadingExtendWorkflows;

  const handleFixNftExpiration = async (
    normalizedDomainName: string,
    chainId: number,
  ) => {
    try {
      await fixNftExpirationMutation.mutateAsync({
        normalizedDomainName,
        chainId,
      });
    } catch {
      // Error handling is done in onError callback
    }
  };

  const getExpirationStatus = (domainExpiration: Date | null) => {
    if (!domainExpiration) {
      return <Badge variant="destructive">Not Found</Badge>;
    }
    const isExpired = domainExpiration < new Date();
    return isExpired ? (
      <Badge variant="destructive">Expired</Badge>
    ) : (
      <Badge variant="default">Active</Badge>
    );
  };

  // Render the workflows modal
  const renderWorkflowsModal = () => (
    <Dialog
      open={workflowModalOpen}
      onOpenChange={setWorkflowModalOpen}
      modal={true}
    >
      <DialogContent className="max-w-screen-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CirclePlay className="h-5 w-5" />
            Active Workflows ({getTotalActiveWorkflows()})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Accordion type="multiple" defaultValue={['burn', 'fix', 'extend']}>
            {/* Burn Workflows */}
            <AccordionItem value="burn">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-red-500" />
                  <span>Burn NFT Workflows</span>
                  <Badge variant="secondary" className="ml-2">
                    {activeBurnWorkflows?.length ?? 0}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {activeBurnWorkflows && activeBurnWorkflows.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <Thead>
                        <Tr>
                          <Th className="text-xs">Domain</Th>
                          <Th className="text-xs">Chain ID</Th>
                          <Th className="text-xs">Workflow ID</Th>
                          <Th className="text-xs">Started</Th>
                          <Th className="text-xs">Status</Th>
                        </Tr>
                      </Thead>
                      <TableBody>
                        {activeBurnWorkflows.map((workflow) => (
                          <Tr key={workflow.workflowId}>
                            <Td className="font-medium text-xs">
                              <TruncatedTextWithHover maxLength={25}>
                                {workflow.domainName}
                              </TruncatedTextWithHover>
                            </Td>
                            <Td>
                              <Badge variant="outline" className="text-xs">
                                {workflow.chainId}
                              </Badge>
                            </Td>
                            <Td className="font-mono text-xs">
                              <TruncatedTextWithHover maxLength={15}>
                                {workflow.workflowId}
                              </TruncatedTextWithHover>
                            </Td>
                            <Td className="text-xs">
                              {workflow.startTime
                                ? formatDate(new Date(workflow.startTime))
                                : 'N/A'}
                            </Td>
                            <Td>
                              <Badge
                                variant="default"
                                className="bg-yellow-100 text-yellow-800 text-xs"
                              >
                                {workflow.status}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4">
                    No active burn workflows
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Fix Expiration Workflows */}
            <AccordionItem value="fix">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-blue-500" />
                  <span>Fix NFT Expiration Workflows</span>
                  <Badge variant="secondary" className="ml-2">
                    {activeFixExpirationWorkflows?.length ?? 0}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {activeFixExpirationWorkflows &&
                activeFixExpirationWorkflows.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <Thead>
                        <Tr>
                          <Th className="text-xs">Domain</Th>
                          <Th className="text-xs">Chain ID</Th>
                          <Th className="text-xs">Workflow ID</Th>
                          <Th className="text-xs">Started</Th>
                          <Th className="text-xs">Status</Th>
                        </Tr>
                      </Thead>
                      <TableBody>
                        {activeFixExpirationWorkflows.map((workflow) => (
                          <Tr key={workflow.workflowId}>
                            <Td className="font-medium text-xs">
                              <TruncatedTextWithHover maxLength={25}>
                                {workflow.domainName}
                              </TruncatedTextWithHover>
                            </Td>
                            <Td>
                              <Badge variant="outline" className="text-xs">
                                {workflow.chainId}
                              </Badge>
                            </Td>
                            <Td className="font-mono text-xs">
                              <TruncatedTextWithHover maxLength={15}>
                                {workflow.workflowId}
                              </TruncatedTextWithHover>
                            </Td>
                            <Td className="text-xs">
                              {workflow.startTime
                                ? formatDate(new Date(workflow.startTime))
                                : 'N/A'}
                            </Td>
                            <Td>
                              <Badge
                                variant="default"
                                className="bg-blue-100 text-blue-800 text-xs"
                              >
                                {workflow.status}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4">
                    No active fix expiration workflows
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Extend Registration Workflows */}
            <AccordionItem value="extend">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span>Extend Registration Workflows</span>
                  <Badge variant="secondary" className="ml-2">
                    {activeExtendRegistrationWorkflows?.length ?? 0}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {activeExtendRegistrationWorkflows &&
                activeExtendRegistrationWorkflows.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <Thead>
                        <Tr>
                          <Th className="text-xs">Domain</Th>
                          <Th className="text-xs">Chain ID</Th>
                          <Th className="text-xs">Workflow ID</Th>
                          <Th className="text-xs">Started</Th>
                          <Th className="text-xs">Status</Th>
                        </Tr>
                      </Thead>
                      <TableBody>
                        {activeExtendRegistrationWorkflows.map((workflow) => (
                          <Tr key={workflow.workflowId}>
                            <Td className="font-medium text-xs">
                              <TruncatedTextWithHover maxLength={25}>
                                {workflow.domainName}
                              </TruncatedTextWithHover>
                            </Td>
                            <Td>
                              <Badge variant="outline" className="text-xs">
                                {workflow.chainId}
                              </Badge>
                            </Td>
                            <Td className="font-mono text-xs">
                              <TruncatedTextWithHover maxLength={15}>
                                {workflow.workflowId}
                              </TruncatedTextWithHover>
                            </Td>
                            <Td className="text-xs">
                              {workflow.startTime
                                ? formatDate(new Date(workflow.startTime))
                                : 'N/A'}
                            </Td>
                            <Td>
                              <Badge
                                variant="default"
                                className="bg-green-100 text-green-800 text-xs"
                              >
                                {workflow.status}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4">
                    No active extend registration workflows
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {renderWorkflowsModal()}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by domain name or owner address..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHasUnappliedChanges(true);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button
              onClick={applyFilters}
              variant={hasUnappliedChanges ? 'default' : 'outline'}
              disabled={isFetching}
              className={
                hasUnappliedChanges ? 'bg-primary hover:bg-primary/90' : ''
              }
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : hasUnappliedChanges ? (
                <Filter className="h-4 w-4 mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {isFetching
                ? 'Loading...'
                : hasUnappliedChanges
                  ? 'Apply Filters'
                  : 'Search'}
            </Button>
          </div>

          {/* Filter & Sort Controls */}
          <div className="space-y-4">
            {/* Primary Controls Row */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Filter Section */}
              <div className="flex-1 space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter NFTs
                </Label>
                <Select
                  value={filterBy}
                  onValueChange={handleFilterChange}
                  disabled={isFetching}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        All NFTs
                      </span>
                    </SelectItem>
                    <SelectItem value="expired">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Expired Domains
                      </span>
                    </SelectItem>
                    <SelectItem value="canBurn">
                      <span className="flex items-center gap-2">
                        <Flame className="h-4 w-4" />
                        Can Burn
                      </span>
                    </SelectItem>
                    <SelectItem value="dateMismatch">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Date Mismatch
                      </span>
                    </SelectItem>
                    <SelectItem value="missingData">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Missing Data
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Section */}
              <div className="flex-1 lg:flex-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Sort By
                  </Label>
                  <Select
                    value={sortBy}
                    onValueChange={handleSortByChange}
                    disabled={isFetching}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="domainName">
                        <span className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Domain Name
                        </span>
                      </SelectItem>
                      <SelectItem value="domainExpiration">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Domain Expiration
                        </span>
                      </SelectItem>
                      <SelectItem value="chainId">
                        <span className="flex items-center gap-2">
                          <Link className="h-4 w-4" />
                          Chain ID
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    {sortOrder === 'asc' ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    )}
                    Order
                  </Label>
                  <Select
                    value={sortOrder}
                    onValueChange={handleSortOrderChange}
                    disabled={isFetching}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">
                        <span className="flex items-center gap-2">
                          <SortAsc className="h-4 w-4" />
                          Ascending
                        </span>
                      </SelectItem>
                      <SelectItem value="desc">
                        <span className="flex items-center gap-2">
                          <SortDesc className="h-4 w-4" />
                          Descending
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Page Size Section */}
              <div className="flex-1 space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Results
                </Label>
                <Select
                  value={limit.toString()}
                  onValueChange={handleLimitChange}
                  disabled={isFetching}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Page size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* PoweredByNamefi Toggle - only show for "All NFTs" filter */}
          {appliedFilters.filterBy === 'all' && (
            <div className="flex items-center space-x-2">
              <Switch
                id="exclude-powered-by-namefi"
                checked={excludePoweredByNamefiDomains}
                onCheckedChange={handleExcludeToggle}
                disabled={isFetching}
              />
              <Label htmlFor="exclude-powered-by-namefi">
                Exclude Powered by Namefi domains
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardContent className="pt-1 flex flex-col-reverse gap-4">
          {/* NFT Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  NFT Management
                  {isFetching && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isFetching && (
                    <div className="text-sm text-muted-foreground">
                      Loading...
                    </div>
                  )}
                  {/* Active Workflows Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWorkflowModalOpen(true)}
                    className="flex items-center gap-2"
                    disabled={isWorkflowsLoading}
                  >
                    {isWorkflowsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CirclePlay className="h-4 w-4" />
                    )}
                    <span>Active Workflows</span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getTotalActiveWorkflows() > 0 ? 'bg-blue-100 text-blue-800' : ''}`}
                    >
                      {getTotalActiveWorkflows()}
                    </Badge>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!isLoading && !isFetching && data?.data.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    No NFTs found matching your criteria.
                  </div>
                </div>
              ) : isLoading && !data ? (
                <LoadingSkeletons />
              ) : data?.data ? (
                <div className="relative">
                  {isFetching && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                      <div className="flex items-center gap-2 bg-background/90 px-4 py-2 rounded-lg shadow-sm border">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    </div>
                  )}
                  <Table className="w-full">
                    <Thead>
                      <Tr>
                        <Th>Domain Name</Th>
                        <Th>Chain ID</Th>
                        <Th>Owner Address</Th>
                        <Th>Domain Status</Th>
                        <Th>NFT Expiration</Th>
                        <Th>Domain Expiration</Th>
                        <Th>Date Match</Th>
                        <Th>Registrar</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <TableBody>
                      {data?.data.map((nft) => {
                        const burnKey = `${nft.normalizedDomainName}-${nft.chainId}`;
                        const isBurning = burnInProgress.has(burnKey);

                        // Determine missing data vs date mismatch based on domain type
                        const hasMissingData = nft.isPoweredByNamefiDomain
                          ? nft.nftExpirationTime === null // For powered by namefi, only NFT date matters
                          : nft.nftExpirationTime === null ||
                            nft.domainExpirationTime === null; // For regular domains, both dates required

                        // Date mismatch is only for regular domains where both dates exist but differ
                        const isDateMismatchFixable =
                          nft.hasDateMismatch &&
                          !nft.isPoweredByNamefiDomain &&
                          nft.nftExpirationTime !== null &&
                          nft.domainExpirationTime !== null;

                        return (
                          <Tr key={burnKey}>
                            <Td className="font-medium">
                              <div className="flex flex-col gap-1">
                                <TruncatedTextWithHover maxLength={30}>
                                  {nft.normalizedDomainName}
                                </TruncatedTextWithHover>
                                {nft.isPoweredByNamefiDomain && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs w-fit"
                                  >
                                    Powered by Namefi
                                  </Badge>
                                )}
                              </div>
                            </Td>
                            <Td>
                              <Badge variant="outline">{nft.chainId}</Badge>
                            </Td>
                            <Td className="font-mono text-sm">
                              <TruncatedTextWithHover maxLength={12}>
                                {nft.ownerAddress}
                              </TruncatedTextWithHover>
                            </Td>
                            <Td>
                              {getExpirationStatus(nft.domainExpirationTime)}
                            </Td>
                            <Td>{formatDate(nft.nftExpirationTime)}</Td>
                            <Td>{formatDate(nft.domainExpirationTime)}</Td>
                            <Td>
                              {hasMissingData ? (
                                <Badge variant="destructive">
                                  Missing Data
                                </Badge>
                              ) : nft.hasDateMismatch ? (
                                <Badge
                                  variant="secondary"
                                  className="flex items-center gap-1 bg-amber-100 text-amber-800 border-amber-200"
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  Date Mismatch
                                </Badge>
                              ) : (
                                <Badge
                                  variant="default"
                                  className="bg-green-100 text-green-800"
                                >
                                  Match
                                </Badge>
                              )}
                            </Td>
                            <Td>
                              {nft.registrarKey ? (
                                <Badge variant="outline">
                                  {nft.registrarKey}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">
                                  N/A
                                </span>
                              )}
                            </Td>
                            <Td>
                              <div className="flex flex-wrap gap-1">
                                <TooltipProvider>
                                  {/* Burn Action - Only show if canBurn */}
                                  {nft.canBurn && (
                                    <>
                                      {!isInActiveBurnWorkflow(
                                        nft.normalizedDomainName,
                                        nft.chainId,
                                      ) ? (
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              disabled={isBurning}
                                              className="flex items-center gap-1 text-xs border-red-200 text-red-300 hover:bg-red-800/30 bg-red-900/10 hover:text-red-600"
                                            >
                                              <Flame className="h-3 w-3" />
                                              {isBurning
                                                ? 'Burning...'
                                                : 'Burn'}
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>
                                                Burn NFT
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Are you sure you want to burn
                                                the NFT for{' '}
                                                <strong>
                                                  {nft.normalizedDomainName}
                                                </strong>
                                                ?
                                                <br />
                                                <br />
                                                This action cannot be undone.
                                                The NFT will be permanently
                                                destroyed.
                                                <br />
                                                <br />
                                                <strong>Domain:</strong>{' '}
                                                {nft.normalizedDomainName}
                                                <br />
                                                <strong>Chain ID:</strong>{' '}
                                                {nft.chainId}
                                                <br />
                                                <strong>Owner:</strong>{' '}
                                                {nft.ownerAddress}
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>
                                                Cancel
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() =>
                                                  handleBurnNft(
                                                    nft.normalizedDomainName,
                                                    nft.chainId,
                                                  )
                                                }
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                              >
                                                Burn NFT
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      ) : (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              disabled
                                              className="flex items-center gap-1 text-xs border-red-200 text-red-400 opacity-50"
                                            >
                                              <Flame className="h-3 w-3" />
                                              Burn
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>
                                              A burn workflow is already in
                                              progress for this domain
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </>
                                  )}

                                  {/* Fix NFT Expiration Action - Only show for fixable date mismatches (not missing data) */}
                                  {nft.hasDateMismatch &&
                                    !hasMissingData &&
                                    (isDateMismatchFixable ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleFixNftExpiration(
                                            nft.normalizedDomainName,
                                            nft.chainId,
                                          )
                                        }
                                        disabled={
                                          fixNftExpirationMutation.isPending
                                        }
                                        className="flex items-center gap-1 text-xs"
                                      >
                                        <Wrench className="h-3 w-3" />
                                        {fixNftExpirationMutation.isPending
                                          ? 'Fixing...'
                                          : 'Fix'}
                                      </Button>
                                    ) : (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled
                                            className="flex items-center gap-1 text-xs"
                                          >
                                            <AlertTriangle className="h-3 w-3" />
                                            Cannot Fix
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>
                                            Cannot fix: Either NFT or domain
                                            expiration date is missing
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    ))}

                                  {/* Renew Action - Only show for valid domains (not burnable and no missing data) */}
                                  {!nft.canBurn && !hasMissingData && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled
                                          className="flex items-center gap-1 text-xs"
                                        >
                                          <RefreshCw className="h-3 w-3" />
                                          Renew
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          Domain renewal is not yet implemented
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </TooltipProvider>
                              </div>
                            </Td>
                          </Tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    Unable to load NFT data. Please try again.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {isFetching && totalCount === 0 ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading NFT data...
                </span>
              ) : (
                <>
                  Showing {(page - 1) * limit + 1} to{' '}
                  {Math.min(page * limit, totalCount)} of {totalCount} NFTs
                  {isFetching && (
                    <span className="inline-flex items-center gap-1 ml-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs">Updating...</span>
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFirstPage}
                disabled={page <= 1 || isFetching}
                title="Go to first page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                title="Previous page"
              >
                {isFetching && page > 1 ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
                Previous
              </Button>
              <span className="text-sm mx-2">
                Page {page} of {totalPages > 0 ? totalPages : '?'}
                {isFetching && totalPages === 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (loading)
                  </span>
                )}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isFetching}
                title="Next page"
              >
                Next
                {isFetching && page < totalPages ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLastPage}
                disabled={page >= totalPages || isFetching || totalPages === 0}
                title="Go to last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminNftManagement() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!(isLoading || isAuthenticated)) {
    return <AuthRequired />;
  }

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">NFT Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage all NFTs in the system. Compare NFT dates with indexed domain
            dates and burn expired NFTs.
          </p>
        </div>
      </div>
      {isLoading ? <LoadingSkeletons /> : <NftManagementContent />}
    </div>
  );
}
