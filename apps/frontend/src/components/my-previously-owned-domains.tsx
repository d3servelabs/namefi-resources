'use client';

import NetworkLogo from '@/components/network-logo';
import { AuthRequired } from '@/components/auth-required';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { AddressWithChain } from '@/components/address-with-chain';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
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
import {
  CHAINS,
  checksumWalletAddressSchema,
  getChain,
  getNftExplorerUrl,
} from '@namefi-astra/utils';
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
  Copy,
  ExternalLink,
  Flame,
  Search,
  ArrowDownWideNarrowIcon,
  ArrowUpDownIcon,
  ArrowUpNarrowWideIcon,
} from 'lucide-react';
import Link from 'next/link';
import {
  type FC,
  type HTMLAttributes,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { config } from '@/lib/env';
import { cn } from '@/lib/cn';
import { range } from 'ramda';
import { UserWalletAvatar } from '@/components/user-avatar';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { toast } from 'sonner';

type PreviouslyOwnedDomainRow =
  AppRouterOutput['users']['getCurrentUserBurnedDomains'][number];
type RemovalType = PreviouslyOwnedDomainRow['removalType'];

const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Domain Name</TableHead>
            <TableHead className="w-[200px]">Account</TableHead>
            <TableHead className="w-[150px]">Removal Date</TableHead>
            <TableHead className="w-[220px]">Reason</TableHead>
            <TableHead className="w-[220px]">Receiving Wallet</TableHead>
            <TableHead className="w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {range(0, 6).map((index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-6 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-32" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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
      <EmptyPlaceholder.Title>
        No previously owned domains found
      </EmptyPlaceholder.Title>
      <EmptyPlaceholder.Description>
        You haven't burned or transferred any domains away from your linked
        wallets yet
      </EmptyPlaceholder.Description>
      <Button variant="outline">
        <Link href={'/'} aria-label="Button to go to the search page">
          Search Page
        </Link>
      </Button>
    </EmptyPlaceholder>
  );
};

const formatWalletAddress = (address: string) => {
  const parsed = checksumWalletAddressSchema.safeParse(address);
  return parsed.success ? parsed.data : address;
};

const removalReasonMeta: Record<RemovalType, { label: string }> = {
  domain_expired: {
    label: 'Domain Expired',
  },
  transferred_to_another_wallet: {
    label: 'Transferred To Another Wallet',
  },
  domain_exported: {
    label: 'Domain Exported',
  },
};

const reasonFilterOptions: Array<{ value: RemovalType; label: string }> = [
  {
    value: 'domain_expired',
    label: removalReasonMeta.domain_expired.label,
  },
  {
    value: 'transferred_to_another_wallet',
    label: removalReasonMeta.transferred_to_another_wallet.label,
  },
  {
    value: 'domain_exported',
    label: removalReasonMeta.domain_exported.label,
  },
];

