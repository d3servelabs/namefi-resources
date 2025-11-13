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
  Flame,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { withAdminGuard } from './admin-guard';

const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center space-x-4 p-4 border rounded-lg"
      >
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-8 w-[100px]" />
      </div>
    ))}
  </div>
);

function BulkBurnWorkflowsListContent() {
  const trpc = useTRPC();

  const {
    data: workflows,
    isLoading,
    refetch,
  } = useQuery({
    ...trpc.admin.getAllBulkBurnWorkflows.queryOptions(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Running':
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
            Waiting Approval
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </Badge>
        );
      case 'Completed':
      case 'COMPLETED':
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </Badge>
        );
      case 'Canceled':
      case 'CANCELLED':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Cancelled
          </Badge>
        );
      case 'TIMED_OUT':
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            Timed Out
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-6 h-6" />
              Bulk Burn Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingSkeletons />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!workflows || workflows.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-6 h-6" />
              Bulk Burn Workflows
            </CardTitle>
            <CardDescription>
              View and manage bulk burning operations for expired domain NFTs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="rounded-full bg-muted p-4">
                <Flame className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  No Bulk Burn Workflows Found
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
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
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-6 h-6" />
                Bulk Burn Workflows
              </CardTitle>
              <CardDescription>
                View and manage bulk burning operations for expired domain NFTs
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
                  <Th>Domains</Th>
                  <Th>Completed</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </Thead>
              <TableBody>
                {workflows.map((workflow) => (
                  <Tr key={workflow.workflowId}>
                    <Td>
                      <code className="text-xs">
                        {workflow.workflowId.slice(0, 30)}...
                      </code>
                    </Td>
                    <Td>{getStatusBadge(workflow.status)}</Td>
                    <Td className="text-sm">
                      {workflow.startTime
                        ? formatDistanceToNow(new Date(workflow.startTime), {
                            addSuffix: true,
                          })
                        : 'N/A'}
                    </Td>
                    <Td className="text-sm">
                      {workflow.state?.totalRequested || 'N/A'}
                    </Td>
                    <Td className="text-sm">
                      {workflow.closeTime
                        ? format(new Date(workflow.closeTime), 'MMM dd, yyyy')
                        : '-'}
                    </Td>
                    <Td className="text-right">
                      <Link href={`/admin/bulk-burn/${workflow.workflowId}`}>
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
    </div>
  );
}

export default withAdminGuard(BulkBurnWorkflowsListContent);
