'use client';

import { AuthRequired } from '@/components/auth-required';
import { CartCard } from '@/components/cart-card';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { Badge } from '@/components/ui/shadcn/badge';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { useQuery } from '@tanstack/react-query';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { CheckCircle, Clock, Gift, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

type GetUserClaimsResponse = AppRouterOutput['freeClaims']['getUserClaims'];

type ClaimRow = {
  id: string;
  type: 'single' | 'campaign';
  groupOrCampaignKey: string;
  domain: string;
  parentDomain: NamefiNormalizedDomain | null;
  reason: string | null;
  claimingStatus: 'IDLE' | 'CLAIMING' | 'CLAIMED';
  isExpired: boolean;
  expirationDate: Date | null;
  createdAt: Date;
};

function StatusPill({
  status,
  expired,
}: {
  status: ClaimRow['claimingStatus'];
  expired: boolean;
}) {
  if (status === 'IDLE') {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {expired ? 'Expired' : 'Available'}
      </Badge>
    );
  }
  if (status === 'CLAIMING') {
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        In Progress
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="flex items-center gap-1 border-green-200 text-green-700"
    >
      <CheckCircle className="h-3 w-3" />
      Claimed
    </Badge>
  );
}

export default function FreeClaimsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  const claimsQuery = useQuery({
    ...trpc.freeClaims.getUserClaims.queryOptions(),
    enabled: isAuthenticated,
  });

  const isLoading = useMemo(
    () => isAuthLoading || claimsQuery.isLoading,
    [isAuthLoading, claimsQuery.isLoading],
  );

  const rows: ClaimRow[] = useMemo(() => {
    const data: GetUserClaimsResponse | undefined = claimsQuery.data;
    if (!data) return [];

    const flattened: ClaimRow[] = [];
    for (const item of data) {
      if (!item) continue;
      if (item.type === 'singleExactDomain') {
        const c = item.claim;
        flattened.push({
          id: c.id,
          type: 'single',
          groupOrCampaignKey: c.groupOrCampaignKey,
          domain: c.exactDomainName ?? c.claimedDomainName ?? '-',
          parentDomain: c.parentDomain ?? null,
          reason: c.reason,
          claimingStatus: c.claimingStatus,
          isExpired: c.isExpired,
          expirationDate: c.expirationDate,
          createdAt: c.createdAt,
        });
      } else if (item.type === 'campaignParentDomain') {
        for (const c of item.claims) {
          flattened.push({
            id: c.id,
            type: 'campaign',
            groupOrCampaignKey: item.groupOrCampaignKey,
            domain: c.exactDomainName ?? c.claimedDomainName ?? '-',
            parentDomain: item.parentDomain,
            reason: c.reason ?? item.reason,
            claimingStatus: c.claimingStatus,
            isExpired: c.isExpired,
            expirationDate: c.expirationDate,
            createdAt: c.createdAt,
          });
        }
      }
    }
    return flattened;
  }, [claimsQuery.data]);

  const columns = useMemo<ColumnDef<ClaimRow>[]>(
    () => [
      {
        id: 'type',
        header: 'Type',
        accessorFn: (row) => (row.type === 'single' ? 'Single' : 'Campaign'),
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {getValue<string>()}
          </span>
        ),
        enableSorting: true,
      },
      {
        id: 'domain',
        header: 'Domain',
        accessorKey: 'domain',
        enableSorting: true,
      },
      {
        id: 'parentDomain',
        header: 'Parent Domain',
        accessorKey: 'parentDomain',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">
            {getValue<NamefiNormalizedDomain | null>() || '-'}
          </span>
        ),
        enableSorting: true,
      },
      {
        id: 'campaign',
        header: 'Campaign',
        accessorKey: 'groupOrCampaignKey',
        enableSorting: true,
      },
      {
        id: 'reason',
        header: 'Reason',
        accessorKey: 'reason',
        cell: ({ getValue }) => (
          <span
            className="truncate block max-w-[360px]"
            title={getValue<string | null>() || ''}
          >
            {getValue<string | null>() || '-'}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusPill
            status={row.original.claimingStatus}
            expired={row.original.isExpired}
          />
        ),
      },
      {
        id: 'expires',
        header: 'Expires',
        cell: ({ row }) =>
          row.original.expirationDate ? (
            <span>
              {format(new Date(row.original.expirationDate), 'MMM d, yyyy')}
            </span>
          ) : (
            <span className="text-muted-foreground">Never</span>
          ),
      },
      {
        id: 'createdAt',
        header: 'Created',
        accessorFn: (row) => new Date(row.createdAt),
        cell: ({ getValue }) => (
          <span>{format(getValue<Date>(), 'MMM d, yyyy')}</span>
        ),
        sortingFn: 'datetime',
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{ id: 'createdAt', desc: true }],
    },
  });

  if (!(isAuthenticated || isLoading)) {
    return <AuthRequired />;
  }

  return (
    <div className="container mx-auto py-8 px-8">
      <CartCard title="My Free Claims">
        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Parent Domain</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...new Array(5)].map((_, index) => (
                <TableRow key={index}>
                  {[...new Array(8)].map((__, idx) => (
                    <TableCell key={idx}>
                      <Skeleton className="h-5 w-[140px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : rows.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyPlaceholder>
            <div className="bg-muted rounded-full p-4 mb-4">
              <Gift className="h-8 w-8 text-muted-foreground" />
            </div>
            <EmptyPlaceholder.Title>No Free Claims Yet</EmptyPlaceholder.Title>
            <EmptyPlaceholder.Description>
              When you receive free claim opportunities, they will appear here.
            </EmptyPlaceholder.Description>
          </EmptyPlaceholder>
        )}
      </CartCard>
    </div>
  );
}
