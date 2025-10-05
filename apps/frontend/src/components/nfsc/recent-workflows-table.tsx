'use client';

import { useState, useMemo } from 'react';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/table/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Label } from '@/components/ui/shadcn/label';
import { RefreshCwIcon, EyeIcon, Loader2Icon } from 'lucide-react';
import { format } from 'date-fns';
import JsonView from '@uiw/react-json-view';
import { useTheme } from 'next-themes';
import { NetworkLogo } from '@/components/network-logo';
import { AutoTruncateText } from '../auto-truncate-text';

type WorkflowRow = {
  workflowId: string;
  workflowType: string;
  status: string;
  startTime: Date | null;
  closeTime: Date | null;
  runId: string;
  memo: any;
  searchAttributes: any;
};

const getStatusColor = (
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'COMPLETED':
      return 'secondary';
    case 'RUNNING':
      return 'default';
    case 'FAILED':
    case 'TERMINATED':
    case 'TIMED_OUT':
      return 'destructive';
    default:
      return 'outline';
  }
};

export function RecentWorkflowsTable() {
  const trpc = useTRPC();
  const { theme } = useTheme();
  const [days, setDays] = useState<number>(7);
  const [pageSize, setPageSize] = useState<number>(50);
  const [orderBy, setOrderBy] = useState<'timestamp_desc' | 'timestamp_asc'>(
    'timestamp_desc',
  );
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRow | null>(
    null,
  );
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    ...trpc.admin.nfsc.listRecentMintWorkflows.queryOptions({
      days,
      limit: pageSize,
    }),
  });

  const workflows: WorkflowRow[] = data?.workflows || [];

  const columns = useMemo<ColumnDef<WorkflowRow, any>[]>(
    () => [
      {
        accessorKey: 'workflowId',
        header: 'Workflow ID',
        cell: ({ row }) => (
          <div className="font-mono text-xs">
            <AutoTruncateText minCharactersToDisplay={20}>
              {row.original.workflowId}
            </AutoTruncateText>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={getStatusColor(row.original.status)}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'recipientWallet',
        header: 'Recipient',
        cell: ({ row }) => {
          const wallet = row.original.memo?.recipientWallet;
          return wallet ? (
            <div className="font-mono text-xs">
              <AutoTruncateText minCharactersToDisplay={16}>
                {wallet}
              </AutoTruncateText>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount (NFSC)',
        cell: ({ row }) => {
          const amount = row.original.memo?.amount;
          return amount ? (
            <div className="font-semibold">{amount}</div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'chainId',
        header: 'Chain',
        cell: ({ row }) => {
          const chainId = row.original.memo?.chainId;
          const chainNames: Record<number, string> = {
            1: 'Mainnet',
            8453: 'Base',
            137: 'Polygon',
            11155111: 'Sepolia',
            84532: 'Base Sepolia',
          };
          return chainId ? (
            <div className="flex items-center gap-2">
              <NetworkLogo network={chainId} className="w-6 h-6" />
              <span className="text-sm">{chainNames[chainId] || chainId}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => {
          const reason = row.original.memo?.reason;
          return reason ? (
            <div className="text-sm">
              <AutoTruncateText minCharactersToDisplay={20}>
                {reason}
              </AutoTruncateText>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'adminEmail',
        header: 'Admin',
        cell: ({ row }) => {
          const email = row.original.memo?.adminEmail;
          return email ? (
            <div className="text-sm">{email}</div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'startTime',
        header: 'Started',
        cell: ({ row }) => {
          const time = row.original.startTime;
          return time ? (
            <div className="text-xs text-muted-foreground">
              {format(new Date(time), 'MMM dd, yyyy HH:mm:ss')}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'closeTime',
        header: 'Completed',
        cell: ({ row }) => {
          const time = row.original.closeTime;
          return time ? (
            <div className="text-xs text-muted-foreground">
              {format(new Date(time), 'MMM dd, yyyy HH:mm:ss')}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 50,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedWorkflow(row.original);
              setDetailsModalOpen(true);
            }}
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="days-filter">Time Range:</Label>
            <Select
              value={days.toString()}
              onValueChange={(v) => setDays(Number(v))}
            >
              <SelectTrigger id="days-filter" className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 hours</SelectItem>
                <SelectItem value="3">Last 3 days</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            {workflows.length} workflow{workflows.length === 1 ? '' : 's'} found
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCwIcon className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Table */}
      <DataTable<WorkflowRow>
        columns={columns}
        data={workflows}
        isLoading={isLoading}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        nextPageToken={
          data?.nextPageToken instanceof Uint8Array
            ? new TextDecoder().decode(data.nextPageToken)
            : (data?.nextPageToken as string | undefined)
        }
        onLoadMore={() => {
          // Could implement pagination here if needed
          // For now, just increase page size
          setPageSize((prev) => prev + 50);
        }}
        orderBy={orderBy}
        onOrderByChange={setOrderBy}
      />

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-4xl! max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workflow Details</DialogTitle>
          </DialogHeader>

          {selectedWorkflow && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Workflow ID
                  </Label>
                  <div className="font-mono text-xs mt-1">
                    {selectedWorkflow.workflowId}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Run ID
                  </Label>
                  <div className="font-mono text-xs mt-1">
                    {selectedWorkflow.runId}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Status
                  </Label>
                  <div className="mt-1">
                    <Badge variant={getStatusColor(selectedWorkflow.status)}>
                      {selectedWorkflow.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Workflow Type
                  </Label>
                  <div className="text-sm mt-1">
                    {selectedWorkflow.workflowType}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Memo Data</Label>
                <div className="mt-2 border rounded-lg p-3 bg-muted/50">
                  <JsonView
                    value={selectedWorkflow.memo}
                    collapsed={1}
                    displayDataTypes={false}
                    style={
                      {
                        '--w-rjv-background-color': 'transparent',
                        '--w-rjv-border-left-width': '0px',
                        '--w-rjv-color':
                          theme === 'dark' ? '#e5e7eb' : '#1f2937',
                        '--w-rjv-key-string':
                          theme === 'dark' ? '#93c5fd' : '#2563eb',
                        '--w-rjv-info-color':
                          theme === 'dark' ? '#9ca3af' : '#6b7280',
                        '--w-rjv-line-color':
                          theme === 'dark' ? '#4b5563' : '#d1d5db',
                        '--w-rjv-arrow-color':
                          theme === 'dark' ? '#9ca3af' : '#6b7280',
                        '--w-rjv-edit-color':
                          theme === 'dark' ? '#60a5fa' : '#3b82f6',
                        '--w-rjv-copied-color':
                          theme === 'dark' ? '#34d399' : '#10b981',
                      } as any
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Search Attributes</Label>
                <div className="mt-2 border rounded-lg p-3 bg-muted/50">
                  <JsonView
                    value={selectedWorkflow.searchAttributes}
                    collapsed={1}
                    displayDataTypes={false}
                    style={
                      {
                        '--w-rjv-background-color': 'transparent',
                        '--w-rjv-border-left-width': '0px',
                        '--w-rjv-color':
                          theme === 'dark' ? '#e5e7eb' : '#1f2937',
                        '--w-rjv-key-string':
                          theme === 'dark' ? '#93c5fd' : '#2563eb',
                        '--w-rjv-info-color':
                          theme === 'dark' ? '#9ca3af' : '#6b7280',
                        '--w-rjv-line-color':
                          theme === 'dark' ? '#4b5563' : '#d1d5db',
                        '--w-rjv-arrow-color':
                          theme === 'dark' ? '#9ca3af' : '#6b7280',
                        '--w-rjv-edit-color':
                          theme === 'dark' ? '#60a5fa' : '#3b82f6',
                        '--w-rjv-copied-color':
                          theme === 'dark' ? '#34d399' : '#10b981',
                      } as any
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
