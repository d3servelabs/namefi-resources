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
import { Badge } from '@/components/ui/shadcn/badge';
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
  SendIcon,
  ShareIcon,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Clock3,
  Copy,
  ExternalLink,
  Flame,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import {
  type FC,
  type HTMLAttributes,
  Suspense,
  useCallback,
  useMemo,
} from 'react';
import { config } from '@/lib/env';
import { cn } from '@/lib/cn';
import { range } from 'ramda';
import { UserWalletAvatar } from '@/components/user-avatar';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { toast } from 'sonner';
import type { FeatureFlagDefinition } from '@/types/feature-flags';
import { useRegisterAdminFlags } from './admin/feature-flags/register';
import { useAdminFeatureFlag } from './admin/feature-flags/use-flag';

type PreviouslyOwnedDomainRow =
  AppRouterOutput['users']['getCurrentUserBurnedDomains'][number];
type RemovalType = PreviouslyOwnedDomainRow['removalType'];

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
                <TableHead className="w-[220px]">Reason</TableHead>
                <TableHead className="w-[220px]">Receiving Wallet</TableHead>
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

const WalletBadge: FC<{ address: string }> = ({ address }) => {
  const formattedAddress = formatWalletAddress(address);

  const handleCopyWallet = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formattedAddress);
      toast.success('Copied address successfully');
    } catch {
      toast.error('Failed to copy address');
    }
  }, [formattedAddress]);

  return (
    <div className="flex items-center gap-2 px-1 py-1 bg-muted rounded-xl max-w-full">
      <UserWalletAvatar address={formattedAddress} className="size-6" />
      <div className="flex-1 min-w-0">
        <AutoTruncateTextV2
          initialCharactersCountToDisplay={16}
          minCharactersToDisplay={16}
          className="font-mono text-xs"
        >
          {formattedAddress}
        </AutoTruncateTextV2>
      </div>
      <button
        type="button"
        onClick={handleCopyWallet}
        className="p-1 hover:bg-background rounded transition-colors flex-shrink-0"
        title="Copy address"
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
};

const removalReasonMeta: Record<
  RemovalType,
  {
    label: string;
    badgeClassName: string;
    Icon: typeof Clock3;
  }
> = {
  domain_expired: {
    label: 'Domain Expired',
    badgeClassName:
      'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100',
    Icon: Clock3,
  },
  transferred_to_another_wallet: {
    label: 'Transferred To Another Wallet',
    badgeClassName:
      'bg-purple-100 text-purple-900 border-purple-200 hover:bg-purple-100',
    Icon: SendIcon,
  },
  domain_exported: {
    label: 'Domain Exported',
    badgeClassName: 'bg-sky-100 text-sky-900 border-sky-200 hover:bg-sky-100',
    Icon: ShareIcon,
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

const ICON_BADGE_FEATURE_FLAG: FeatureFlagDefinition = {
  key: 'icon_badge',
  label: 'Hide icon badge in the reason column',
  scope: 'global',
  defaultValue: false,
};
function MyPreviouslyOwnedDomainsTable() {
  useRegisterAdminFlags([ICON_BADGE_FEATURE_FLAG]);
  const [hideIconBadgeInReasonColumn] = useAdminFeatureFlag(
    ICON_BADGE_FEATURE_FLAG,
  );
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
        accessorKey: 'removedAt',
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
          const meta = removalReasonMeta[row.original.removalType];
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

          if (!meta) {
            return (
              <span className="text-sm text-muted-foreground">{label}</span>
            );
          }

          const Icon = meta.Icon;

          return (
            <div className="flex flex-col gap-1">
              <Badge
                variant="secondary"
                className={cn(
                  'gap-1 justify-start w-fit px-3 py-1 text-xs font-medium',
                  meta.badgeClassName,
                )}
              >
                {!hideIconBadgeInReasonColumn ? (
                  <Icon className="h-3.5 w-3.5" />
                ) : null}
                <span>{label}</span>
              </Badge>
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
          return <WalletBadge address={row.original.toAddress} />;
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
    [hideIconBadgeInReasonColumn],
  );

  const table = useReactTable({
    data: domains,
    columns,
    getRowId: (row) => row.eventId,
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
