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
import { useFreeMints, type FreeMint } from '@/hooks/use-free-mints';
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
import { Button } from '@/components/ui/shadcn/button';
import Link from 'next/link';
import { useFreeMintsGuidance } from '@/components/providers/free-mints-guidance';

function ClaimButton({ row }: { row: FreeMint }) {
  const { claimingStatus, isExpired, domain, type, parentDomain } = row;
  const { startCampaignSearch } = useFreeMintsGuidance();

  // Show different states based on claim status
  if (claimingStatus === 'CLAIMED') {
    return (
      <Badge variant="outline" className="flex items-center gap-1 h-8 px-3">
        <CheckCircle className="h-3 w-3" />
        Claimed{' '}
        <span className="bg-muted px-1 py-0.5 rounded text-xs">{domain}</span>
      </Badge>
    );
  }

  if (claimingStatus === 'CLAIMING') {
    return (
      <Badge variant="default" className="flex items-center gap-1 h-8 px-3">
        <Loader2 className="h-3 w-3 animate-spin" />
        In Progress
      </Badge>
    );
  }

  if (isExpired) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1 h-8 px-3">
        <Clock className="h-3 w-3" />
        Expired
      </Badge>
    );
  }

  // For single exact domain claims, navigate to claim page
  if (type === 'single') {
    return (
      <Button
        asChild={true}
        size="sm"
        className="shrink-0 bg-brand-primary hover:bg-brand-primary/90 text-secondary-foreground"
      >
        <Link href={`/claim/${encodeURIComponent(domain)}`}>Claim</Link>
      </Button>
    );
  }

  // For campaign claims, start campaign search
  if (type === 'campaign' && parentDomain) {
    return (
      <Button
        size="sm"
        className="shrink-0 bg-brand-primary hover:bg-brand-primary/90 text-secondary-foreground"
        onClick={() => startCampaignSearch(parentDomain)}
      >
        Claim
      </Button>
    );
  }

  // Fallback for unavailable claims
  return (
    <Badge variant="secondary" className="flex items-center gap-1 h-8 px-3">
      <Clock className="h-3 w-3" />
      Unavailable
    </Badge>
  );
}

export default function FreeClaimsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const { freeMints: rows, isLoading: isFreeMintsLoading } = useFreeMints();

  const isLoading = useMemo(
    () => isAuthLoading || isFreeMintsLoading,
    [isAuthLoading, isFreeMintsLoading],
  );

  const columns = useMemo<ColumnDef<FreeMint>[]>(
    () => [
      {
        id: 'claimable',
        header: 'What You Can Mint',
        cell: ({ row }) => {
          const { type, domain, parentDomain } = row.original;

          if (type === 'single') {
            return (
              <span className="font-medium bg-muted px-2 py-1 rounded">
                {domain}
              </span>
            );
          }

          if (type === 'campaign' && parentDomain) {
            return (
              <span>
                Any{' '}
                <span className="font-medium bg-muted px-2 py-1 rounded">
                  {String(parentDomain)}
                </span>{' '}
                subdomain
              </span>
            );
          }

          return <span className="text-muted-foreground">-</span>;
        },
        enableSorting: false,
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
        header: 'Awarded On',
        accessorFn: (row) => new Date(row.createdAt),
        cell: ({ getValue }) => (
          <span>{format(getValue<Date>(), 'MMM d, yyyy')}</span>
        ),
        sortingFn: 'datetime',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => <ClaimButton row={row.original} />,
        enableSorting: false,
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
      <CartCard title="My Free Mints">
        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>What You Can Mint</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...new Array(5)].map((_, index) => (
                <TableRow key={index}>
                  {[...new Array(5)].map((__, idx) => (
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