function MyPreviouslyOwnedDomainsTable() {
  const trpc = useTRPC();
  const { data: domains } = useSuspenseQuery(
    trpc.users.getCurrentUserBurnedDomains.queryOptions(),
  );

  const columns: ColumnDef<PreviouslyOwnedDomainRow>[] = useMemo(
    () => [
      {
        accessorKey: 'normalizedDomainName',
        header: 'Domain Name',
        cell: ({ row }) => (
          <span className="font-medium">
            {row.getValue('normalizedDomainName')}
          </span>
        ),
        filterFn: 'includesString',
      },
      {
        id: 'account',
        header: 'Account',
        cell: ({ row }) => (
          <AddressWithChain
            address={row.original.fromAddress ?? null}
            chainId={row.original.chainId ?? null}
          />
        ),
        size: 200,
        enableSorting: false,
      },
      {
        id: 'chainId',
        accessorKey: 'chainId',
        header: 'Chain',
        cell: () => null,
        size: 0,
        enableSorting: false,
        filterFn: 'equals',
      },
      {
        accessorKey: 'removedAt',
        header: 'Removal Date',
        cell: ({ row }) => {
          const removedAt = row.getValue('removedAt') as Date;
          return (
            <span className="text-sm">
              {new Date(removedAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          );
        },
        size: 150,
        sortingFn: (rowA, rowB) => {
          const a = rowA.getValue('removedAt') as Date;
          const b = rowB.getValue('removedAt') as Date;
          return new Date(a).getTime() - new Date(b).getTime();
        },
      },
      {
        accessorKey: 'removalReason',
        header: 'Reason',
        cell: ({ row }) => {
          const defaultReason = row.getValue('removalReason') as string;
          const isSepoliaExport =
            row.original.removalType === 'domain_exported' &&
            row.original.chainId === CHAINS.sepolia.id;
          const label = isSepoliaExport
            ? 'Domain Exported (Fake)'
            : defaultReason;
          const extraText = isSepoliaExport
            ? 'Actual Reason: Removed From Test Chain'
            : null;

          return (
            <div className="flex flex-col gap-1">
              <span className="text-sm text-white">{label}</span>
              {extraText ? (
                <span className="text-xs text-muted-foreground">
                  {extraText}
                </span>
              ) : null}
            </div>
          );
        },
        size: 220,
        enableSorting: false,
        filterFn: (row, _columnId, filterValue) => {
          const filters = filterValue as RemovalType[] | undefined;
          if (!filters || filters.length === 0) {
            return true;
          }
          return filters.includes(row.original.removalType);
        },
      },
      {
        id: 'receivingWallet',
        header: 'Receiving Wallet',
        cell: ({ row }) => {
          if (
            row.original.removalType !== 'transferred_to_another_wallet' ||
            !row.original.toAddress
          ) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
          return (
            <AddressWithChain
              address={row.original.toAddress}
              chainId={row.original.chainId ?? null}
            />
          );
        },
        size: 220,
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

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    chainId: false,
  });

  const table = useReactTable({
    data: domains,
    columns,
    getRowId: (row) => row.eventId,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: 'onChange',
  });
  const reasonFilterValue =
    (table.getColumn('removalReason')?.getFilterValue() as RemovalType[]) ?? [];

  const handleReasonFilterChange = useCallback(
    (next: RemovalType[]) => {
      table
        .getColumn('removalReason')
        ?.setFilterValue(next.length === 0 ? undefined : next);
    },
    [table],
  );

  const reasonFilterSummary =
    reasonFilterValue.length === 0
      ? 'All'
      : `${reasonFilterValue.length} selected`;

  if (domains.length === 0) {
    return <MyPreviouslyOwnedDomainsEmptyPlaceholder />;
  }

  return (
    <>
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter domains..."
            value={
              (table
                .getColumn('normalizedDomainName')
                ?.getFilterValue() as string) ?? ''
            }
            onChange={(e) =>
              table
                .getColumn('normalizedDomainName')
                ?.setFilterValue(e.target.value)
            }
            className="pl-8"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild={true}>
              <Button
                variant="outline"
                className="min-w-[220px] justify-between text-left"
              >
                <span className="text-sm font-medium">Reason</span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  {reasonFilterSummary}
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {reasonFilterOptions.map((option) => {
                const checked = reasonFilterValue.includes(option.value);
                return (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={checked}
                    onCheckedChange={(nextChecked) => {
                      const next = nextChecked
                        ? [...reasonFilterValue, option.value]
                        : reasonFilterValue.filter(
                            (value) => value !== option.value,
                          );
                      handleReasonFilterChange(Array.from(new Set(next)));
                    }}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleReasonFilterChange([])}
                className="text-xs text-muted-foreground"
              >
                Clear filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table style={{ tableLayout: 'fixed' }}>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="p-0"
                  >
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        className={cn(
                          'w-full px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                          'cursor-pointer select-none hover:text-foreground transition-colors',
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span className="flex items-center gap-2">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                          {header.column.getIsSorted() === 'asc' ? (
                            <ArrowUpNarrowWideIcon className="h-3 w-3 text-primary" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ArrowDownWideNarrowIcon className="h-3 w-3 text-primary" />
                          ) : (
                            <ArrowUpDownIcon className="h-3 w-3 opacity-50" />
                          )}
                        </span>
                      </button>
                    ) : (
                      <div className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="bg-background divide-y divide-border">
            {table.getRowModel().rows?.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className="px-4 py-3 overflow-hidden"
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
    </>
  );
}

export function MyPreviouslyOwnedDomainsContent() {
  return (
    <Suspense fallback={<LoadingSkeletons />}>
      <MyPreviouslyOwnedDomainsTable />
    </Suspense>
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
      {isLoading ? <LoadingSkeletons /> : <MyPreviouslyOwnedDomainsContent />}
    </div>
  );
}
