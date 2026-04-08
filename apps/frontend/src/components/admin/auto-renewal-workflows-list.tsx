'use client';
import Link from 'next/link';
import { Table, Td, Th, Thead, Tr } from '@/components/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { TableBody } from '@/components/ui/shadcn/table';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { withAdminGuard } from './admin-guard';
import { PageShell } from '@/components/page-shell';

const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="flex items-center space-x-4 p-4 border rounded-lg"
      >
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[80px]" />
        <Skeleton className="h-8 w-[100px]" />
      </div>
    ))}
  </div>
);

function getStatusBadge(status: string) {
  switch (status) {
    case 'RUNNING':
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Running
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="default" className="gap-1 bg-green-500">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" />
          Failed
        </Badge>
      );
    case 'CANCELED':
    case 'CANCELLED':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" />
          Cancelled
        </Badge>
      );
    case 'TERMINATED':
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          Terminated
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function formatUsd(amount: number | undefined): string {
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

function AutoRenewalWorkflowsListContent() {
  const trpc = useTRPC();

  const {
    data: workflows,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    ...trpc.admin.autoRenewal.getAllAutoRenewalWorkflows.queryOptions(),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <PageShell padding="admin">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-6 h-6" />
              Auto-Renewal Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingSkeletons />
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell padding="admin">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Auto-Renewal Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  Failed to Load Workflows
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {error?.message ||
                    'An unexpected error occurred while fetching workflow data.'}
                </p>
              </div>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="mt-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!workflows || workflows.length === 0) {
    return (
      <PageShell padding="admin">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-6 h-6" />
              Auto-Renewal Workflows
            </CardTitle>
            <CardDescription>
              View daily auto-renewal workflow runs, domain renewals, and
              payment details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="rounded-full bg-muted p-4">
                <RefreshCw className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  No Auto-Renewal Workflows Found
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The auto-renewal workflow runs daily as a scheduled task. Runs
                  will appear here once triggered.
                </p>
              </div>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="mt-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell padding="admin">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-6 h-6" />
                Auto-Renewal Workflows
              </CardTitle>
              <CardDescription>
                View daily auto-renewal workflow runs, domain renewals, and
                payment details.
              </CardDescription>
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
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <Thead>
                <Tr>
                  <Th>Workflow ID</Th>
                  <Th>Status</Th>
                  <Th>Started</Th>
                  <Th>Users</Th>
                  <Th>Renewed</Th>
                  <Th>Failed</Th>
                  <Th>Revenue</Th>
                  <Th>Duration</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </Thead>
              <TableBody>
                {workflows.map((wf) => (
                  <Tr key={wf.workflowId}>
                    <Td>
                      <code className="text-xs">
                        {wf.workflowId.length > 35
                          ? `${wf.workflowId.slice(0, 35)}...`
                          : wf.workflowId}
                      </code>
                    </Td>
                    <Td>{getStatusBadge(wf.status)}</Td>
                    <Td className="text-sm">
                      {wf.startTime
                        ? formatDistanceToNow(new Date(wf.startTime), {
                            addSuffix: true,
                          })
                        : 'N/A'}
                    </Td>
                    <Td className="text-sm">{wf.summary?.totalUsers ?? '-'}</Td>
                    <Td className="text-sm">
                      {wf.summary?.totalDomainsRenewed ?? '-'}
                    </Td>
                    <Td className="text-sm">
                      {wf.summary != null &&
                      wf.summary.totalDomainsFailed > 0 ? (
                        <span className="text-red-500">
                          {wf.summary.totalDomainsFailed}
                        </span>
                      ) : (
                        (wf.summary?.totalDomainsFailed ?? '-')
                      )}
                    </Td>
                    <Td className="text-sm">
                      {formatUsd(wf.summary?.totalRevenueUsd)}
                    </Td>
                    <Td className="text-sm">
                      {formatDuration(wf.summary?.executionTimeMs)}
                    </Td>
                    <Td className="text-right">
                      <Link
                        href={`/admin/auto-renewal/${wf.workflowId}?runId=${wf.runId}`}
                      >
                        <Button variant="outline" size="sm" className="gap-2">
                          <ExternalLink className="w-4 h-4" />
                          View Details
                        </Button>
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

export default withAdminGuard(AutoRenewalWorkflowsListContent);
