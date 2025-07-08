'use client';

import NetworkLogo from '@/components/NetworkLogo';
import { TruncatedTextWithHover } from '@/components/TruncatedTextWithHover';
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
import { useAuth } from '@/hooks/useAuth';
import { useEmailPrompt } from '@/hooks/useEmailPrompt';
import { config } from '@/lib/env';
import { cn } from '@/lib/utils';
import { type AppRouterOutput, useTRPC } from '@/utils/trpc';
import {
  NAMEFI_NFT_CONTRACT_ADDRESS,
  CHAINS,
  getChain,
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
  ChevronUp,
  ChevronsUpDown,
  ExternalLink,
  Search,
  SearchIcon,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type FC,
  type HTMLAttributes,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  EmailRequiredModal,
  DNS_MANAGEMENT_EMAIL_REQUIRED,
} from '@/components/modals/EmailRequiredModal';

type DomainRow = AppRouterOutput['users']['getCurrentUserDomains'][number];

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
                <TableHead className="w-[120px]">Expires On</TableHead>
                <TableHead className="w-[280px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...new Array(3)].map((_, index) => (
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

const MyDomainsEmptyPlaceholder: FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <EmptyPlaceholder className={cn('', className)} {...rest}>
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <SearchIcon className="size-10 text-muted-foreground" />
      </div>
      <EmptyPlaceholder.Title>No domains found</EmptyPlaceholder.Title>
      <EmptyPlaceholder.Description>
        Start the search for your next domain by clicking the button below
      </EmptyPlaceholder.Description>
      <Button variant="outline">
        <Link href={'/'} aria-label="Button to go to the search page">
          Search Page
        </Link>
      </Button>
    </EmptyPlaceholder>
  );
};

function MyDomainsTable() {
  const trpc = useTRPC();
  const { data: domains } = useSuspenseQuery(
    trpc.users.getCurrentUserDomains.queryOptions(),
  );

  const [showEmailModal, setShowEmailModal] = useState(false);
  const { hasEmail } = useEmailPrompt();
  const router = useRouter();

  const handleManageDnsClick = useCallback(
    (domainName: string, e: React.MouseEvent) => {
      e.preventDefault();
      if (!hasEmail) {
        setShowEmailModal(true);
      } else {
        router.push(`/domain/${domainName}`);
      }
    },
    [hasEmail, router],
  );

  const columns: ColumnDef<DomainRow>[] = useMemo(
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
        accessorKey: 'ownerAddress',
        header: 'Wallet',
        cell: ({ row }) => (
          <TruncatedTextWithHover maxLength={12}>
            {row.getValue('ownerAddress')}
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
          <Link
            href={`/domain/${row.getValue('normalizedDomainName')}`}
            aria-label={`Settings for ${row.getValue('normalizedDomainName')}`}
            className="font-medium hover:underline"
          >
            {row.getValue('normalizedDomainName')}
          </Link>
        ),
      },
      {
        accessorKey: 'expirationDate',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="-mx-3 h-auto px-3 py-1 font-medium hover:bg-transparent justify-start"
            >
              Expires On
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
          const expirationDate = row.getValue('expirationDate') as
            | string
            | undefined;
          return expirationDate ? (
            <span className="text-sm">
              {new Date(expirationDate).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          );
        },
        size: 120,
        sortingFn: (rowA, rowB) => {
          const a = rowA.getValue('expirationDate') as string | undefined;
          const b = rowB.getValue('expirationDate') as string | undefined;

          if (!a && !b) return 0;
          if (!a) return 1;
          if (!b) return -1;

          return new Date(a).getTime() - new Date(b).getTime();
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) =>
                handleManageDnsClick(row.getValue('normalizedDomainName'), e)
              }
              aria-label={`Settings for ${row.getValue('normalizedDomainName')}`}
            >
              <Settings className="w-4 h-4 mr-1" /> Manage DNS
            </Button>
            <Button variant="outline" size="sm" asChild={true}>
              <Link
                href={`https://basescan.org/nft/${NAMEFI_NFT_CONTRACT_ADDRESS}/${row.original.tokenId ?? ''}`}
                aria-label={`View NFT for ${row.getValue('normalizedDomainName')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-1" /> View NFT
              </Link>
            </Button>
          </div>
        ),
        size: 280,
        enableSorting: false,
      },
    ],
    [handleManageDnsClick],
  );

  const table = useReactTable({
    data: domains,
    columns,
    getRowId: (row) => row.normalizedDomainName,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: 'onChange',
  });

  if (domains.length === 0) {
    return <MyDomainsEmptyPlaceholder />;
  }

  return (
    <>
      <EmailRequiredModal
        isOpen={showEmailModal}
        onOpenChange={setShowEmailModal}
        title={DNS_MANAGEMENT_EMAIL_REQUIRED.title}
        description={DNS_MANAGEMENT_EMAIL_REQUIRED.description}
        actionText={DNS_MANAGEMENT_EMAIL_REQUIRED.actionText}
      />
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
                    !value || value === '-1'
                      ? undefined
                      : Number.parseInt(value),
                  )
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select chain">
                  {(() => {
                    const selectedValue =
                      table
                        .getColumn('chainId')
                        ?.getFilterValue()
                        ?.toString() ?? '-1';
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
    </>
  );
}

export default function MyDomains() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!(isLoading || isAuthenticated)) {
    return <AuthRequired />;
  }

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Domains</h2>
      </div>
      {isLoading ? (
        <LoadingSkeletons />
      ) : (
        <Suspense fallback={<LoadingSkeletons />}>
          <MyDomainsTable />
        </Suspense>
      )}
    </div>
  );
}
