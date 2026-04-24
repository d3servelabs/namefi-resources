'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef, VisibilityState } from '@tanstack/react-table';
import { differenceInDays, isPast } from 'date-fns';
import { toast } from 'sonner';
import {
  BadgeDollarSign,
  Compass,
  ExternalLink,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';
import { applyDrizzlerFilterOnDataset } from '@samyx/drizzler-filters-sorters/experimental';
import { CHAINS } from '@namefi-astra/utils/chains';
import { getNftExplorerUrl } from '@namefi-astra/utils/nft-hash';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { AddressWithChain } from '@/components/address-with-chain';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import {
  convertToDrizzlerFilterOptions,
  useDrizzlerServerFilterStrategy,
} from '@/components/table/filters';
import {
  DNS_MANAGEMENT_EMAIL_REQUIRED,
  EmailRequiredModal,
} from '@/components/dialogs/email-required-dialog';
import { DnsStatusCell } from '@/components/domain-and-dns-managment/cells/dns-status-cell';
import { BatchDnsDialog } from '@/components/domain-and-dns-managment/dialogs/batch-dns-dialog';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { useEmailPrompt } from '@/hooks/use-email-prompt';
import {
  type RenewalResult,
  useDomainRenewal,
} from '@/hooks/use-domain-renewal';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { useTRPC } from '@/lib/trpc';
import { formatAmountInUSD } from '@/lib/number';
import { ActionTooltip } from './action-tooltip';
import { AutoRenewToggle } from './auto-renew-toggle';
import { triggerCelebrationAtPosition } from './confetti-celebration';
import { RenewNowModal } from './renew-now-modal';
import { RenewPricePremiumInfo } from './renew-price-premium-info';
import type { BulkAutoRenewState, DomainRow } from './types';
import { useDomainPreferencesMutation } from './use-domain-preferences-mutation';
import {
  DEFAULT_DOMAIN_LIST_PAGE_SIZE,
  formatExpirationDateISO,
  formatTimeLeft,
  getCustomRenewalPrice,
  getRenewalPriceUsdPerYearForDomain,
  isDomainPossiblyRenewable,
  safeToUnicode,
  truncateWalletAddress,
} from './utils';

// Lazy-load the floating action panel to keep motion/react and @number-flow/react
// out of the initial /domains client bundle.
const FloatingActionPanel = dynamic(() => import('./floating-action-panel'), {
  ssr: false,
});

export function MyDomainsTable(props: {
  title?: string;
  domains: DomainRow[];
  kind: 'active' | 'inactive';
}) {
  const { title, domains, kind } = props;

  const trpc = useTRPC();
  const preferencesMutation = useDomainPreferencesMutation();
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

  // State for renewal modal
  const [renewNowModalDomains, setRenewNowModalDomains] = useState<
    Array<{
      normalizedDomainName: string;
      expirationDate: Date | string | null | undefined;
    }>
  >([]);

  // Per-domain pending spinners; the actual auto-renew/auto-ens values live in
  // the tRPC query cache and are patched optimistically by
  // useDomainPreferencesMutation.
  const [togglingAutoRenew, setTogglingAutoRenew] = useState<Set<string>>(
    () => new Set(),
  );
  const [togglingAutoEns, setTogglingAutoEns] = useState<Set<string>>(
    () => new Set(),
  );
  const [page, setPage] = useState(1);
  const [domainSearch, setDomainSearch] = useState('');

  const defaultColumnVisibility: VisibilityState = {
    select: true,
    account: false,
    normalizedDomainName: true,
    expirationDate: true,
    dateTokenized: false,
    renewPricing: false,
    urlForward: true,
    listForSale: true,
    actions: true,
  };

  const {
    preferences,
    setColumnVisibility,
    setSorting,
    setPageSize,
    resetToDefaults,
    isLoaded,
  } = useTablePreferences({
    tableId: `my-domains-${kind}`,
    defaultPreferences: {
      columnVisibility: defaultColumnVisibility,
      sorting: [{ id: 'expirationDate', desc: false }],
      pageSize: DEFAULT_DOMAIN_LIST_PAGE_SIZE,
    },
  });

  const {
    columnVisibility: persistedColumnVisibility,
    sorting,
    pageSize,
  } = preferences;

  const isMobile = useIsMobile();

  const mobileColumnVisibility: VisibilityState = useMemo(
    () => ({
      select: true,
      account: false,
      normalizedDomainName: true,
      expirationDate: true,
      dateTokenized: false,
      renewPricing: false,
      urlForward: false,
      listForSale: false,
      actions: true,
    }),
    [],
  );

  const columnVisibility = isMobile
    ? mobileColumnVisibility
    : persistedColumnVisibility;

  const { hasEmail } = useEmailPrompt();
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

  // Handle auto-renewal toggle for a single domain. Optimistic update + rollback
  // are handled by useDomainPreferencesMutation; this handler only tracks the
  // per-domain spinner and surfaces toasts + celebration.
  const handleToggleAutoRenew = useCallback(
    async (
      domainName: string,
      enabled: boolean,
      position: { x: number; y: number } | null,
    ) => {
      setTogglingAutoRenew((prev) => {
        const next = new Set(prev);
        next.add(domainName);
        return next;
      });
      try {
        await preferencesMutation.mutateAsync({
          domainName: domainName as NamefiNormalizedDomain,
          domainPreferencesAndConfig: { autoRenewEnabled: enabled },
        });
        toast.success(
          `Auto-renew ${enabled ? 'enabled' : 'disabled'} for ${domainName}`,
        );
        if (enabled && position) {
          triggerCelebrationAtPosition(position.x, position.y);
        }
      } catch {
        toast.error(`Failed to update auto-renew for ${domainName}`);
      } finally {
        setTogglingAutoRenew((prev) => {
          const next = new Set(prev);
          next.delete(domainName);
          return next;
        });
      }
    },
    [preferencesMutation],
  );

  const handleToggleAutoEns = useCallback(
    async (domainName: string, enabled: boolean) => {
      setTogglingAutoEns((prev) => {
        const next = new Set(prev);
        next.add(domainName);
        return next;
      });
      try {
        await preferencesMutation.mutateAsync({
          domainName: domainName as NamefiNormalizedDomain,
          domainPreferencesAndConfig: { autoEnsEnabled: enabled },
        });
        toast.success(
          `AutoENS ${enabled ? 'enabled' : 'disabled'} for ${domainName}`,
        );
      } catch {
        toast.error(`Failed to update AutoENS for ${domainName}`);
      } finally {
        setTogglingAutoEns((prev) => {
          const next = new Set(prev);
          next.delete(domainName);
          return next;
        });
      }
    },
    [preferencesMutation],
  );

  // Batch toggle: fires the mutation per domain with a concurrency limit. Each
  // mutation is independently optimistic — succeeded rows stay flipped while
  // failed rows are rolled back by the hook's onError.
  const handleBatchToggleAutoRenew = useCallback(
    async (enabled: boolean, position?: { x: number; y: number } | null) => {
      const domainsToUpdate = Array.from(selectedDomainIds);
      if (domainsToUpdate.length === 0) return;

      setTogglingAutoRenew((prev) => {
        const next = new Set(prev);
        for (const d of domainsToUpdate) next.add(d);
        return next;
      });

      const ConcurrencyLimit = 8;
      const results: PromiseSettledResult<unknown>[] = [];
      for (let i = 0; i < domainsToUpdate.length; i += ConcurrencyLimit) {
        const chunk = domainsToUpdate.slice(i, i + ConcurrencyLimit);
        const chunkResults = await Promise.allSettled(
          chunk.map((domainName) =>
            preferencesMutation.mutateAsync({
              domainName: domainName as NamefiNormalizedDomain,
              domainPreferencesAndConfig: { autoRenewEnabled: enabled },
            }),
          ),
        );
        results.push(...chunkResults);
      }

      const succeeded: string[] = [];
      const failed: string[] = [];
      results.forEach((result, index) => {
        const domainName = domainsToUpdate[index];
        if (result.status === 'fulfilled') succeeded.push(domainName);
        else failed.push(domainName);
      });

      if (failed.length > 0) {
        toast.error(
          `Failed to update ${failed.length} of ${domainsToUpdate.length} domains`,
        );
      }
      if (succeeded.length > 0) {
        toast.success(
          `Auto-renew ${enabled ? 'enabled' : 'disabled'} for ${succeeded.length} domain${succeeded.length > 1 ? 's' : ''}`,
        );
      }
      if (enabled && succeeded.length > 0) {
        const celebrationX = position?.x ?? 0.5;
        const celebrationY = position?.y ?? 0.9;
        setTimeout(
          () => triggerCelebrationAtPosition(celebrationX, celebrationY),
          100,
        );
      }

      setTogglingAutoRenew((prev) => {
        const next = new Set(prev);
        for (const d of domainsToUpdate) next.delete(d);
        return next;
      });
    },
    [selectedDomainIds, preferencesMutation],
  );

  // Handle renew now with year selection
  const handleRenewNowWithYears = useCallback(
    async (
      domainsToRenew: Array<{
        normalizedDomainName: NamefiNormalizedDomain;
        expirationDate?: Date | null;
      }>,
      durationYears: number,
    ): Promise<RenewalResult[]> => {
      setProcessingDomains((prev) => {
        const next = new Set(prev);
        for (const d of domainsToRenew) {
          next.add(d.normalizedDomainName);
        }
        return next;
      });
      try {
        return await renewDomains(domainsToRenew, durationYears);
      } finally {
        setProcessingDomains((prev) => {
          const next = new Set(prev);
          for (const d of domainsToRenew) {
            next.delete(d.normalizedDomainName);
          }
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
    for (const row of tldPricingQuery.data?.tldPricing ?? []) {
      if (!row?.tld) continue;
      map.set(
        String(row.tld).toLowerCase(),
        row.renewalPriceUsdPerYear ?? null,
      );
    }
    return map;
  }, [tldPricingQuery.data]);

  // Ref to hold the latest filtered domains for filter suggestions
  // This avoids circular dependencies between filter strategy and filtered data
  const filteredDomainsRef = useRef<DomainRow[]>(domains);

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
        label: 'Renewal',
        type: 'date' as const,
        columnId: 'expirationDate',
      },
      dateTokenized: {
        id: 'dateTokenized',
        label: 'Date Tokenized',
        type: 'date' as const,
        columnId: 'dateTokenized',
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

  const getFieldSuggestions = useCallback(
    ({ fieldId }: { fieldId: string }) => {
      const data = filteredDomainsRef.current;
      if (!data) return [];

      if (fieldId === 'ownerAddress') {
        const uniqueAddresses = Array.from(
          new Set(
            data
              .map((d) => d.ownerAddress)
              .filter((addr): addr is string => !!addr),
          ),
        );
        return uniqueAddresses.map((addr) => ({
          value: addr,
          label: truncateWalletAddress(addr),
          type: 'wallet' as const,
        }));
      }

      if (fieldId === 'normalizedDomainName') {
        const uniqueNames = Array.from(
          new Set(
            data
              .map((d) => d.normalizedDomainName)
              .filter((name): name is NonNullable<typeof name> => !!name),
          ),
        );
        // Limit domain suggestions to 50 to avoid performance issues
        return uniqueNames.slice(0, 50).map((name) => ({
          value: name,
          label: name,
        }));
      }

      return [];
    },
    [],
  );

  const filterStrategy = useDrizzlerServerFilterStrategy<DomainRow>({
    filterConfig: drizzlerFilterConfig as any,
    filterDisplayOptions: { showInHeader: false },
    getFieldSuggestions,
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

  // Update ref with latest filtered domains synchronously to ensure suggestions are up to date
  filteredDomainsRef.current = filteredDomains;

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
      dateTokenized: (a: DomainRow, b: DomainRow) => {
        const timeA = a.dateTokenized ? new Date(a.dateTokenized).getTime() : 0;
        const timeB = b.dateTokenized ? new Date(b.dateTokenized).getTime() : 0;
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

  // Bulk auto-renew state derived directly from the selected rows; the query
  // cache is the single source of truth now.
  const bulkAutoRenewState = useMemo((): BulkAutoRenewState => {
    if (selectedDomainRows.length === 0) return 'off';
    const states = selectedDomainRows.map((d) => d.autoRenewEnabled ?? false);
    const allOn = states.every((s) => s === true);
    const allOff = states.every((s) => s === false);
    if (allOn) return 'on';
    if (allOff) return 'off';
    return 'mixed';
  }, [selectedDomainRows]);

  // Handle bulk auto-renew toggle from the three-state toggle
  const handleBulkAutoRenewToggle = useCallback(
    (newState: 'off' | 'on', position: { x: number; y: number } | null) => {
      handleBatchToggleAutoRenew(newState === 'on', position);
    },
    [handleBatchToggleAutoRenew],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setPage(1);
    },
    [setPageSize],
  );

  const columns: ColumnDef<DomainRow>[] = useMemo(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={pageSelectionState.allSelected}
            indeterminate={
              pageSelectionState.someSelected && !pageSelectionState.allSelected
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
        cell: ({ row }) => {
          const domainName = row.getValue('normalizedDomainName') as string;
          const unicodeName = safeToUnicode(domainName);
          const isPunycode = unicodeName !== domainName;
          return (
            <div className="flex items-center gap-2">
              <div className="min-w-0">
                <Link
                  href={`/domains/${domainName}?tab=dns-overview`}
                  aria-label={`Settings for ${domainName}`}
                  className="font-medium hover:underline"
                >
                  {unicodeName}
                </Link>
                {isPunycode && (
                  <span className="block text-xs text-muted-foreground">
                    {domainName}
                  </span>
                )}
              </div>
              <Tooltip>
                <TooltipTrigger
                  render={(props) => (
                    <a
                      {...props}
                      href={`https://${domainName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'text-muted-foreground hover:text-foreground transition-colors',
                        props.className,
                      )}
                      aria-label={`Visit ${domainName}`}
                      onClick={(event) => {
                        props.onClick?.(event);
                        event.stopPropagation();
                      }}
                    >
                      {props.children}
                    </a>
                  )}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </TooltipTrigger>
                <TooltipContent>Visit {domainName}</TooltipContent>
              </Tooltip>
            </div>
          );
        },
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
        header: 'Renewal',
        cell: ({ row }) => {
          const domainName = row.getValue('normalizedDomainName') as string;
          const expirationDate = row.getValue('expirationDate') as
            | Date
            | string
            | null
            | undefined;

          const isToggling = togglingAutoRenew.has(domainName);
          const isAutoRenewEnabled = row.original.autoRenewEnabled ?? false;
          const isExpired = expirationDate
            ? isPast(new Date(expirationDate))
            : false;
          const canRenew = isDomainPossiblyRenewable(expirationDate);

          return (
            <div className="flex flex-col gap-1">
              {/* Auto toggle row - primary text */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  Auto
                </span>
                <AutoRenewToggle
                  checked={isAutoRenewEnabled}
                  onCheckedChange={(checked, position) =>
                    handleToggleAutoRenew(domainName, checked, position)
                  }
                  disabled={isExpired}
                  isLoading={isToggling}
                  ariaLabel={`Auto-renew ${domainName}`}
                />
              </div>

              {/* Time left - secondary text, clickable to open renew modal */}
              {canRenew ? (
                <button
                  type="button"
                  onClick={() =>
                    setRenewNowModalDomains([
                      {
                        normalizedDomainName: domainName,
                        expirationDate,
                      },
                    ])
                  }
                  className="text-left text-[11px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer transition-colors"
                >
                  {formatExpirationDateISO(expirationDate)} (
                  {formatTimeLeft(expirationDate)})
                </button>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  {formatExpirationDateISO(expirationDate)} (
                  {isExpired ? 'Expired' : formatTimeLeft(expirationDate)})
                </span>
              )}
            </div>
          );
        },
        size: 180,
      },
      {
        id: 'autoEns',
        header: 'AutoENS',
        cell: ({ row }) => {
          const domainName = row.getValue('normalizedDomainName') as string;
          const expirationDate = row.getValue('expirationDate') as
            | Date
            | string
            | null
            | undefined;
          const isToggling = togglingAutoEns.has(domainName);
          const isAutoEnsEnabled = row.original.autoEnsEnabled ?? false;
          const isExpired = expirationDate
            ? isPast(new Date(expirationDate))
            : false;

          return (
            <div className="flex items-center gap-2">
              <AutoRenewToggle
                checked={isAutoEnsEnabled}
                onCheckedChange={(checked) =>
                  handleToggleAutoEns(domainName, checked)
                }
                disabled={isExpired}
                isLoading={isToggling}
                ariaLabel={`Auto-ENS ${domainName}`}
              />
            </div>
          );
        },
        size: 100,
      },
      {
        accessorKey: 'dateTokenized',
        header: 'Date Tokenized',
        cell: ({ row }) => {
          const dateTokenized = row.getValue('dateTokenized') as
            | Date
            | string
            | null
            | undefined;

          if (!dateTokenized) {
            return <span className="text-muted-foreground">-</span>;
          }

          const date = new Date(dateTokenized);
          if (Number.isNaN(date.getTime())) {
            return <span className="text-muted-foreground">-</span>;
          }

          // Format: yyyy-mm-dd
          const formattedDate = date.toISOString().slice(0, 10);

          return (
            <span className="text-sm text-muted-foreground">
              {formattedDate}
            </span>
          );
        },
        size: 140,
        enableSorting: true,
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

          return (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {priceLabel}
              </span>
              <RenewPricePremiumInfo domainName={domainName} />
            </div>
          );
        },
        size: 140,
        enableSorting: true,
      },
      {
        id: 'dnsStatus',
        header: 'DNS Records',
        cell: ({ row }) => {
          const domainName = row.getValue(
            'normalizedDomainName',
          ) as NamefiNormalizedDomain;
          const status = row.original.dnsStatus;
          const chainId = row.original.chainId ?? null;

          if (!status || !chainId)
            return <span className="text-muted-foreground">-</span>;

          return (
            <DnsStatusCell
              domainName={domainName}
              status={status}
              autoEnsEnabled={row.original.autoEnsEnabled ?? false}
              nftChainId={chainId}
            />
          );
        },
        size: 200,
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
                render={(props) => (
                  <a
                    {...props}
                    href={explorerUrl}
                    aria-label={`View NFT for ${domainName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex justify-start items-center',
                      props.className,
                    )}
                  >
                    {props.children}
                  </a>
                )}
                nativeButton={false}
              >
                <Compass className="w-4 h-4" />
              </Button>
            ) : null;

          if (isMobile) {
            return (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="!text-white border-0 bg-transparent shadow-none hover:bg-muted/30"
                      aria-label={`Actions for ${domainName}`}
                    />
                  }
                >
                  <MoreVertical className="w-4 h-4" />
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
      handleRowSelectionChange,
      handleToggleAllCurrentPage,
      handleToggleAutoRenew,
      handleToggleAutoEns,
      pageSelectionState,
      selectedDomainIds,
      togglingAutoRenew,
      togglingAutoEns,
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

      {/* Renew Now Modal */}
      <RenewNowModal
        isOpen={renewNowModalDomains.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setRenewNowModalDomains([]);
          }
        }}
        domains={renewNowModalDomains}
        renewalPriceUsdPerYearByTld={renewalPriceUsdPerYearByTld}
        getCustomRenewalPrice={getCustomRenewalPrice}
        onRenew={handleRenewNowWithYears}
        onSuccess={clearSelection}
      />

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
        onColumnVisibilityChange={isMobile ? undefined : setColumnVisibility}
        emptyMessage="No domains match your filters"
        loadingMessage="Loading domains..."
        paginationVisibility="auto"
        showPageSizeSelector={false}
      />

      {/* Floating Action Panel - lazy loaded to keep motion/react out of initial bundle */}
      <Suspense fallback={null}>
        <FloatingActionPanel
          selectedDomainCount={selectedDomainCount}
          bulkAutoRenewState={bulkAutoRenewState}
          onBulkAutoRenewToggle={handleBulkAutoRenewToggle}
          isTogglingAutoRenew={togglingAutoRenew.size > 0}
          onClearSelection={clearSelection}
          renewableDomainsCount={renewableDomainsCount}
          renewableDomains={renewableDomains}
          onRenewNow={(domains) => setRenewNowModalDomains(domains)}
          onBatchAction={setBatchAction}
        />
      </Suspense>
      <BatchDnsDialog
        isOpen={batchAction !== null}
        onOpenChange={(open) => !open && setBatchAction(null)}
        domains={Array.from(selectedDomainIds)}
        action={batchAction}
      />
    </>
  );
}
