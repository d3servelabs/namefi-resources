'use client';

import NetworkLogo from '@/components/network-logo';
import { TruncatedTextWithHover } from '@/components/truncated-text-with-hover';
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
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import { CHAINS, getChain, getNftExplorerUrl } from '@namefi-astra/utils';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ExternalLink,
  Flame,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { type FC, type HTMLAttributes, Suspense, useMemo } from 'react';
import { config } from '@/lib/env';
import { cn } from '@/lib/cn';
import { range } from 'ramda';

type PreviouslyOwnedDomainRow =
  AppRouterOutput['users']['getCurrentUserBurnedDomains'][number];

const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
    <Card>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Chain</TableHead>
                <TableHead className="w-[140px]">Wallet</TableHead>
                <TableHead>Domain Name</TableHead>
                <TableHead className="w-[150px]">Removal Date</TableHead>
                <TableHead className="w-[120px]">Reason</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {range(0, 6).map((index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-6 w-6" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-32" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
);

const MyPreviouslyOwnedDomainsEmptyPlaceholder: FC<
  HTMLAttributes<HTMLDivElement>
> = ({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <EmptyPlaceholder className={cn('', className)} {...rest}>
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <Flame className="size-10 text-muted-foreground" />
      </div>
      <EmptyPlaceholder.Title>No burned domains found</EmptyPlaceholder.Title>
      <EmptyPlaceholder.Description>
        You don't have any domains that have expired and been removed
      </EmptyPlaceholder.Description>
      <Button variant="outline">
        <Link href={'/'} aria-label="Button to go to the search page">
          Search Page
        </Link>
      </Button>
    </EmptyPlaceholder>
  );
};

function MyPreviouslyOwnedDomainsTable() {
  const trpc = useTRPC();
  const { data: domains } = useSuspenseQuery(
    trpc.users.getCurrentUserBurnedDomains.queryOptions(),
  );

  const columns: ColumnDef<PreviouslyOwnedDomainRow>[] = useMemo(
    () => [
      {
        accessorKey: 'chainId',
        header: 'Chain',
        cell: ({ row }) => (
          <NetworkLogo network={row.getValue('chainId')} className="w-6 h-6" />
        ),
        size: 80,
        enableSorting: false,
        filterFn: 'equals',
      },
      {
        accessorKey: 'fromAddress',
        header: 'Wallet',
        cell: ({ row }) => (
          <TruncatedTextWithHover maxLength={12}>
            {row.getValue('fromAddress')}
          </TruncatedTextWithHover>
        ),
        size: 140,
        enableSorting: false,
      },
      {
        accessorKey: 'normalizedDomainName',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="-mx-3 h-auto px-3 py-1 font-medium hover:bg-transparent justify-start"
            >
              Domain Name
              {column.getIsSorted() === 'asc' ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <span className="font-medium">
            {row.getValue('normalizedDomainName')}
          </span>
        ),
      },
      {
        accessorKey: 'burnedTime',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="-mx-3 h-auto px-3 py-1 font-medium hover:bg-transparent justify-start"
            >
              Removal Date
              {column.getIsSorted() === 'asc' ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const burnedTime = row.getValue('burnedTime') as Date;
          return (
            <span className="text-sm">
              {new Date(burnedTime).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          );
        },
        size: 150,
        sortingFn: (rowA, rowB) => {
          const a = rowA.getValue('burnedTime') as Date;
          const b = rowB.getValue('burnedTime') as Date;
          return new Date(a).getTime() - new Date(b).getTime();
        },
      },
      {
        id: 'reason',
        header: 'Reason',
        cell: () => (
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Expired</span>
          </div>
        ),
        size: 120,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const domainName = row.getValue('normalizedDomainName') as string;
          const explorerUrl = getNftExplorerUrl(
            row.original.chainId ?? null,
            row.original.tokenId ?? null,
          );
          return (
            <div className="flex gap-2">
              {explorerUrl ? (
                <Button variant="outline" size="sm" asChild={true}>
                  <Link
                    href={explorerUrl}
                    aria-label={`View transaction for ${domainName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" /> View Transaction
                  </Link>
                </Button>
              ) : null}
            </div>
          );
        },
        size: 150,
        enableSorting: false,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: domains,
    columns,
    getRowId: (row) => `${row.normalizedDomainName}-${row.burnedBlock}`,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: 'onChange',
  });

  if (domains.length === 0) {
    return <MyPreviouslyOwnedDomainsEmptyPlaceholder />;
  }

  return (
    <Card>
      <CardContent>
        <div className="flex justify-end mb-4 gap-2">
          <Select
            value={
              table.getColumn('chainId')?.getFilterValue()?.toString() ?? '-1'
            }
            onValueChange={(value) =>
              table
                .getColumn('chainId')
                ?.setFilterValue(
                  !value || value === '-1' ? undefined : Number.parseInt(value),
                )
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select chain">
                {(() => {
                  const selectedValue =
                    table.getColumn('chainId')?.getFilterValue()?.toString() ??
                    '-1';
                  if (selectedValue === '-1') {
                    return 'All chains';
                  }
                  const chain = getChain(Number.parseInt(selectedValue));
                  return chain ? (
                    <div className="flex items-center gap-2">
                      <NetworkLogo network={chain.id} className="w-4 h-4" />
                      {chain.name}
                    </div>
                  ) : (
                    'Select chain'
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={'-1'}>All chains</SelectItem>
              {(config.TYPE === 'local' || config.TYPE === 'development') && (
                <SelectItem value={CHAINS.sepolia.id.toString()}>
                  <div className="flex items-center gap-2">
                    <NetworkLogo
                      network={CHAINS.sepolia.id}
                      className="w-4 h-4"
                    />
                    {CHAINS.sepolia.name}
                  </div>
                </SelectItem>
              )}
              <SelectItem value={CHAINS.base.id.toString()}>
                <div className="flex items-center gap-2">
                  <NetworkLogo network={CHAINS.base.id} className="w-4 h-4" />
                  {CHAINS.base.name}
                </div>
              </SelectItem>
              <SelectItem value={CHAINS.mainnet.id.toString()}>
                <div className="flex items-center gap-2">
                  <NetworkLogo
                    network={CHAINS.mainnet.id}
                    className="w-4 h-4"
                  />
                  {CHAINS.mainnet.name}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search domains..."
              value={table.getState().globalFilter ?? ''}
              onChange={(e) => table.setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table style={{ tableLayout: 'fixed' }}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                    >
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
              {table.getRowModel().rows?.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyBurnedDomains() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!(isLoading || isAuthenticated)) {
    return <AuthRequired />;
  }

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Previously Owned Domains</h2>
      </div>
      {isLoading ? (
        <LoadingSkeletons />
      ) : (
        <Suspense fallback={<LoadingSkeletons />}>
          <MyPreviouslyOwnedDomainsTable />
        </Suspense>
      )}
    </div>
  );
}
