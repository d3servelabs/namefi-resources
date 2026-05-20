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
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { VisibilityState } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';
import { applyDrizzlerFilterOnDataset } from '@samyx/drizzler-filters-sorters/experimental';
import { CHAINS } from '@namefi-astra/utils/chains';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import {
  convertToDrizzlerFilterOptions,
  useDrizzlerServerFilterStrategy,
} from '@/components/table/filters';
import { BatchDnsDialog } from '@/components/domain-and-dns-managment/dialogs/batch-dns-dialog';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { useDnsEmailGate } from '@/hooks/use-dns-email-gate';
import {
  type RenewalResult,
  useDomainRenewal,
} from '@/hooks/use-domain-renewal';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { useWatchAssets } from '@/hooks/use-watch-assets';
import { useTRPC } from '@/lib/trpc';
import { useMyDomainsColumns } from './columns';
import { triggerCelebrationAtPosition } from './confetti-celebration';
import { RenewNowModal } from './renew-now-modal';
import type { BulkAutoRenewState, DomainRow } from './types';
import { useDomainPreferencesMutation } from './use-domain-preferences-mutation';
import {
  DEFAULT_DOMAIN_LIST_PAGE_SIZE,
  getCustomRenewalPrice,
  getRenewalPriceUsdPerYearForDomain,
  groupDomainsForWalletWatch,
  isDomainPossiblyRenewable,
  truncateWalletAddress,
} from './utils';

// Lazy-load the floating action panel to keep motion/react and @number-flow/react
// out of the initial /domains client bundle.
const FloatingActionPanel = dynamic(() => import('./floating-action-panel'), {
  ssr: false,
});

/**
 * Adds each (chain, owner wallet) batch of NFTs to the connected wallet,
 * tallying how many tokens were prompted successfully vs. failed. A failure in
 * one batch (e.g. user rejection) does not abort the remaining batches.
 */
