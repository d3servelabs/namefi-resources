'use client';

import NetworkLogo from '@/components/network-logo';
import { AuthRequired } from '@/components/auth-required';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { PageShell } from '@/components/page-shell';
import { AddressWithChain } from '@/components/address-with-chain';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import type { IFilterStrategy } from '@/components/table/filters/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { CHAINS, getChain } from '@namefi-astra/utils/chains';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef, Row, SortingState } from '@tanstack/react-table';
import { ChevronDown, Flame } from 'lucide-react';
import Link from 'next/link';
import {
  type FC,
  type HTMLAttributes,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { config } from '@/lib/env';
import { cn } from '@namefi-astra/ui/lib/cn';
import { range } from 'ramda';
import {
  formatRemovalDate,
  getReceivingWallet,
  getRemovalReasonDisplay,
  type PreviouslyOwnedDomainRow,
  ViewNftAction,
} from '@/components/previously-owned-domain-cells';
import { PreviouslyOwnedDomainCard } from '@/components/previously-owned-domain-card';

type RemovalType = PreviouslyOwnedDomainRow['removalType'];

// ExtensibleDataTable owns pagination/sorting/filtering (all manual), so the
// parent feeds it the already filtered + sorted rows. This table has no
// pagination, so a single page holds every row.
const noop = () => undefined;

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
      <Button render={<Link href="/" />} nativeButton={false} variant="outline">
        Search Page
      </Button>
    </EmptyPlaceholder>
  );
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
  const { data: _domains, isLoading } = useQuery({
    ...trpc.users.getCurrentUserBurnedDomains.queryOptions(void 0, {
      trpc: { context: { skipBatch: true } },
    }),
  });
  const domains = _domains ?? [];

  const [domainSearch, setDomainSearch] = useState('');
  const [chainFilter, setChainFilter] = useState<number | undefined>(undefined);
  const [reasonFilter, setReasonFilter] = useState<RemovalType[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<PreviouslyOwnedDomainRow>[] = useMemo(
    () => [
      {
        accessorKey: 'normalizedDomainName',
        header: `Domain Name (${domains.length})`,
        cell: ({ row }) => (
          <span className="font-medium">
            {row.getValue('normalizedDomainName')}
          </span>
        ),
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
      },
      {
        accessorKey: 'removedAt',
        header: 'Removal Date',
        cell: ({ row }) => (
          <span className="text-sm">
            {formatRemovalDate(row.getValue('removedAt') as Date)}
          </span>
        ),
        size: 150,
      },
      {
        accessorKey: 'removalReason',
        header: 'Reason',
        cell: ({ row }) => {
          const { label, extraText } = getRemovalReasonDisplay(row.original);
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
      },
      {
        id: 'receivingWallet',
        header: 'Receiving Wallet',
        cell: ({ row }) => {
          const receivingWallet = getReceivingWallet(row.original);
          if (!receivingWallet) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
          return (
            <AddressWithChain
              address={receivingWallet}
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
        cell: ({ row }) => (
          <div className="flex gap-2">
            <ViewNftAction row={row.original} />
          </div>
        ),
        size: 150,
        enableSorting: false,
      },
    ],
    [domains.length],
  );

  const {
    preferences: { columnVisibility },
    setColumnVisibility,
    resetToDefaults,
  } = useTablePreferences({
    tableId: 'previously-owned-domains',
    defaultPreferences: {
      columnVisibility: {
        chainId: false,
      },
    },
  });

  const filteredDomains = useMemo(() => {
    let result = domains;
    if (chainFilter !== undefined) {
      result = result.filter((domain) => domain.chainId === chainFilter);
    }
    if (reasonFilter.length > 0) {
      result = result.filter((domain) =>
        reasonFilter.includes(domain.removalType),
      );
    }
    const needle = domainSearch.trim().toLowerCase();
    if (needle) {
      result = result.filter((domain) =>
        domain.normalizedDomainName.toLowerCase().includes(needle),
      );
    }
    return result;
  }, [domains, chainFilter, reasonFilter, domainSearch]);

  const sortedDomains = useMemo(() => {
    if (sorting.length === 0) {
      return filteredDomains;
    }
    const next = [...filteredDomains];
    next.sort((a, b) => {
      for (const sort of sorting) {
        let result = 0;
        if (sort.id === 'normalizedDomainName') {
          result = a.normalizedDomainName.localeCompare(
            b.normalizedDomainName,
            undefined,
            { sensitivity: 'base' },
          );
        } else if (sort.id === 'removedAt') {
          result =
            new Date(a.removedAt).getTime() - new Date(b.removedAt).getTime();
        }
        if (result !== 0) {
          return sort.desc ? -result : result;
        }
      }
      return 0;
    });
    return next;
  }, [filteredDomains, sorting]);

  const handleReasonFilterChange = useCallback((next: RemovalType[]) => {
    setReasonFilter(next);
  }, []);

  // Mobile card renderer. Reuses the same shared cell helpers the desktop columns
  // use, so a phone-sized viewport gets a readable stacked card per row instead
  // of a horizontally-scrolling table.
  const renderMobileCard = useCallback(
    (row: Row<PreviouslyOwnedDomainRow>) => (
      <PreviouslyOwnedDomainCard domain={row.original} />
    ),
    [],
  );

  const reasonFilterSummary =
    reasonFilter.length === 0 ? 'All' : `${reasonFilter.length} selected`;

  if (isLoading || !_domains) {
    return <LoadingSkeletons />;
  }

  if (domains.length === 0) {
    return <MyPreviouslyOwnedDomainsEmptyPlaceholder />;
  }

  const toolbarActions = (
    <>
      <Select
        value={chainFilter?.toString() ?? '-1'}
        onValueChange={(value) =>
          setChainFilter(
            !value || value === '-1' ? undefined : Number.parseInt(value, 10),
          )
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select chain">
            {(() => {
              const selectedValue = chainFilter?.toString() ?? '-1';
              if (selectedValue === '-1') {
                return 'All chains';
              }
              const chain = getChain(Number.parseInt(selectedValue, 10));
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
                <NetworkLogo network={CHAINS.sepolia.id} className="w-4 h-4" />
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
              <NetworkLogo network={CHAINS.mainnet.id} className="w-4 h-4" />
              {CHAINS.mainnet.name}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              className="min-w-[220px] justify-between text-start"
            />
          }
        >
          <span className="text-sm font-medium">Reason</span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            {reasonFilterSummary}
            <ChevronDown className="h-4 w-4 opacity-60" />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {reasonFilterOptions.map((option) => {
            const checked = reasonFilter.includes(option.value);
            return (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={checked}
                onCheckedChange={(nextChecked) => {
                  const next = nextChecked
                    ? [...reasonFilter, option.value]
                    : reasonFilter.filter((value) => value !== option.value);
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
    </>
  );

  return (
    <ExtensibleDataTable<
      PreviouslyOwnedDomainRow,
      IFilterStrategy<PreviouslyOwnedDomainRow>
    >
      columns={columns}
      data={sortedDomains}
      isLoading={false}
      page={1}
      pageSize={Math.max(sortedDomains.length, 1)}
      totalPages={1}
      totalCount={sortedDomains.length}
      onPageChange={noop}
      onPageSizeChange={noop}
      paginationVisibility="hidden"
      sorting={sorting}
      onSortingChange={setSorting}
      searchTerm={domainSearch}
      onSearchChange={setDomainSearch}
      searchPlaceholder="Filter domains..."
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
      onResetPreferences={resetToDefaults}
      toolbarActions={toolbarActions}
      renderMobileCard={renderMobileCard}
      emptyMessage="No results."
    />
  );
}

export function MyPreviouslyOwnedDomainsContent() {
  return <MyPreviouslyOwnedDomainsTable />;
}

export default function MyBurnedDomains() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!(isLoading || isAuthenticated)) {
    return <AuthRequired />;
  }

  return (
    <PageShell>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Previously Owned Domains</h2>
      </div>
      {isLoading ? <LoadingSkeletons /> : <MyPreviouslyOwnedDomainsContent />}
    </PageShell>
  );
}
