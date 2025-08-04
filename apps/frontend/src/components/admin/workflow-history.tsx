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
import { Label } from '@/components/ui/shadcn/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { type FC, useState, useCallback } from 'react';
import {
  History,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ChevronsLeft,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Calendar,
  Hash,
  Globe,
  Link,
  Flame,
  Wrench,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center space-x-4 p-4 border rounded-lg"
      >
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[80px]" />
      </div>
    ))}
  </div>
);

function WorkflowHistoryContent() {
  const trpc = useTRPC();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [days, setDays] = useState<'1' | '3' | '7'>('7');
  const [workflowType, setWorkflowType] = useState<
    'all' | 'burn' | 'fix' | 'extend'
  >('all');
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined,
  );
  const [previousPageTokens, setPreviousPageTokens] = useState<string[]>([]);

  const { data, isLoading, isFetching } = useQuery({
    ...trpc.admin.getWorkflowHistory.queryOptions({
      days,
      page,
      limit,
      workflowType,
      nextPageToken,
    }),
    placeholderData: (previousData) => previousData,
  });

  const totalPages = data?.pagination.totalPages ?? 0;
  const totalCount = data?.pagination.totalCount;
  const hasNextPage = data?.pagination.hasNextPage ?? false;
  const hasPreviousPage = previousPageTokens.length > 0 || page > 1;

  // Generate Temporal UI link for workflow details
  const getWorkflowLink = (workflowId: string, runId?: string) => {
    if (!data?.temporal) return null;
    const { apiUrl, namespace } = data.temporal;
    // Convert API URL to UI URL (replace api. with ui. if needed)
    const uiUrl = apiUrl.includes('localhost')
      ? 'http://localhost:8233'
      : 'https://cloud.temporal.io';
    return `${uiUrl}/namespaces/${namespace}/workflows/${workflowId}${runId ? `/${runId}` : ''}`;
  };

  const handleDaysChange = useCallback((value: '1' | '3' | '7') => {
    setDays(value);
    setPage(1);
    setNextPageToken(undefined);
    setPreviousPageTokens([]);
  }, []);

  const handleWorkflowTypeChange = useCallback(
    (value: 'all' | 'burn' | 'fix' | 'extend') => {
      setWorkflowType(value);
      setPage(1);
      setNextPageToken(undefined);
      setPreviousPageTokens([]);
    },
    [],
  );

  const handleLimitChange = useCallback((value: string) => {
    setLimit(Number(value));
    setPage(1);
    setNextPageToken(undefined);
    setPreviousPageTokens([]);
  }, []);

  const handleFirstPage = useCallback(() => {
    setPage(1);
    setNextPageToken(undefined);
    setPreviousPageTokens([]);
  }, []);

  const handlePreviousPage = useCallback(() => {
    if (previousPageTokens.length > 0) {
      const previousTokens = [...previousPageTokens];
      const previousToken = previousTokens.pop();
      setPreviousPageTokens(previousTokens);
      setNextPageToken(previousToken);
      setPage((p) => Math.max(1, p - 1));
    }
  }, [previousPageTokens]);

  const handleNextPage = useCallback(() => {
    if (data?.pagination.nextPageToken) {
      if (nextPageToken) {
        setPreviousPageTokens((prev) => [...prev, nextPageToken]);
      }
      setNextPageToken(data.pagination.nextPageToken);
      setPage((p) => p + 1);
    }
  }, [data?.pagination.nextPageToken, nextPageToken]);

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM do, yyyy HH:mm:ss');
  };

  const formatDuration = (executionTime: number | null) => {
    if (!executionTime) return 'N/A';
    const seconds = Math.floor(executionTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'RUNNING':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <PlayCircle className="h-3 w-3 mr-1" />
            Running
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'TERMINATED':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Terminated
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getWorkflowTypeIcon = (workflowType: string) => {
    switch (workflowType) {
      case 'ensureNftIsLockedAndBurnByNftName':
        return <Flame className="h-4 w-4 text-red-500" />;
      case 'fixNftExpirationWorkflow':
        return <Wrench className="h-4 w-4 text-blue-500" />;
      case 'extendDomainRegistrationWorkflow':
        return <RefreshCw className="h-4 w-4 text-green-500" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const getWorkflowTypeName = (workflowType: string) => {
    switch (workflowType) {
      case 'ensureNftIsLockedAndBurnByNftName':
        return 'Burn NFT';
      case 'fixNftExpirationWorkflow':
        return 'Fix NFT Expiration';
      case 'extendDomainRegistrationWorkflow':
        return 'Extend Registration';
      default:
        return workflowType;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Time Range
              </Label>
              <Select
                value={days}
                onValueChange={handleDaysChange}
                disabled={isFetching}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 1 day</SelectItem>
                  <SelectItem value="3">Last 3 days</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Workflow Type
              </Label>
              <Select
                value={workflowType}
                onValueChange={handleWorkflowTypeChange}
                disabled={isFetching}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select workflow type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workflows</SelectItem>
                  <SelectItem value="burn">
                    <span className="flex items-center gap-2">
                      <Flame className="h-4 w-4" />
                      Burn NFT
                    </span>
                  </SelectItem>
                  <SelectItem value="fix">
                    <span className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Fix NFT Expiration
                    </span>
                  </SelectItem>
                  <SelectItem value="extend">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Extend Registration
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <Label className="text-sm font-medium">Results Per Page</Label>
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
        </CardContent>
      </Card>

      {/* Workflow History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Workflow History
              {isFetching && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {isFetching && (!data || data.data.length === 0) ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading workflows...
                </span>
              ) : data && data.data.length > 0 ? (
                <>
                  {totalCount !== undefined ? (
                    <>
                      Showing {totalCount > 0 ? (page - 1) * limit + 1 : 0} to{' '}
                      {Math.min(page * limit, totalCount)} of {totalCount}{' '}
                      workflows
                    </>
                  ) : (
                    <>
                      Showing {data.data.length} workflows on page {page}
                      <span className="text-xs ml-1 text-amber-600">
                        (total count unavailable)
                      </span>
                    </>
                  )}
                  {isFetching && (
                    <span className="inline-flex items-center gap-1 ml-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs">Updating...</span>
                    </span>
                  )}
                </>
              ) : (
                <span>No workflows found</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isLoading && !isFetching && data?.data.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                No workflows found in the selected time range.
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
                    <Th>Workflow Type</Th>
                    <Th>Domain</Th>
                    <Th>Chain</Th>
                    <Th>Status</Th>
                    <Th>Started</Th>
                    <Th>Duration</Th>
                    <Th>Workflow ID</Th>
                    <Th>Error</Th>
                  </Tr>
                </Thead>
                <TableBody>
                  {data?.data.map((workflow) => {
                    const workflowLink = getWorkflowLink(
                      workflow.workflowId,
                      workflow.runId,
                    );
                    return (
                      <Tr key={workflow.workflowId}>
                        <Td>
                          <div className="flex items-center gap-2">
                            {getWorkflowTypeIcon(workflow.workflowType)}
                            <span className="text-sm">
                              {getWorkflowTypeName(workflow.workflowType)}
                            </span>
                          </div>
                        </Td>
                        <Td className="font-medium">
                          {workflow.domainName ? (
                            <TruncatedTextWithHover maxLength={30}>
                              {workflow.domainName}
                            </TruncatedTextWithHover>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              N/A
                            </span>
                          )}
                        </Td>
                        <Td>
                          {workflow.chainId ? (
                            <Badge variant="outline">{workflow.chainId}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              N/A
                            </span>
                          )}
                        </Td>
                        <Td>{getStatusBadge(workflow.status)}</Td>
                        <Td className="text-sm">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {workflow.startTime
                                    ? formatDistanceToNow(
                                        new Date(workflow.startTime),
                                        { addSuffix: true },
                                      )
                                    : 'N/A'}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{formatDate(workflow.startTime)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Td>
                        <Td className="text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formatDuration(workflow.executionTime)}
                          </div>
                        </Td>
                        <Td className="font-mono text-xs">
                          {workflowLink ? (
                            <a
                              href={workflowLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                            >
                              <TruncatedTextWithHover maxLength={18}>
                                {workflow.workflowId}
                              </TruncatedTextWithHover>
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </a>
                          ) : (
                            <TruncatedTextWithHover maxLength={20}>
                              {workflow.workflowId}
                            </TruncatedTextWithHover>
                          )}
                        </Td>
                        <Td>
                          {workflow.error ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="destructive"
                                    className="cursor-help"
                                  >
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Error
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">{workflow.error}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              -
                            </span>
                          )}
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
                Unable to load workflow history. Please try again.
              </div>
            </div>
          )}

          {/* Pagination */}
          {data && (data.data.length > 0 || hasPreviousPage || hasNextPage) && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFirstPage}
                  disabled={!hasPreviousPage || isFetching}
                  title="Go to first page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={!hasPreviousPage || isFetching}
                  title="Previous page"
                >
                  {isFetching && hasPreviousPage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                  Previous
                </Button>
                <span className="text-sm mx-2">
                  {totalPages > 0
                    ? `Page ${page} of ${totalPages}`
                    : `Page ${page}`}
                  {isFetching && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (loading)
                    </span>
                  )}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasNextPage || isFetching}
                  title={
                    hasNextPage
                      ? nextPageToken || previousPageTokens.length > 0
                        ? 'Load more workflows'
                        : 'Next page'
                      : 'No more results'
                  }
                >
                  {nextPageToken || previousPageTokens.length > 0
                    ? 'Load More'
                    : 'Next'}
                  {isFetching && hasNextPage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminWorkflowHistory() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!(isLoading || isAuthenticated)) {
    return <AuthRequired />;
  }

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Workflow History</h1>
          <p className="text-muted-foreground mt-2">
            View and track all admin-initiated workflows including NFT burns,
            expiration fixes, and domain extensions.
          </p>
        </div>
      </div>
      {isLoading ? <LoadingSkeletons /> : <WorkflowHistoryContent />}
    </div>
  );
}
