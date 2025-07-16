'use client';

import NetworkLogo from '@/components/network-logo';
import { TruncatedTextWithHover } from '@/components/truncated-text-with-hover';
import { AuthRequired } from '@/components/auth-required';
import { AsyncButton } from '@/components/buttons/async-button';
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
import { Checkbox } from '@/components/ui/shadcn/checkbox';
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
import { useEmailPrompt } from '@/hooks/use-email-prompt';
import { useDomainRenewal } from '@/hooks/use-domain-renewal';
import { config } from '@/lib/env';
import { cn } from '@/lib/utils';
import { type AppRouterOutput, useTRPC } from '@/utils/trpc';
import {
  NAMEFI_NFT_CONTRACT_ADDRESS,
  CHAINS,
  getChain,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  type ColumnDef,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ExternalLink,
  History,
  Loader2,
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
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  isPast,
} from 'date-fns';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import NumberFlow, { NumberFlowGroup, useCanAnimate } from '@number-flow/react';
import { Separator } from '@/components/ui/shadcn/separator';
import {
  EmailRequiredModal,
  DNS_MANAGEMENT_EMAIL_REQUIRED,
} from '@/components/modals/email-required-modal';

type DomainRow = AppRouterOutput['users']['getCurrentUserDomains'][number];

// Helper function to format expiration date with severity colors
const formatExpirationDate = (expirationDate: string | undefined) => {
  if (!expirationDate) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  const expiry = new Date(expirationDate);
  const now = new Date();
  const isExpired = isPast(expiry);

  if (isExpired) {
    return (
      <div className="flex items-center gap-1">
        <AlertTriangle className="w-3 h-3 text-destructive" />
        <span className="text-sm text-destructive font-medium">Expired</span>
      </div>
    );
  }

  const daysLeft = differenceInDays(expiry, now);
  const monthsLeft = differenceInMonths(expiry, now);
  const yearsLeft = differenceInYears(expiry, now);

  let timeText: string;
  let colorClass: string;
  let IconComponent: React.ComponentType<{ className?: string }> | null = null;

  if (daysLeft < 30) {
    timeText = daysLeft === 1 ? '1 day' : `${daysLeft} days`;
    colorClass = 'text-destructive';
    IconComponent = AlertTriangle;
  } else if (monthsLeft < 6) {
    timeText = monthsLeft === 1 ? '1 month' : `${monthsLeft} months`;
    colorClass = 'text-orange-500';
    IconComponent = AlertCircle;
  } else if (monthsLeft < 12) {
    timeText = monthsLeft === 1 ? '1 month' : `${monthsLeft} months`;
    colorClass = 'text-yellow-500';
    IconComponent = null;
  } else {
    const hasExtraMonths = monthsLeft > yearsLeft * 12;
    const prefix = hasExtraMonths ? '> ' : '';
    timeText =
      yearsLeft === 1 ? `${prefix}1 year` : `${prefix}${yearsLeft} years`;
    colorClass = 'text-green-600';
    IconComponent = null;
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-foreground">
        {expiry.toLocaleDateString()}
      </span>
      <div className="flex items-center gap-1">
        {IconComponent && <IconComponent className={`w-3 h-3 ${colorClass}`} />}
        <span className={`text-xs ${colorClass}`}>{timeText} left</span>
      </div>
    </div>
  );
};

// Wrapper component to maintain button state
const RenewButton: FC<{
  domainName: string;
  expirationDate: Date | null | undefined;
  onRenew: (domain: {
    normalizedDomainName: string;
    expirationDate?: Date | null;
  }) => Promise<unknown>;
  isProcessing: boolean;
}> = ({ domainName, expirationDate, onRenew, isProcessing }) => {
  return (
    <AsyncButton
      variant="outline"
      size="sm"
      onClick={async () => {
        await onRenew({
          normalizedDomainName: domainName,
          expirationDate: expirationDate,
        });
      }}
      isLoading={isProcessing}
      aria-label={`Renew ${domainName}`}
      customLoadingContent={
        <>
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          Renew
        </>
      }
    >
      <History className="w-4 h-4 mr-1 scale-x-[-1]" />
      Renew
    </AsyncButton>
  );
};

