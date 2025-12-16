'use client';

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

import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import {
  convertToDrizzlerFilterOptions,
  useDrizzlerServerFilterStrategy,
} from '@/components/table/filters';
import { useAuth } from '@/hooks/use-auth';
import { useEmailPrompt } from '@/hooks/use-email-prompt';
import { useDomainRenewal } from '@/hooks/use-domain-renewal';
import { AddressWithChain } from '@/components/address-with-chain';
import { cn } from '@/lib/cn';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import { formatAmountInUSD } from '@/lib/number';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import {
  CHAINS,
  getNftExplorerUrl,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import type {
  ColumnDef,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import {
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  History,
  Link2,
  Tag,
  Loader2,
  SearchIcon,
  Settings,
  MoreVertical,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type FC,
  type HTMLAttributes,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ComponentProps,
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
} from '@/components/dialogs/email-required-dialog';
import { applyDrizzlerFilterOnDataset } from '@samyx/drizzler-filters-sorters/experimental';
import { useIsMobile } from '@/hooks/use-mobile';
import { groupBy } from 'ramda';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';

type DomainRow = AppRouterOutput['users']['getCurrentUserDomains'][number];

const DEFAULT_DOMAIN_LIST_PAGE_SIZE = 500;

// Helper function to format expiration date with severity colors
const formatExpirationDate = (
  expirationDate: string | Date | null | undefined,
) => {
  if (!expirationDate) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  const expiry = new Date(expirationDate);
  if (Number.isNaN(expiry.getTime())) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }
  const now = new Date();
  const isExpired = isPast(expiry);

  if (isExpired) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">
          {expiry.toLocaleDateString()}
        </span>
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">
            Expired
          </span>
        </div>
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
  } else if (monthsLeft < 3) {
    timeText = monthsLeft === 1 ? '1 month' : `${monthsLeft} months`;
    colorClass = 'text-yellow-500';
    IconComponent = AlertCircle;
  } else if (monthsLeft < 12) {
    timeText = monthsLeft === 1 ? '1 month' : `${monthsLeft} months`;
    colorClass = 'text-muted-foreground';
    IconComponent = null;
  } else {
    const hasExtraMonths = monthsLeft > yearsLeft * 12;
    const prefix = hasExtraMonths ? '> ' : '';
    timeText =
      yearsLeft === 1 ? `${prefix}1 year` : `${prefix}${yearsLeft} years`;
    colorClass = 'text-muted-foreground';
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
  asChild?: boolean;
  className?: string;
  variant?: ComponentProps<typeof Button>['variant'];
}> = ({
  domainName,
  expirationDate,
  onRenew,
  isProcessing,
  asChild,
  className,
  variant,
}) => {
  return (
    <AsyncButton
      variant={variant || 'outline'}
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
      asChild={asChild}
      className={className}
    >
      <>
        <History className="w-4 h-4 mr-1 scale-x-[-1]" />
        Renew
      </>
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

function MyDomainsTable(props: { title?: string; domains: DomainRow[] }) {
  const { title, domains } = props;

  const trpc = useTRPC();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const tableKind = useMemo<'active' | 'inactive'>(
    () => (title ? 'inactive' : 'active'),
    [title],
  );
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [listForSaleDialogDomain, setListForSaleDialogDomain] = useState<
    string | null
  >(null);
  const [selectedDomainIds, setSelectedDomainIds] = useState<
    Set<NamefiNormalizedDomain>
  >(() => new Set<NamefiNormalizedDomain>());
  const [processingDomains, setProcessingDomains] = useState<Set<string>>(
    () => new Set(),
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_DOMAIN_LIST_PAGE_SIZE);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'expirationDate', desc: false },
  ]);
  const [domainSearch, setDomainSearch] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    select: true,
    account: true,
    normalizedDomainName: true,
    expirationDate: true,
    renewPricing: true,
    urlForward: true,
    listForSale: true,
    actions: true,
  });

  const prevColumnVisibility = useRef<VisibilityState>(columnVisibility);
  const isMobile = useIsMobile();
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (isMobile) {
      prevColumnVisibility.current = columnVisibility;
      setColumnVisibility((prev) => ({
        select: true,
        account: false,
        normalizedDomainName: true,
        expirationDate: true,
        renewPricing: false,
        urlForward: false,
        listForSale: false,
        actions: true,
      }));
    } else {
      setColumnVisibility(prevColumnVisibility.current ?? columnVisibility);
    }
  }, [isMobile]);
  const { hasEmail } = useEmailPrompt();
  const router = useRouter();
  const canAnimate = useCanAnimate();
  const { renewDomains } = useDomainRenewal();

  const handleManageDnsClick = useCallback(
    (domainName: string, e: React.MouseEvent) => {
      // e.preventDefault();
      if (!hasEmail) {
        setShowEmailModal(true);
      } else {
        router.push(`/domains/${domainName}`);
      }
    },
    [hasEmail, router],
  );

  const handleUrlForwardClick = useCallback(
    (domainName: string) => {
      router.push(
        `/domains/${domainName}?tab=dns-management&section=forward-to`,
      );
    },
    [router],
  );

  const handleListForSaleClick = useCallback(
    (domainName: string) => {
      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.MyDomainsListForSaleClicked,
        properties: { domainName, tableKind },
      });
      setListForSaleDialogDomain(domainName);
    },
    [logEventWithInteractionLoggers, tableKind],
  );

  const handleRenewDomain = useCallback(
    async (domain: {
      normalizedDomainName: string;
      expirationDate?: Date | null;
    }) => {
      setProcessingDomains((prev) => {
        const next = new Set(prev);
        next.add(domain.normalizedDomainName);
        return next;
      });
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
          const next = new Set(prev);
          next.delete(domain.normalizedDomainName);
          return next;
        });
      }
    },
    [renewDomains],
  );

  const tldPricingQuery = useQuery(
    trpc.registry.getTldPricingTable.queryOptions(),
  );
  const renewalPriceUsdPerYearByTld = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const row of tldPricingQuery.data ?? []) {
      if (!row?.tld) continue;
      map.set(
        String(row.tld).toLowerCase(),
        row.renewalPriceUsdPerYear ?? null,
      );
    }
    return map;
  }, [tldPricingQuery.data]);

  const drizzlerFilterConfig = useMemo(
    () => ({
      normalizedDomainName: {
        id: 'normalizedDomainName',
        label: 'Domain Name',
        type: 'text' as const,
        columnId: 'normalizedDomainName',
      },
      ownerAddress: {
        id: 'ownerAddress',
        label: 'Wallet',
        type: 'text' as const,
        columnId: 'ownerAddress',
      },
      expirationDate: {
        id: 'expirationDate',
        label: 'Expires On',
        type: 'date' as const,
        columnId: 'expirationDate',
      },
      chainId: {
        id: 'chainId',
        label: 'Chain',
        type: 'select' as const,
        columnId: 'chainId',
        options: [
          { value: CHAINS.base.id, label: CHAINS.base.name },
          { value: CHAINS.mainnet.id, label: CHAINS.mainnet.name },
          { value: CHAINS.sepolia.id, label: CHAINS.sepolia.name },
        ],
      },
    }),
    [],
  );

  const filterStrategy = useDrizzlerServerFilterStrategy<DomainRow>({
    filterConfig: drizzlerFilterConfig as any,
    filterDisplayOptions: { showInHeader: false },
  });
  const filterState = filterStrategy.filterState;

  const drizzlerFilterOptions = useMemo(
    () =>
      convertToDrizzlerFilterOptions<DomainRow>(
        filterState?.columnFilters ?? {},
      ),
    [filterState],
  );

  useEffect(() => {
    setSelectedDomainIds((prev: Set<NamefiNormalizedDomain>) => {
      if (prev.size === 0) {
        return prev;
      }
      const allowedIds = new Set<NamefiNormalizedDomain>(
        domains.map(
          (domain) => domain.normalizedDomainName as NamefiNormalizedDomain,
        ),
      );
      let changed = false;
      const next = new Set<NamefiNormalizedDomain>();
      prev.forEach((id) => {
        if (allowedIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [domains]);

  const filteredDomains = useMemo(() => {
    if (!drizzlerFilterOptions) {
      return domains;
    }
    return applyDrizzlerFilterOnDataset(domains, drizzlerFilterOptions);
  }, [domains, drizzlerFilterOptions]);

  const filteredDomainsBySearch = useMemo(() => {
    const needle = domainSearch.trim().toLowerCase();
    if (!needle) {
      return filteredDomains;
    }
    return filteredDomains.filter((domain) =>
      (domain.normalizedDomainName ?? '').toLowerCase().includes(needle),
    );
  }, [filteredDomains, domainSearch]);

  const comparators = useMemo(
    () => ({
      chainId: (a: DomainRow, b: DomainRow) =>
        (a.chainId ?? 0) - (b.chainId ?? 0),
      ownerAddress: (a: DomainRow, b: DomainRow) =>
        (a.ownerAddress ?? '').localeCompare(b.ownerAddress ?? '', undefined, {
          sensitivity: 'base',
        }),
      normalizedDomainName: (a: DomainRow, b: DomainRow) =>
        (a.normalizedDomainName ?? '').localeCompare(
          b.normalizedDomainName ?? '',
          undefined,
          { sensitivity: 'base' },
        ),
      expirationDate: (a: DomainRow, b: DomainRow) => {
        const timeA = a.expirationDate
          ? new Date(a.expirationDate).getTime()
          : 0;
        const timeB = b.expirationDate
          ? new Date(b.expirationDate).getTime()
          : 0;
        return timeA - timeB;
      },
    }),
    [],
  );

  const sortedDomains = useMemo(() => {
    if (sorting.length === 0) {
      return filteredDomainsBySearch;
    }
    const next = [...filteredDomainsBySearch];
    return next.sort((a, b) => {
      for (const sort of sorting) {
        const compareFn = comparators[sort.id as keyof typeof comparators];
        if (!compareFn) {
          continue;
        }
        const result = compareFn(a, b);
        if (result !== 0) {
          return sort.desc ? -result : result;
        }
      }
      return 0;
    });
  }, [filteredDomainsBySearch, sorting, comparators]);

  const totalCount = sortedDomains.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    setPage((prev) => {
      if (prev > totalPages) {
        return totalPages;
      }
      if (prev < 1) {
        return 1;
      }
      return prev;
    });
  }, [totalPages]);

  useEffect(() => {
    if (!filterState) {
      return;
    }
    setPage(1);
  }, [filterState]);

  useEffect(() => {
    if (!domainSearch) {
      // Still reset to page 1 when clearing search, but avoid redundant sets.
      setPage(1);
      return;
    }
    setPage(1);
  }, [domainSearch]);

  const paginatedDomains = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedDomains.slice(start, start + pageSize);
  }, [sortedDomains, page, pageSize]);

  const currentPageIds = useMemo(
    () =>
      paginatedDomains.map(
        (domain) => domain.normalizedDomainName as NamefiNormalizedDomain,
      ),
    [paginatedDomains],
  );

  const pageSelectionState = useMemo(() => {
    if (currentPageIds.length === 0) {
      return { allSelected: false, someSelected: false };
    }
    let selectedCount = 0;
    currentPageIds.forEach((id) => {
      if (selectedDomainIds.has(id)) {
        selectedCount += 1;
      }
    });
    return {
      allSelected: selectedCount > 0 && selectedCount === currentPageIds.length,
      someSelected: selectedCount > 0 && selectedCount < currentPageIds.length,
    };
  }, [currentPageIds, selectedDomainIds]);

  const handleToggleAllCurrentPage = useCallback(
    (selectAll: boolean) => {
      setSelectedDomainIds((prev: Set<NamefiNormalizedDomain>) => {
        if (currentPageIds.length === 0) {
          return prev;
        }
        const next = new Set(prev);
        let changed = false;
        currentPageIds.forEach((id) => {
          if (selectAll) {
            if (!next.has(id)) {
              next.add(id);
              changed = true;
            }
          } else if (next.delete(id)) {
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    },
    [currentPageIds],
  );

  const handleRowSelectionChange = useCallback(
    (domainName: NamefiNormalizedDomain, checked: boolean) => {
      setSelectedDomainIds((prev: Set<NamefiNormalizedDomain>) => {
        const alreadySelected = prev.has(domainName);
        if ((checked && alreadySelected) || (!checked && !alreadySelected)) {
          return prev;
        }
        const next = new Set(prev);
        if (checked) {
          next.add(domainName);
        } else {
          next.delete(domainName);
        }
        return next;
      });
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedDomainIds((prev: Set<NamefiNormalizedDomain>) =>
      prev.size === 0 ? prev : new Set<NamefiNormalizedDomain>(),
    );
  }, []);

  const selectedDomainRows = useMemo(() => {
    if (selectedDomainIds.size === 0) {
      return [];
    }
    return domains.filter((domain) =>
      selectedDomainIds.has(
        domain.normalizedDomainName as NamefiNormalizedDomain,
      ),
    );
  }, [domains, selectedDomainIds]);

  const renewableDomains = useMemo(
    () =>
      selectedDomainRows.filter((domain) =>
        isDomainPossiblyRenewable(domain.expirationDate),
      ),
    [selectedDomainRows],
  );

  const renewableDomainsCount = renewableDomains.length;
  const selectedDomainCount = selectedDomainIds.size;
  const filteredTotalCount = filteredDomains.length;

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const columns: ColumnDef<DomainRow>[] = useMemo(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={
              pageSelectionState.allSelected
                ? true
                : pageSelectionState.someSelected
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={(value) =>
              handleToggleAllCurrentPage(value === true)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => {
          const domainName = row.getValue(
            'normalizedDomainName',
          ) as NamefiNormalizedDomain;
          const isSelected = selectedDomainIds.has(domainName);
          return (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(value) =>
                handleRowSelectionChange(domainName, value === true)
              }
              aria-label="Select row"
            />
          );
        },
        size: 50,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: 'account',
        header: 'Account',
        cell: ({ row }) => {
          const chainId = row.original.chainId ?? null;
          const ownerAddress = row.original.ownerAddress ?? null;
          return <AddressWithChain address={ownerAddress} chainId={chainId} />;
        },
        size: 200,
      },
      {
        accessorKey: 'normalizedDomainName',
        header: 'Domain Name',
        cell: ({ row }) => (
          <Link
            href={`/domains/${row.getValue('normalizedDomainName')}`}
            aria-label={`Settings for ${row.getValue('normalizedDomainName')}`}
            className="font-medium hover:underline"
          >
            {row.getValue('normalizedDomainName')}
          </Link>
        ),
      },
      {
        accessorKey: 'expirationDate',
        header: 'Expires On',
        cell: ({ row }) => {
          const expirationDate = row.getValue('expirationDate') as
            | Date
            | string
            | null
            | undefined;
          return formatExpirationDate(expirationDate);
        },
        size: 150,
      },
      {
        id: 'renewPricing',
        header: 'Renew (USD/yr)',
        cell: ({ row }) => {
          const domainName = row.original.normalizedDomainName ?? '';
          const expirationDateRaw = row.original.expirationDate;
          const expirationDate = expirationDateRaw
            ? new Date(expirationDateRaw)
            : null;
          const showRenewButton = isDomainPossiblyRenewable(expirationDate);

          const tld = domainName.split('.').pop()?.toLowerCase() ?? '';
          const renewalPriceUsdPerYear =
            tld === '' ? null : (renewalPriceUsdPerYearByTld.get(tld) ?? null);

          const priceLabel =
            renewalPriceUsdPerYear === null
              ? '—'
              : formatAmountInUSD(renewalPriceUsdPerYear);

          return (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">
                {priceLabel}
              </span>
              {showRenewButton ? (
                <AsyncButton
                  variant="outline"
                  size="icon"
                  aria-label={`Renew ${domainName}`}
                  isLoading={processingDomains.has(domainName)}
                  onClick={async () => {
                    await handleRenewDomain({
                      normalizedDomainName: domainName,
                      expirationDate: expirationDate,
                    });
                  }}
                >
                  <History className="w-4 h-4 scale-x-[-1]" />
                </AsyncButton>
              ) : null}
            </div>
          );
        },
        size: 180,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const domainName = row.getValue('normalizedDomainName') as string;
          const expirationDateRaw = row.getValue('expirationDate') as
            | Date
            | string
            | null
            | undefined;
          const expirationDate = expirationDateRaw
            ? new Date(expirationDateRaw)
            : null;
          const showRenewButton = isDomainPossiblyRenewable(expirationDate);
          const daysDifference = expirationDate
            ? differenceInDays(expirationDate, new Date())
            : Number.NEGATIVE_INFINITY;
          const showManageButton =
            expirationDate !== null ? daysDifference > -30 : false;
          const isExpired =
            expirationDate !== null ? daysDifference < 0 : false;
          const explorerUrl = getNftExplorerUrl(
            row.original.chainId ?? null,
            row.original.tokenId?.toString() ?? null,
          );

          const manageButton = showManageButton ? (
            <Button
              variant={isMobile ? 'ghost' : 'outline'}
              size="sm"
              className={
                isMobile
                  ? undefined
                  : 'w-9 px-0 gap-0 xl:w-auto xl:px-3 xl:gap-1.5'
              }
              onClick={(e) => handleManageDnsClick(domainName, e)}
              aria-label={`Settings for ${domainName}`}
            >
              {isExpired ? (
                <>
                  <History className="w-4 h-4 xl:mr-1" />
                  <span className="hidden xl:inline">Try to recover</span>
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 xl:mr-1" />
                  <span className="hidden xl:inline">Manage Domain</span>
                </>
              )}
            </Button>
          ) : null;

          const renewButton =
            showRenewButton && isMobile ? (
              <RenewButton
                domainName={domainName}
                expirationDate={expirationDate}
                onRenew={handleRenewDomain}
                isProcessing={processingDomains.has(domainName)}
                variant="ghost"
              />
            ) : null;

          const urlForwardButton = (
            <Button
              variant={isMobile ? 'ghost' : 'outline'}
              size="sm"
              className={
                isMobile
                  ? undefined
                  : 'w-9 px-0 gap-0 xl:w-auto xl:px-3 xl:gap-1.5'
              }
              onClick={() => handleUrlForwardClick(domainName)}
              aria-label={`Update URL Forward for ${domainName}`}
            >
              <Link2 className="w-4 h-4 xl:mr-1" />
              <span className="hidden xl:inline">URL Forward</span>
            </Button>
          );

          const listForSaleButton = (
            <Button
              variant={isMobile ? 'ghost' : 'outline'}
              size="sm"
              className={
                isMobile
                  ? undefined
                  : 'w-9 px-0 gap-0 xl:w-auto xl:px-3 xl:gap-1.5'
              }
              onClick={() => handleListForSaleClick(domainName)}
              aria-label={`List ${domainName} for sale`}
            >
              <Tag className="w-4 h-4 xl:mr-1" />
              <span className="hidden xl:inline">List</span>
            </Button>
          );

          const explorerButton =
            !isExpired && explorerUrl ? (
              <Button
                variant={isMobile ? 'ghost' : 'outline'}
                size="sm"
                className={
                  isMobile
                    ? undefined
                    : 'w-9 px-0 gap-0 xl:w-auto xl:px-3 xl:gap-1.5'
                }
                asChild={true}
              >
                <Link
                  href={explorerUrl}
                  aria-label={`View NFT for ${domainName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-start items-center"
                >
                  <ExternalLink className="w-4 h-4 xl:mr-1" />
                  <span className="hidden xl:inline">View NFT</span>
                </Link>
              </Button>
            ) : null;

          if (isMobile) {
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {!!manageButton && (
                    <DropdownMenuItem>{manageButton}</DropdownMenuItem>
                  )}
                  {!!renewButton && (
                    <DropdownMenuItem>{renewButton}</DropdownMenuItem>
                  )}
                  {!!urlForwardButton && (
                    <DropdownMenuItem>{urlForwardButton}</DropdownMenuItem>
                  )}
                  {!!listForSaleButton && (
                    <DropdownMenuItem>{listForSaleButton}</DropdownMenuItem>
                  )}
                  {!!explorerButton && (
                    <DropdownMenuItem>{explorerButton}</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <div className="flex gap-2">
              {manageButton}
              {renewButton}
              {urlForwardButton}
              {listForSaleButton}
              {explorerButton}
            </div>
          );
        },
        size: 280,
        enableSorting: false,
      },
    ],
    [
      handleManageDnsClick,
      handleUrlForwardClick,
      handleListForSaleClick,
      handleRenewDomain,
      handleRowSelectionChange,
      handleToggleAllCurrentPage,
      pageSelectionState,
      processingDomains,
      selectedDomainIds,
      isMobile,
      renewalPriceUsdPerYearByTld,
    ],
  );

  return (
    <>
      <EmailRequiredModal
        isOpen={showEmailModal}
        onOpenChange={setShowEmailModal}
        title={DNS_MANAGEMENT_EMAIL_REQUIRED.title}
        description={DNS_MANAGEMENT_EMAIL_REQUIRED.description}
        actionText={DNS_MANAGEMENT_EMAIL_REQUIRED.actionText}
      />
      <Dialog
        open={listForSaleDialogDomain !== null}
        onOpenChange={(open) => {
          if (!open) {
            setListForSaleDialogDomain(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Coming soon</DialogTitle>
            <DialogDescription>
              Listing domains for sale isn’t available yet.
              {listForSaleDialogDomain ? (
                <>
                  {' '}
                  You clicked:{' '}
                  <span className="font-medium">{listForSaleDialogDomain}</span>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setListForSaleDialogDomain(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {!!title && (
        <h2
          id={title.toLowerCase().replaceAll(' ', '-')}
          className="text-xl font-semibold mb-1"
        >
          {title}
        </h2>
      )}
      <Card>
        <CardContent>
          <ExtensibleDataTable<DomainRow, typeof filterStrategy>
            columns={columns}
            data={paginatedDomains}
            isLoading={false}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            sorting={sorting}
            onSortingChange={setSorting}
            searchTerm={domainSearch}
            onSearchChange={setDomainSearch}
            searchPlaceholder="Filter domains..."
            filterStrategy={filterStrategy}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            emptyMessage="No domains match your filters"
            loadingMessage="Loading domains..."
            paginationVisibility="auto"
            showPageSizeSelector={false}
          />
        </CardContent>
      </Card>

      {/* Floating Action Panel */}
      <AnimatePresence>
        {selectedDomainCount > 0 && (
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
                          value={selectedDomainCount}
                          className="text-primary font-bold text-sm"
                          style={
                            {
                              '--number-flow-char-height': '0.85em',
                              '--number-flow-mask-height': '0.3em',
                            } as React.CSSProperties
                          }
                        />
                      </div>
                      <span className="font-semibold text-foreground text-sm">
                        selected
                      </span>
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
                            if (renewableDomainsCount === 0) {
                              return;
                            }
                            const payload = renewableDomains.map((domain) => ({
                              normalizedDomainName:
                                domain.normalizedDomainName as NamefiNormalizedDomain,
                              expirationDate: domain.expirationDate ?? null,
                            }));
                            setProcessingDomains(
                              new Set(
                                payload.map(
                                  (domain) => domain.normalizedDomainName,
                                ),
                              ),
                            );
                            try {
                              await renewDomains(payload);
                              clearSelection();
                            } finally {
                              setProcessingDomains(new Set());
                            }
                          }}
                          className="h-10 px-4 gap-2 bg-primary hover:bg-primary/90"
                          disabled={renewableDomainsCount === 0}
                          customLoadingContent={
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {renewableDomainsCount === selectedDomainCount ? (
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
                          {renewableDomainsCount === selectedDomainCount ? (
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
                        onClick={clearSelection}
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
        <Button variant="outline" asChild={true}>
          <Link
            href="/domains/previously-owned"
            aria-label="View previously owned domains"
          >
            <History className="w-4 h-4 mr-1" />
            Previously Owned Domains
          </Link>
        </Button>
      </div>
      {isLoading ? (
        <LoadingSkeletons />
      ) : (
        <Suspense fallback={<LoadingSkeletons />}>
          <MyDomainsContent />
        </Suspense>
      )}
    </div>
  );
}

const MyDomainsContent = () => {
  const trpc = useTRPC();
  const { data: _domains } = useSuspenseQuery(
    trpc.users.getCurrentUserDomains.queryOptions(),
  );

  const { activeDomains, inactiveDomains } = useMemo(() => {
    const { activeDomains, expiredDomains, otherDomains } = groupBy(
      (domain) => {
        const expirationDate = domain.expirationDate
          ? new Date(domain.expirationDate)
          : null;
        const canBeRenewed = isDomainPossiblyRenewable(expirationDate);
        const isExpired =
          expirationDate !== null
            ? differenceInDays(expirationDate, new Date()) < 0
            : false;

        if (canBeRenewed && !isExpired) {
          return 'activeDomains';
        }
        if (!canBeRenewed && isExpired) {
          return 'expiredDomains';
        }
        return 'otherDomains';
      },
      _domains,
    );
    return {
      activeDomains: activeDomains ?? [],
      inactiveDomains: [...(expiredDomains ?? []), ...(otherDomains ?? [])],
    };
  }, [_domains]);

  if (activeDomains.length === 0 && inactiveDomains.length === 0) {
    return <MyDomainsEmptyPlaceholder />;
  }

  return (
    <div className="flex flex-col gap-6">
      <MyDomainsTable domains={activeDomains} />
      <MyDomainsTable title="Inactive Domains" domains={inactiveDomains} />
    </div>
  );
};

function isDomainPossiblyRenewable(expirationDate?: Date | string | null) {
  if (!expirationDate) {
    return false;
  }
  const expiry = new Date(expirationDate);
  if (Number.isNaN(expiry.getTime())) {
    return false;
  }
  return expiry > new Date();
}
