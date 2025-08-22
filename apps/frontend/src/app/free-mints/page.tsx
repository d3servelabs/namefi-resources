'use client';

import { AuthRequired } from '@/components/auth-required';
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
import { useFreeMints, type FreeMint } from '@/hooks/use-free-mints';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { FreeMintCard } from '@/components/free-mint-card';

export default function FreeClaimsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const { freeMints: rows, isLoading: isFreeMintsLoading } = useFreeMints();

  const isLoading = useMemo(
    () => isAuthLoading || isFreeMintsLoading,
    [isAuthLoading, isFreeMintsLoading],
  );

  const { activeClaims, inactiveClaims } = useMemo(() => {
    const active: FreeMint[] = [];
    const inactive: FreeMint[] = [];

    for (const mint of rows) {
      if (!mint.isExpired && mint.claimingStatus === 'IDLE') {
        active.push(mint);
      } else {
        inactive.push(mint);
      }
    }

    return { activeClaims: active, inactiveClaims: inactive };
  }, [rows]);

  const columns = useMemo<ColumnDef<FreeMint>[]>(
    () => [
      // Item
      {
        id: 'item',
        header: 'Item',
        cell: ({ row }) => {
          const { type, domain } = row.original;
          if (type === 'single') {
            return (
              <span className="font-medium bg-muted px-2 py-1 rounded">
                {domain}
              </span>
            );
          }
          if (type === 'campaign') {
            return (
              <span>
                Any{' '}
                <span className="font-medium bg-muted px-2 py-1 rounded">
                  {domain}
                </span>{' '}
                subdomain
              </span>
            );
          }
          return <span className="text-muted-foreground">-</span>;
        },
        enableSorting: false,
      },
      // Awarded On
      {
        id: 'createdAt',
        header: 'Awarded On',
        accessorFn: (row) => new Date(row.createdAt),
        cell: ({ getValue }) => (
          <span>{format(getValue<Date>(), 'MMM d, yyyy')}</span>
        ),
        sortingFn: 'datetime',
      },
      // Valid Until
      {
        id: 'expires',
        header: 'Valid Until',
        cell: ({ row }) =>
          row.original.expirationDate ? (
            <span>
              {format(new Date(row.original.expirationDate), 'MMM d, yyyy')}
            </span>
          ) : (
            <span className="text-muted-foreground">∞</span>
          ),
      },
      // Status
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const { claimingStatus, isExpired } = row.original;
          if (claimingStatus === 'CLAIMED') {
            return (
              <Badge
                variant="outline"
                className="text-green-500 border-green-500/40"
              >
                Claimed
              </Badge>
            );
          }
          if (claimingStatus === 'CLAIMING') {
            return (
              <Badge variant="default">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> In Progress
              </Badge>
            );
          }
          if (isExpired) {
            return <Badge variant="destructive">Expired</Badge>;
          }
          return <Badge variant="secondary">Available</Badge>;
        },
      },
      // Claimed Domain
      {
        id: 'claimedDomain',
        header: 'Claimed Domain',
        cell: ({ row }) =>
          row.original.claimedDomainName ? (
            <span className="font-medium bg-muted px-2 py-1 rounded">
              {row.original.claimedDomainName}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      // Claimed On
      {
        id: 'claimedAt',
        header: 'Claimed On',
        cell: ({ row }) =>
          row.original.claimedAt ? (
            <span>
              {format(new Date(row.original.claimedAt), 'MMM d, yyyy')}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: inactiveClaims,
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
      {/* Page Header */}
      <h1 className="mb-10 text-3xl md:text-4xl font-bold tracking-tight">
        My Free Mints
      </h1>

      {isLoading ? (
        <div className="space-y-8">
          {/* Loading state for active claims section */}
          <div className="space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold">
              Available Claims
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...new Array(2)].map((_, index) => (
                <div key={index} className="rounded-2xl border p-6 space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-20" />
                </div>
              ))}
            </div>
          </div>

          {/* Loading state for table section */}
          <div className="space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold">Claim History</h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Awarded On</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Claimed Domain</TableHead>
                    <TableHead>Claimed On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...new Array(3)].map((_, index) => (
                    <TableRow key={index}>
                      {[...new Array(6)].map((__, idx) => (
                        <TableCell key={idx}>
                          <Skeleton className="h-5 w-[140px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Claims Section */}
          {activeClaims.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeClaims.map((claim) => (
                <FreeMintCard key={claim.id} claim={claim} />
              ))}
            </div>
          )}

          {/* Inactive Claims Table Section */}
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-semibold">History</h2>
            {inactiveClaims.length > 0 ? (
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
              <p className="text-muted-foreground text-center py-8">
                No claim history yet.
              </p>
            )}
          </div>

          {/* Empty state when no claims at all */}
          {activeClaims.length === 0 && inactiveClaims.length === 0 && (
            <EmptyPlaceholder>
              <div className="bg-muted rounded-full p-4 mb-4" />
              <EmptyPlaceholder.Title>No Free Mints Yet</EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                When you receive free claim opportunities, they will appear
                here.
              </EmptyPlaceholder.Description>
            </EmptyPlaceholder>
          )}
        </div>
      )}
    </div>
  );
}
