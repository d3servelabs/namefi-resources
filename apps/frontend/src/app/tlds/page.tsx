'use client';

import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
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
import { both, complement, isNil, isNotNil } from 'ramda';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { PageShell } from '@/components/page-shell';
import { TldPricingCard } from './tld-pricing-card';

type TldPricingRow =
  AppRouterOutput['registry']['getTldPricingTable']['tldPricing'][number];

type TldsTranslator = ReturnType<typeof useTranslations<'tlds'>>;

const formatRegistrarKey = (key: string | null, notAvailable: string) => {
  if (!key) {
    return notAvailable;
  }
  if (key === 'dynadot') {
    return 'Dynadot GDG';
  }
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function TldPricingPage() {
  const t = useTranslations('tlds');
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
        label: t('filters.tld'),
        type: 'text' as const,
        columnId: 'tld',
      },
      registrarKey: {
        id: 'registrarKey',
        label: t('filters.registrar'),
        type: 'text' as const,
        columnId: 'registrarKey',
      },
    }),
    [t],
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
        header: t('columns.tld'),
        cell: ({ row }) => (
          <code className="font-medium uppercase ring-1 ring-inset ring-ring/50 rounded-md px-2 py-1">{`.${row.getValue('tld')}`}</code>
        ),
        size: 120,
      },
      {
        accessorKey: 'registrationPriceUsdPerYear',
        header: t('columns.registration'),
        cell: ({ row }) =>
          priceCell({
            value: row.getValue('registrationPriceUsdPerYear'),
            row,
            t,
          }),
        size: 160,
      },
      {
        accessorKey: 'renewalPriceUsdPerYear',
        header: t('columns.renewal'),
        cell: ({ row }) =>
          priceCell({
            value: row.getValue('renewalPriceUsdPerYear'),
            row,
            t,
          }),
        size: 160,
      },
      {
        accessorKey: 'transferPriceUsdPerYear',
        header: t('columns.transfer'),
        cell: ({ row }) =>
          priceCell({
            value: row.getValue('transferPriceUsdPerYear'),
            row,
            t,
          }),
        size: 160,
      },
    ];

    if (isAdmin) {
      baseColumns.push({
        accessorKey: 'registrarKey',
        header: t('columns.registrar'),
        cell: ({ row }) => {
          const registrarKey = row.getValue('registrarKey') as string | null;
          return (
            <Badge variant="secondary">
              {formatRegistrarKey(registrarKey, t('notAvailable'))}
            </Badge>
          );
        },
        size: 140,
      });
    }

    return baseColumns;
  }, [isAdmin, t]);

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
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('nonPremiumNote')}
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
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-destructive">{t('loadError')}</div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell padding="compact">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
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
            emptyMessage={t('emptyMessage')}
            loadingMessage={t('loadingMessage')}
          />
          <p className="text-sm text-muted-foreground">{t('nonPremiumNote')}</p>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function priceCell({
  value,
  row,
  t,
}: {
  value: number | null;
  row: Row<TldPricingRow>;
  t: TldsTranslator;
}) {
  const all = [
    row.getValue('registrationPriceUsdPerYear'),
    row.getValue('renewalPriceUsdPerYear'),
    row.getValue('transferPriceUsdPerYear'),
  ].filter(both(complement(Number.isNaN), isNotNil));

  if (all.length === 0) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <span className="text-muted-foreground">{t('variablePrice')}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('variablePriceTooltip')}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  if (isNil(value) || Number.isNaN(value)) {
    return <span className="text-muted-foreground">{t('notAvailable')}</span>;
  }
  return (
    <span className="text-muted-foreground">
      {t.rich('perYear', {
        value: value.toFixed(2),
        price: (chunks) => (
          <span className="font-medium font-mono text-foreground">
            {chunks}$
          </span>
        ),
      })}
    </span>
  );
}
