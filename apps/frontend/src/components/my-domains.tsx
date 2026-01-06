'use client';

import { AuthRequired } from '@/components/auth-required';
import { AsyncButton } from '@/components/buttons/async-button';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { PageShell } from '@/components/page-shell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { Button } from '@/components/ui/shadcn/button';
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
  Loader2,
  SearchIcon,
  MoreVertical,
} from 'lucide-react';
import Link from 'next/link';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import {
  EmailRequiredModal,
  DNS_MANAGEMENT_EMAIL_REQUIRED,
} from '@/components/dialogs/email-required-dialog';
import { applyDrizzlerFilterOnDataset } from '@samyx/drizzler-filters-sorters/experimental';
import { useIsMobile } from '@/hooks/use-mobile';
import { groupBy } from 'ramda';
import { MyPreviouslyOwnedDomainsContent } from '@/components/my-previously-owned-domains';
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
import { DnsStatusCell } from '@/components/domain-and-dns-managment/cells/dns-status-cell';
import { BatchDnsDialog } from '@/components/domain-and-dns-managment/dialogs/batch-dns-dialog';
import {
  CalendarPlus,
  BadgeDollarSign,
  Compass,
  Server,
  Globe,
  Mail,
  Hexagon,
  Link as LinkIcon,
  X,
} from 'lucide-react';

type DomainRow = AppRouterOutput['users']['getCurrentUserDomains'][number];

const DEFAULT_DOMAIN_LIST_PAGE_SIZE = 500;

function getRenewalPriceUsdPerYearForDomain(
  normalizedDomainName: string | null | undefined,
  renewalPriceUsdPerYearByTld: Map<string, number | null>,
) {
  const domainName = normalizedDomainName ?? '';
  const tld = domainName.split('.').pop()?.toLowerCase() ?? '';
  return tld === '' ? null : (renewalPriceUsdPerYearByTld.get(tld) ?? null);
}

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
  size?: ComponentProps<typeof Button>['size'];
}> = ({
  domainName,
  expirationDate,
  onRenew,
  isProcessing,
  asChild,
  className,
  variant,
  size = 'sm',
}) => {
  return (
    <AsyncButton
      variant={variant || 'outline'}
      size={size}
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
          <Loader2 className="w-4 h-4 xl:mr-1 animate-spin" />
          <span className="hidden xl:inline">Renew</span>
        </>
      }
      asChild={asChild}
      className={className}
    >
      <>
        <CalendarPlus className="w-4 h-4 xl:mr-1" />
        <span className="hidden xl:inline">Renew</span>
      </>
    </AsyncButton>
  );
};

