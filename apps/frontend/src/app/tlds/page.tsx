'use client';

import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { useHasPermissions } from '@/components/access/PermissionGate';
import { Permission } from '@namefi-astra/utils/permissions';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import {
  convertToDrizzlerFilterOptions,
  useDrizzlerServerFilterStrategy,
} from '@/components/table/filters';
import { applyDrizzlerFilterOnDataset } from '@samyx/drizzler-filters-sorters/experimental';
import type { ColumnDef, Row, VisibilityState } from '@tanstack/react-table';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { PageShell } from '@/components/page-shell';
import {
  PriceCell,
  RegistrarCell,
  TldNameCell,
  type TldPricingRow,
} from './cells';
import { TldPricingCard } from './tld-pricing-card';

export default function TldPricingPage() {
  const trpc = useTRPC();
  const { hasPermissions: isAdmin } = useHasPermissions(
    [Permission.VIEW_ADMIN_DASHBOARD],
    'some',
  );

  const pricingQuery = useQuery(
    trpc.registry.getTldPricingTable.queryOptions(),
  );

  const allRows = pricingQuery.data?.tldPricing ?? [];

  const [page, setPage] = useState(1);

  const defaultColumnVisibility: VisibilityState = {
    tld: true,
    registrationPriceUsdPerYear: true,
    renewalPriceUsdPerYear: true,
    transferPriceUsdPerYear: true,
    registrarKey: true,
  };

  const {
    preferences: { columnVisibility, sorting, pageSize },
    setColumnVisibility,
    setSorting,
    setPageSize,
  } = useTablePreferences({
    tableId: 'tld-pricing',
    defaultPreferences: {
      columnVisibility: defaultColumnVisibility,
      sorting: [{ id: 'tld', desc: false }],
      pageSize: 50,
    },
  });

  const drizzlerFilterConfig = useMemo(
    () => ({
      tld: {
        id: 'tld',
        label: 'TLD',
        type: 'text' as const,
        columnId: 'tld',
      },
      registrarKey: {
        id: 'registrarKey',
        label: 'Registrar',
        type: 'text' as const,
        columnId: 'registrarKey',
      },
    }),
    [],
  );

  const filterStrategy = useDrizzlerServerFilterStrategy<TldPricingRow>({
    filterConfig: drizzlerFilterConfig,
    filterDisplayOptions: { showInHeader: false },
  });

  const filterState = filterStrategy.filterState;

  const drizzlerFilterOptions = useMemo(
    () =>
      convertToDrizzlerFilterOptions<TldPricingRow>(
        filterState?.columnFilters ?? {},
      ),
    [filterState],
  );

  const filteredRows = useMemo(() => {
    if (!drizzlerFilterOptions) {
      return allRows;
    }
    return applyDrizzlerFilterOnDataset(allRows, drizzlerFilterOptions);
  }, [allRows, drizzlerFilterOptions]);

  const comparators = useMemo(
    () => ({
      tld: (a: TldPricingRow, b: TldPricingRow) =>
        (a.tld ?? '').localeCompare(b.tld ?? '', undefined, {
          sensitivity: 'base',
        }),
      registrationPriceUsdPerYear: (a: TldPricingRow, b: TldPricingRow) =>
        (a.registrationPriceUsdPerYear ?? 0) -
        (b.registrationPriceUsdPerYear ?? 0),
      renewalPriceUsdPerYear: (a: TldPricingRow, b: TldPricingRow) =>
        (a.renewalPriceUsdPerYear ?? 0) - (b.renewalPriceUsdPerYear ?? 0),
      transferPriceUsdPerYear: (a: TldPricingRow, b: TldPricingRow) =>
        (a.transferPriceUsdPerYear ?? 0) - (b.transferPriceUsdPerYear ?? 0),
      registrarKey: (a: TldPricingRow, b: TldPricingRow) =>
        (a.registrarKey ?? '').localeCompare(b.registrarKey ?? '', undefined, {
          sensitivity: 'base',
        }),
    }),
    [],
  );

  const sortedRows = useMemo(() => {
    if (sorting.length === 0) {
      return filteredRows;
    }
    const next = [...filteredRows];
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
  }, [filteredRows, sorting, comparators]);

  const totalCount = sortedRows.length;
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

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setPage(1);
    },
    [setPageSize],
  );

  const columns: ColumnDef<TldPricingRow>[] = useMemo(() => {
    const baseColumns: ColumnDef<TldPricingRow>[] = [
      {
        accessorKey: 'tld',
        header: 'TLD',
        cell: ({ row }) => <TldNameCell tld={row.getValue('tld')} />,
        size: 120,
      },
      {
        accessorKey: 'registrationPriceUsdPerYear',
        header: 'Registration',
        cell: ({ row }) => (
          <PriceCell
            value={row.getValue('registrationPriceUsdPerYear')}
            row={row}
          />
        ),
        size: 160,
      },
      {
        accessorKey: 'renewalPriceUsdPerYear',
        header: 'Renewal',
        cell: ({ row }) => (
          <PriceCell value={row.getValue('renewalPriceUsdPerYear')} row={row} />
        ),
        size: 160,
      },
      {
        accessorKey: 'transferPriceUsdPerYear',
        header: 'Transfer',
        cell: ({ row }) => (
          <PriceCell
            value={row.getValue('transferPriceUsdPerYear')}
            row={row}
          />
        ),
        size: 160,
      },
    ];

    if (isAdmin) {
      baseColumns.push({
        accessorKey: 'registrarKey',
        header: 'Registrar',
        cell: ({ row }) => (
          <RegistrarCell registrarKey={row.getValue('registrarKey')} />
        ),
        size: 140,
      });
    }

    return baseColumns;
  }, [isAdmin]);

  // Mobile card renderer. Mirrors the column cells so a phone-sized viewport gets
  // a readable stacked card per TLD instead of a horizontally-scrolling table.
  const renderMobileCard = useCallback(
    (row: Row<TldPricingRow>) => (
      <TldPricingCard row={row} showRegistrar={isAdmin} />
    ),
    [isAdmin],
  );

  if (pricingQuery.isLoading) {
    return (
      <PageShell padding="compact">
        <Card>
          <CardHeader>
            <CardTitle>TLD Pricing</CardTitle>
            <CardDescription>
              Review the base USD pricing for supported non-premium TLDs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              ** These prices apply only to non premium domains
            </p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (pricingQuery.isError) {
    return (
      <PageShell padding="compact">
        <Card>
          <CardHeader>
            <CardTitle>TLD Pricing</CardTitle>
            <CardDescription>
              Review the base USD pricing for supported non-premium TLDs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-destructive">
              Unable to load TLD pricing right now. Please try again shortly.
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell padding="compact">
      <Card>
        <CardHeader>
          <CardTitle>TLD Pricing</CardTitle>
          <CardDescription>
            Review the base USD pricing for supported non-premium TLDs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExtensibleDataTable<TldPricingRow, typeof filterStrategy>
            columns={columns}
            data={paginatedRows}
            isLoading={false}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            sorting={sorting}
            onSortingChange={setSorting}
            filterStrategy={filterStrategy}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            renderMobileCard={renderMobileCard}
            emptyMessage="No TLDs match your filters"
            loadingMessage="Loading TLD pricing..."
          />
          <p className="text-sm text-muted-foreground">
            ** These prices apply only to non premium domains
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