const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
    <Card>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
                <TableHead className="w-[80px]">Chain</TableHead>
                <TableHead className="w-[140px]">Wallet</TableHead>
                <TableHead>Domain Name</TableHead>
                <TableHead className="w-[150px]">Expires On</TableHead>
                <TableHead className="w-[280px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...new Array(6)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [processingDomains, setProcessingDomains] = useState<Set<string>>(
    new Set(),
  );
  const { hasEmail } = useEmailPrompt();
  const router = useRouter();
  const canAnimate = useCanAnimate();
  const { renewDomains } = useDomainRenewal();

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

  const isThirdPartyHostname = useCallback((domain: string) => {
    return config.POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES.some((hostname) =>
      domain.endsWith(hostname),
    );
  }, []);

  const canDomainBeRenewed = useCallback(
    (domain: string, expirationDate?: string | null) => {
      // Hide renew button for third-party hostnames
      if (isThirdPartyHostname(domain)) {
        return false;
      }

      // Hide renew button if domain has no expiry date
      if (!expirationDate) {
        return false;
      }

      // Hide renew button if domain is already expired
      const currentDate = new Date();
      const expiry = new Date(expirationDate);
      if (expiry <= currentDate) {
        return false;
      }

      return true;
    },
    [isThirdPartyHostname],
  );

  const handleRenewDomain = useCallback(
    async (domain: {
      normalizedDomainName: string;
      expirationDate?: Date | null;
    }) => {
      setProcessingDomains((prev) =>
        new Set(prev).add(domain.normalizedDomainName),
      );
      try {
        await renewDomains([
          {
            normalizedDomainName:
              domain.normalizedDomainName as NamefiNormalizedDomain,
            expirationDate: domain.expirationDate,
          },
        ]);
      } finally {
        setProcessingDomains((prev) => {
          const newSet = new Set(prev);
          newSet.delete(domain.normalizedDomainName);
          return newSet;
        });
      }
    },
    [renewDomains],
  );

  const columns: ColumnDef<DomainRow>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        size: 50,
        enableSorting: false,
        enableHiding: false,
      },
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
          return formatExpirationDate(expirationDate);
        },
        size: 150,
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
        cell: ({ row }) => {
          const domainName = row.getValue('normalizedDomainName') as string;
          const expirationDate = row.getValue('expirationDate') as
            | string
            | null;
          const showRenewButton = canDomainBeRenewed(
            domainName,
            expirationDate,
          );

          return (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleManageDnsClick(domainName, e)}
                aria-label={`Settings for ${domainName}`}
              >
                <Settings className="w-4 h-4 mr-1" /> Manage DNS
              </Button>
              {showRenewButton && (
                <RenewButton
                  domainName={domainName}
                  expirationDate={
                    expirationDate ? new Date(expirationDate) : null
                  }
                  onRenew={handleRenewDomain}
                  isProcessing={processingDomains.has(domainName)}
                />
              )}
              <Button variant="outline" size="sm" asChild={true}>
                <Link
                  href={`https://basescan.org/nft/${NAMEFI_NFT_CONTRACT_ADDRESS}/${row.original.tokenId ?? ''}`}
                  aria-label={`View NFT for ${domainName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-1" /> View NFT
                </Link>
              </Button>
            </div>
          );
        },
        size: 280,
        enableSorting: false,
      },
    ],
    [
      handleManageDnsClick,
      handleRenewDomain,
      processingDomains,
      canDomainBeRenewed,
    ],
  );

  const table = useReactTable({
    data: domains,
    columns,
    getRowId: (row) => row.normalizedDomainName,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: 'onChange',
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  // Calculate renewable domains count for floating action panel
  const renewableDomainsCount = useMemo(() => {
    if (Object.keys(rowSelection).length === 0) return 0;
    const selectedRows = table.getSelectedRowModel().rows;
    return selectedRows.filter((row) => {
      const expirationDateStr =
        typeof row.original.expirationDate === 'string'
          ? row.original.expirationDate
          : row.original.expirationDate?.toISOString() || null;
      return canDomainBeRenewed(
        row.original.normalizedDomainName,
        expirationDateStr,
      );
    }).length;
  }, [rowSelection, table, canDomainBeRenewed]);

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

      {/* Floating Action Panel */}
      <AnimatePresence>
        {Object.keys(rowSelection).length > 0 && (
          <motion.div
            initial={{ y: 100, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 100, scale: 0.95 }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 300,
              duration: 0.4,
            }}
            layout
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="backdrop-blur-2xl bg-background/30 border border-border/50 rounded-2xl shadow-2xl shadow-black/20"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              }}
            >
              <div className="px-6 py-4">
                <MotionConfig
                  transition={{
                    layout: canAnimate
                      ? { duration: 0.9, bounce: 0, type: 'spring' }
                      : { duration: 0 },
                  }}
                >
                  <div className="flex items-center gap-6">
                    {/* Selection Count */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center">
                        <NumberFlow
                          value={Object.keys(rowSelection).length}
                          className="text-primary font-bold text-sm"
                          style={
                            {
                              '--number-flow-char-height': '0.85em',
                              '--number-flow-mask-height': '0.3em',
                            } as React.CSSProperties
                          }
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-foreground text-sm">
                            {Object.keys(rowSelection).length === 1
                              ? 'Domain'
                              : 'Domains'}
                          </span>
                          <span className="font-medium text-muted-foreground text-sm">
                            selected
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <NumberFlow
                            value={domains.length}
                            className="text-xs text-muted-foreground font-medium"
                            style={
                              {
                                '--number-flow-char-height': '0.85em',
                                '--number-flow-mask-height': '0.3em',
                              } as React.CSSProperties
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            total
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator
                      orientation="vertical"
                      className="h-8! bg-foreground/30"
                    />

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <NumberFlowGroup>
                        <AsyncButton
                          onClick={async () => {
                            const allSelectedDomains = table
                              .getSelectedRowModel()
                              .rows.map((row) => ({
                                normalizedDomainName:
                                  row.original.normalizedDomainName,
                                expirationDate: row.original.expirationDate,
                              }));

                            // Filter to only include domains that can be renewed
                            const renewableDomains = allSelectedDomains.filter(
                              (domain) => {
                                const expirationDateStr =
                                  typeof domain.expirationDate === 'string'
                                    ? domain.expirationDate
                                    : domain.expirationDate?.toISOString() ||
                                      null;
                                return canDomainBeRenewed(
                                  domain.normalizedDomainName,
                                  expirationDateStr,
                                );
                              },
                            );

                            if (renewableDomains.length === 0) {
                              return; // No domains can be renewed
                            }

                            // Mark all renewable domains as processing
                            const renewableDomainNames = renewableDomains.map(
                              (d) => d.normalizedDomainName,
                            );
                            setProcessingDomains(new Set(renewableDomainNames));

                            try {
                              await renewDomains(renewableDomains);
                              setRowSelection({});
                            } finally {
                              // Clear processing state for all domains
                              setProcessingDomains(new Set());
                            }
                          }}
                          className="h-10 px-4 gap-2 bg-primary hover:bg-primary/90"
                          disabled={renewableDomainsCount === 0}
                          customLoadingContent={
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {renewableDomainsCount ===
                              Object.keys(rowSelection).length ? (
                                'Renew All'
                              ) : (
                                <NumberFlow
                                  value={renewableDomainsCount}
                                  style={
                                    {
                                      '--number-flow-char-height': '0.85em',
                                      '--number-flow-mask-height': '0.3em',
                                    } as React.CSSProperties
                                  }
                                  prefix="Renew "
                                />
                              )}
                            </>
                          }
                        >
                          <History className="w-4 h-4 scale-x-[-1]" />
                          {renewableDomainsCount ===
                          Object.keys(rowSelection).length ? (
                            'Renew All'
                          ) : (
                            <NumberFlow
                              value={renewableDomainsCount}
                              style={
                                {
                                  '--number-flow-char-height': '0.85em',
                                  '--number-flow-mask-height': '0.3em',
                                } as React.CSSProperties
                              }
                              prefix="Renew "
                            />
                          )}
                        </AsyncButton>
                      </NumberFlowGroup>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRowSelection({})}
                        className="h-10 px-3 text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </MotionConfig>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