const RenewPricePremiumInfo: FC<{ domainName: string }> = ({ domainName }) => {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild={true}>
        <button
          type="button"
          aria-label={`Renewal price info for ${domainName}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          className="inline-flex size-4 items-center justify-center rounded-full border border-muted-foreground/40 text-[10px] font-semibold leading-none text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          !
        </button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>
        Premium domains may have a different renewal price.
      </TooltipContent>
    </Tooltip>
  );
};

const ActionTooltip: FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild={true}>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  );
};

const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
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

function MyDomainsTable(props: {
  title?: string;
  domains: DomainRow[];
  kind: 'active' | 'inactive';
}) {
  const { title, domains, kind } = props;

  const trpc = useTRPC();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const tableKind = kind;
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
  const [batchAction, setBatchAction] = useState<
    'ns' | 'web' | 'mx' | 'ens' | 'forward' | null
  >(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_DOMAIN_LIST_PAGE_SIZE);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'expirationDate', desc: false },
  ]);
  const [domainSearch, setDomainSearch] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    select: true,
    account: false,
    normalizedDomainName: true,
    expirationDate: true,
    renewPricing: false,
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
      setColumnVisibility((_prev) => ({
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
  const canAnimate = useCanAnimate();
  const { renewDomains } = useDomainRenewal();

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

  /**
   * Returns a custom fixed renewal price for specific TLDs.
   *
   * TLDs: .0x.city, .defi.build, .astra.namefi.io
   * Price: $5.00
   * Rationale: Promotional pricing for these specific partner domains.
   * Reference: See product requirement for Fixed Rate Partner Domains.
   *
   * TODO: https://app.clickup.com/t/9009140026/NFI-5260 Prompt for LLM: a deeper search in
   * entire codebase, especially backend and database to find whether there is a database
   * that returns the pricing of 0x.city  when user visits 0x.city to register a domain,
   * then see if you need to update getCustomRenewalPrice a instead of locally hardcoded price
   */
  const getCustomRenewalPrice = useCallback((domainName: string) => {
    if (
      domainName.endsWith('.0x.city') ||
      domainName.endsWith('.defi.build') ||
      domainName.endsWith('.astra.namefi.io')
    ) {
      return 5.0;
    }
    return null;
  }, []);

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
        if (sort.id === 'renewPricing') {
          const priceA = getRenewalPriceUsdPerYearForDomain(
            a.normalizedDomainName,
            renewalPriceUsdPerYearByTld,
          );
          const priceB = getRenewalPriceUsdPerYearForDomain(
            b.normalizedDomainName,
            renewalPriceUsdPerYearByTld,
          );
          if (priceA === null && priceB === null) {
            continue;
          }
          // Keep unknown prices ("—") sorted last in both directions.
          if (priceA === null) return 1;
          if (priceB === null) return -1;
          const result = priceA - priceB;
          if (result !== 0) {
            return sort.desc ? -result : result;
          }
          continue;
        }
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
  }, [
    filteredDomainsBySearch,
    sorting,
    comparators,
    renewalPriceUsdPerYearByTld,
  ]);

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
        accessorKey: 'normalizedDomainName',
        header: 'Domain Name',
        cell: ({ row }) => (
          <Link
            href={`/domains/${row.getValue('normalizedDomainName')}?tab=dns-overview`}
            aria-label={`Settings for ${row.getValue('normalizedDomainName')}`}
            className="font-medium hover:underline"
          >
            {row.getValue('normalizedDomainName')}
          </Link>
        ),
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
        id: 'dnsStatus',
        header: 'DNS Records',
        cell: ({ row }) => {
          const domainName = row.getValue(
            'normalizedDomainName',
          ) as NamefiNormalizedDomain;
          const status = row.original.dnsStatus;

          if (!status) return <span className="text-muted-foreground">-</span>;

          return <DnsStatusCell domainName={domainName} status={status} />;
        },
        size: 200,
      },
      {
        id: 'renewPricing',
        header: 'Renew (USD/yr)',
        accessorFn: (row) => {
          const customPrice = getCustomRenewalPrice(
            row.normalizedDomainName ?? '',
          );
          if (customPrice !== null) return customPrice;
          return getRenewalPriceUsdPerYearForDomain(
            row.normalizedDomainName,
            renewalPriceUsdPerYearByTld,
          );
        },
        cell: ({ row }) => {
          const domainName = row.original.normalizedDomainName ?? '';
          const customPrice = getCustomRenewalPrice(domainName);
          let renewalPriceUsdPerYear = row.getValue('renewPricing') as
            | number
            | null;

          if (customPrice !== null) {
            renewalPriceUsdPerYear = customPrice;
          }

          const priceLabel =
            renewalPriceUsdPerYear === null
              ? '—'
              : formatAmountInUSD(renewalPriceUsdPerYear);

          const expirationDateRaw = row.getValue('expirationDate') as
            | Date
            | string
            | null
            | undefined;
          const expirationDate = expirationDateRaw
            ? new Date(expirationDateRaw)
            : null;
          const showRenewButton = isDomainPossiblyRenewable(expirationDate);

          return (
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {priceLabel}
                </span>
                <RenewPricePremiumInfo domainName={domainName} />
              </div>
              {showRenewButton && (
                <RenewButton
                  domainName={domainName}
                  expirationDate={expirationDate}
                  onRenew={handleRenewDomain}
                  isProcessing={processingDomains.has(domainName)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-muted"
                />
              )}
            </div>
          );
        },
        size: 180,
        enableSorting: true,
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
          const isExpired =
            expirationDate !== null
              ? differenceInDays(expirationDate, new Date()) < 0
              : false;
          const explorerUrl = getNftExplorerUrl(
            row.original.chainId ?? null,
            row.original.tokenId?.toString() ?? null,
          );

          const actionButtonBaseClassName =
            'w-9 px-0 gap-0 xl:w-auto xl:px-3 xl:gap-1.5 !text-white border-0 bg-transparent shadow-none hover:bg-muted/30 xl:border xl:bg-background xl:shadow-xs';

          const listForSaleButton = (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                actionButtonBaseClassName,
                'hover:!text-orange-400',
              )}
              onClick={() => handleListForSaleClick(domainName)}
              aria-label={`List ${domainName} for sale`}
            >
              <BadgeDollarSign className="w-4 h-4" />
            </Button>
          );

          const explorerButton =
            !isExpired && explorerUrl ? (
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  actionButtonBaseClassName,
                  'hover:!text-blue-400',
                )}
                asChild={true}
              >
                <Link
                  href={explorerUrl}
                  aria-label={`View NFT for ${domainName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-start items-center"
                >
                  <Compass className="w-4 h-4" />
                </Link>
              </Button>
            ) : null;

          if (isMobile) {
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="!text-white border-0 bg-transparent shadow-none hover:bg-muted/30"
                    aria-label={`Actions for ${domainName}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {/* Renew button logic can be added here if needed for mobile, but it's in the column now */}
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
              <ActionTooltip label="List for sale">
                {listForSaleButton}
              </ActionTooltip>
              {explorerButton ? (
                <ActionTooltip label="View NFT">{explorerButton}</ActionTooltip>
              ) : null}
            </div>
          );
        },
        size: 280,
        enableSorting: false,
      },
    ],
    [
      handleListForSaleClick,
      handleRenewDomain,
      handleRowSelectionChange,
      handleToggleAllCurrentPage,
      pageSelectionState,
      processingDomains,
      selectedDomainIds,
      isMobile,
      renewalPriceUsdPerYearByTld,
      getCustomRenewalPrice,
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearSelection}
                        className="h-6 w-6 rounded-full hover:bg-muted"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <Separator
                      orientation="vertical"
                      className="h-8! bg-foreground/30"
                    />

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {/* Renew All */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AsyncButton
                            onClick={async () => {
                              if (renewableDomainsCount === 0) {
                                return;
                              }
                              const payload = renewableDomains.map(
                                (domain) => ({
                                  normalizedDomainName:
                                    domain.normalizedDomainName as NamefiNormalizedDomain,
                                  expirationDate: domain.expirationDate ?? null,
                                }),
                              );
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
                            className="h-8 w-8 px-0 bg-transparent hover:bg-muted border-0 shadow-none text-foreground"
                            disabled={renewableDomainsCount === 0}
                            customLoadingContent={
                              <Loader2 className="w-4 h-4 animate-spin" />
                            }
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </AsyncButton>
                        </TooltipTrigger>
                        <TooltipContent>
                          Renew {renewableDomainsCount} domain
                          {renewableDomainsCount !== 1 ? 's' : ''}
                        </TooltipContent>
                      </Tooltip>

                      <Separator
                        orientation="vertical"
                        className="h-4 bg-border mx-1"
                      />

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setBatchAction('web')}
                            className="h-8 w-8"
                          >
                            <Globe className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Set Web Records</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setBatchAction('forward')}
                            className="h-8 w-8"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Set URL Forwarding</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setBatchAction('ens')}
                            className="h-8 w-8"
                          >
                            <Hexagon className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Set ENS Record</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </MotionConfig>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <BatchDnsDialog
        isOpen={batchAction !== null}
        onOpenChange={(open) => !open && setBatchAction(null)}
        domains={Array.from(selectedDomainIds)}
        action={batchAction}
      />
    </>
  );
}

export default function MyDomains() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!(isLoading || isAuthenticated)) {
    return <AuthRequired />;
  }

  return (
    <PageShell>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Domains</h2>
      </div>
      {isLoading ? (
        <LoadingSkeletons />
      ) : (
        <Suspense fallback={<LoadingSkeletons />}>
          <MyDomainsContent />
        </Suspense>
      )}
    </PageShell>
  );
}

const MyDomainsContent = () => {
  const trpc = useTRPC();
  const { data: _domains } = useSuspenseQuery(
    trpc.users.getCurrentUserDomains.queryOptions(),
  );

  const { data: orderItems } = useQuery(
    trpc.orders.getOrderItems.queryOptions(),
  );

  const processingOrderItems = useMemo(() => {
    if (!orderItems) return [];
    return orderItems.filter((item) =>
      ['CREATED', 'PROCESSING'].includes(item.status ?? ''),
    );
  }, [orderItems]);

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

  if (
    activeDomains.length === 0 &&
    inactiveDomains.length === 0 &&
    processingOrderItems.length === 0
  ) {
    return <MyDomainsEmptyPlaceholder />;
  }

  return (
    <div className="space-y-4">
      {processingOrderItems.length > 0 && (
        <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            ⏳{' '}
            {processingOrderItems
              .map((item) => item.normalizedDomainName)
              .join(', ')}
          </span>{' '}
          are being processed. Visit{' '}
          <Link href="/orders" className="text-primary hover:underline">
            Orders
          </Link>{' '}
          to see their status.
        </div>
      )}

      <Tabs defaultValue="active">
        <TabsList className="w-fit">
          <TabsTrigger value="active">My Domains</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Domains</TabsTrigger>
          <TabsTrigger value="previously-owned">
            Previously Owned Domains
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeDomains.length === 0 ? (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Title>No active domains</EmptyPlaceholder.Title>
            </EmptyPlaceholder>
          ) : (
            <MyDomainsTable kind="active" domains={activeDomains} />
          )}
        </TabsContent>

        <TabsContent value="inactive" className="mt-4">
          {inactiveDomains.length === 0 ? (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Title>
                No inactive domains
              </EmptyPlaceholder.Title>
            </EmptyPlaceholder>
          ) : (
            <MyDomainsTable kind="inactive" domains={inactiveDomains} />
          )}
        </TabsContent>

        <TabsContent value="previously-owned" className="mt-4">
          <MyPreviouslyOwnedDomainsContent />
        </TabsContent>
      </Tabs>
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