async function watchNftGroupsInWallet(
  watchGroups: ReturnType<typeof groupDomainsForWalletWatch>,
  watchBulk: (
    chainId: number,
    walletAddress: string,
    tokenIds: string[],
  ) => Promise<PromiseSettledResult<unknown>[] | undefined>,
): Promise<{ addedCount: number; failedCount: number }> {
  let addedCount = 0;
  let failedCount = 0;
  for (const group of watchGroups) {
    try {
      const results = await watchBulk(
        group.chainId,
        group.walletAddress,
        group.tokenIds,
      );
      if (!results) {
        // The bulk call short-circuited (no wallet connected / unknown owner).
        failedCount += group.tokenIds.length;
        continue;
      }
      // `watchBulk` settles every per-token request, so tally each token rather
      // than assuming the whole batch succeeded once the promise resolves.
      for (const result of results) {
        if (result.status === 'fulfilled') {
          addedCount += 1;
        } else {
          failedCount += 1;
        }
      }
    } catch (e) {
      console.error(e);
      failedCount += group.tokenIds.length;
    }
  }
  return { addedCount, failedCount };
}

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
  const router = useRouter();
  const [selectedDomainIds, setSelectedDomainIds] = useState<
    Set<NamefiNormalizedDomain>
  >(() => new Set<NamefiNormalizedDomain>());
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
  const [isWatchingInWallet, setIsWatchingInWallet] = useState(false);

  const defaultColumnVisibility: VisibilityState = {
    select: true,
    account: false,
    autoEns: false,
    normalizedDomainName: true,
    expirationDate: true,
    dateTokenized: false,
  };

  const {
    preferences,
    setColumnVisibility,
    setSorting,
    setPageSize,
    resetToDefaults,
  } = useTablePreferences({
    tableId: `my-domains-${kind}-simplified`,
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
      autoEns: false,
      normalizedDomainName: true,
      expirationDate: true,
      dateTokenized: false,
    }),
    [],
  );

  const columnVisibility = isMobile
    ? mobileColumnVisibility
    : persistedColumnVisibility;

  const { renewDomains } = useDomainRenewal();
  const { gate: gateDnsEmail, modal: dnsEmailModal } = useDnsEmailGate();
  const { watchBulkNamefiNftInWallet, isAnyWalletConnected } = useWatchAssets();
  const { address: connectedAddress } = useAccount();

  const handleListForSaleClick = useCallback(
    (domainName: string) => {
      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.MyDomainsListForSaleClicked,
        properties: { domainName, tableKind },
      });
      router.push(`/domains/${encodeURIComponent(domainName)}?tab=marketplace`);
    },
    [logEventWithInteractionLoggers, tableKind, router],
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

  const handleRenewNowWithYears = useCallback(
    (
      domainsToRenew: Array<{
        normalizedDomainName: NamefiNormalizedDomain;
        expirationDate?: Date | null;
      }>,
      durationYears: number,
    ): Promise<RenewalResult[]> => renewDomains(domainsToRenew, durationYears),
    [renewDomains],
  );

  const tldPricingQuery = useQuery(
    trpc.registry.getTldPricingTable.queryOptions(),
  );
  const renewalPriceUsdPerYearByTld = useMemo(() => {
    const map = new Map<string, number | null>();
    const tldPricing = tldPricingQuery.data?.tldPricing ?? [];
    if (typeof tldPricing[Symbol.iterator] !== 'function') {
      // we should have to do this but this was throwing an error on the frontend
      return map;
    }
    for (const row of tldPricing) {
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

  const handleOpenRenewModal = useCallback(
    (domain: {
      normalizedDomainName: string;
      expirationDate: Date | string | null | undefined;
    }) => {
      setRenewNowModalDomains([domain]);
    },
    [],
  );

  const columns = useMyDomainsColumns({
    selectedDomainIds,
    pageSelectionState,
    togglingAutoRenew,
    togglingAutoEns,
    renewalPriceUsdPerYearByTld,
    isMobile,
    onToggleAllCurrentPage: handleToggleAllCurrentPage,
    onRowSelectionChange: handleRowSelectionChange,
    onToggleAutoRenew: handleToggleAutoRenew,
    onToggleAutoEns: handleToggleAutoEns,
    onOpenRenewModal: handleOpenRenewModal,
    onListForSaleClick: handleListForSaleClick,
  });

  // Adds the given domains' Namefi NFTs to the connected wallet via
  // `wallet_watchAsset`. Domains are batched per (chain, owner wallet) since
  // `watchBulkNamefiNftInWallet` prompts one wallet and chain at a time.
  const handleWatchDomainsInWallet = useCallback(
    async (domainsToWatch: DomainRow[]) => {
      const watchGroups = groupDomainsForWalletWatch(domainsToWatch);
      if (watchGroups.length === 0) {
        toast.error('No NFTs available to add to your wallet');
        return;
      }
      setIsWatchingInWallet(true);
      const { addedCount, failedCount } = await watchNftGroupsInWallet(
        watchGroups,
        watchBulkNamefiNftInWallet,
      ).finally(() => setIsWatchingInWallet(false));
      if (addedCount > 0) {
        toast.success(
          `Added ${addedCount} NFT${addedCount === 1 ? '' : 's'} to your wallet`,
        );
      }
      if (failedCount > 0) {
        toast.error(
          `Couldn't add ${failedCount} NFT${
            failedCount === 1 ? '' : 's'
          } to your wallet`,
        );
      }
    },
    [watchBulkNamefiNftInWallet],
  );

  // Domains in this table owned by the currently connected wallet — the basis
  // for the toolbar "Show NFTs in Wallet" action.
  const connectedWalletDomains = useMemo(() => {
    if (!connectedAddress) {
      return [];
    }
    const target = connectedAddress.toLowerCase();
    return domains.filter(
      (domain) => (domain.ownerAddress ?? '').toLowerCase() === target,
    );
  }, [domains, connectedAddress]);

  // Count only the NFTs that can actually be added: `groupDomainsForWalletWatch`
  // drops domains missing a chain id, owner address, or token id, so the toolbar
  // action stays consistent with what `handleWatchDomainsInWallet` will prompt.
  const watchableNftCount = useMemo(
    () =>
      groupDomainsForWalletWatch(connectedWalletDomains).reduce(
        (total, group) => total + group.tokenIds.length,
        0,
      ),
    [connectedWalletDomains],
  );

  const watchInWalletToolbarAction =
    isAnyWalletConnected && watchableNftCount > 0 ? (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleWatchDomainsInWallet(connectedWalletDomains)}
        disabled={isWatchingInWallet}
        aria-label={`Show ${watchableNftCount} NFT${
          watchableNftCount === 1 ? '' : 's'
        } in wallet`}
      >
        <Wallet className="h-3 w-3 mr-1" />
        Show NFTs in Wallet
      </Button>
    ) : null;

  return (
    <>
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
        onResetPreferences={resetToDefaults}
        toolbarActions={watchInWalletToolbarAction}
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
          onBatchAction={(action) => gateDnsEmail(() => setBatchAction(action))}
          onWatchSelectedInWallet={() =>
            handleWatchDomainsInWallet(selectedDomainRows)
          }
          isWatchingInWallet={isWatchingInWallet}
        />
      </Suspense>
      <BatchDnsDialog
        isOpen={batchAction !== null}
        onOpenChange={(open) => !open && setBatchAction(null)}
        domains={Array.from(selectedDomainIds)}
        action={batchAction}
      />
      {dnsEmailModal}
    </>
  );
}
