'use client';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';
import NetworkLogo from '@/components/network-logo';
import { TablePageSelector } from '@/components/table/table-page-selector';
import { TablePageSizeSelector } from '@/components/table/table-page-size-selector';
import { usePagination } from '@/hooks/use-pagination';
import { useEffect } from 'react';

export type OrdersDataRow = {
  id: string;
  normalizedDomainName: string;
  amountInUSDCents: number;
  status: string;
  createdAt: string | Date;
  promoGroupOrCampaignKey?: string | null;
  promoReason?: string | null;
  nftChainId?: number | null;
};

// ---------------------------------------------------------------------------
// Shared per-cell rendering. Both the desktop table columns and the mobile
// cards render from these helpers so the two layouts can never drift — one
// source of truth for chain logos, amount formatting, status pills, promo
// composition, and timestamps.
// ---------------------------------------------------------------------------

function ChainCell({ chainId }: { chainId: number | null | undefined }) {
  if (!chainId) return <>-</>;
  return <NetworkLogo network={chainId} className="w-6 h-6" />;
}

function formatAmountUSD(amountInUsdCents: number | null | undefined): string {
  return ((Number(amountInUsdCents) || 0) / 100).toFixed(2);
}

function StatusCell({ status }: { status: string | null | undefined }) {
  const v = String(status ?? '');
  const color =
    v === 'SUCCEEDED'
      ? 'bg-green-100 text-green-700'
      : v === 'FAILED'
        ? 'bg-red-100 text-red-700'
        : v === 'CANCELLED'
          ? 'bg-gray-200 text-gray-700'
          : 'bg-yellow-100 text-yellow-700';
  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-medium ${color}`}
    >
      {v}
    </span>
  );
}

/** Flat searchable/sortable string for the promo column. */
function promoSearchValue(row: OrdersDataRow): string {
  const promoGroupOrCampaignKey = row.promoGroupOrCampaignKey ?? '';
  const promoReason = row.promoReason ?? '';
  if (promoGroupOrCampaignKey && promoReason) {
    return `${promoGroupOrCampaignKey} - (${promoReason})`;
  }
  return promoGroupOrCampaignKey || promoReason || '-';
}

function PromoCell({ row }: { row: OrdersDataRow }) {
  const promoGroupOrCampaignKey = row.promoGroupOrCampaignKey ?? '';
  const promoReason = row.promoReason ?? '';
  return (
    <div className="text-md font-semibold text-gray-100/85">
      {promoGroupOrCampaignKey}
      {!!promoReason && (
        <>
          <br />
          <span className="text-xs text-muted-foreground font-normal">
            ({promoReason})
          </span>
        </>
      )}
    </div>
  );
}

function formatCreatedAt(value: string | Date): string {
  // biome-ignore lint/suspicious/noExplicitAny: createdAt may arrive as string|Date.
  return new Date(value as any).toLocaleString();
}

/** One labeled row of a mobile card: label start-aligned, value end-aligned. */
function CardRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3.5 py-2.5">
      <dt className="shrink-0 pt-0.5 text-[13px] text-muted-foreground">
        {label}
      </dt>
      <dd className="flex min-w-0 flex-col items-end gap-0.5 text-right">
        {children}
      </dd>
    </div>
  );
}

/**
 * Mobile card for a single order row. Reuses the exact same cell components and
 * formatters as the desktop table columns — only the layout differs (an
 * iOS-style grouped list instead of a table row).
 */
function OrderCard({ row }: { row: OrdersDataRow }) {
  return (
    <Card
      className="gap-0 overflow-hidden px-0 py-0"
      data-testid={`orders.item.${row.id}`}
    >
      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        <span className="min-w-0 truncate text-sm font-semibold text-foreground">
          {row.normalizedDomainName || '-'}
        </span>
        <ChainCell chainId={row.nftChainId} />
      </div>
      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Amount (USD)">
          <span className="text-sm font-medium text-foreground">
            {formatAmountUSD(row.amountInUSDCents)}
          </span>
        </CardRow>
        <CardRow label="Status">
          <StatusCell status={row.status} />
        </CardRow>
        <CardRow label="Promo">
          <PromoCell row={row} />
        </CardRow>
        <CardRow label="Created At">
          <span className="text-[13px] text-muted-foreground">
            {formatCreatedAt(row.createdAt)}
          </span>
        </CardRow>
      </dl>
    </Card>
  );
}

export function OrdersDataTable({ items }: { items: OrdersDataRow[] }) {
  const isMobile = useIsMobile();
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    search: false,
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');

  // Pagination state
  const pagination = usePagination({
    defaultPageSize: 10,
    maxPageSize: 100,
  });

  const columns = useMemo<ColumnDef<OrdersDataRow>[]>(
    () => [
      {
        id: 'nftChainId',
        header: 'Chain',
        accessorKey: 'nftChainId',
        cell: ({ getValue }) => (
          <ChainCell chainId={getValue<number | null>()} />
        ),
      },
      {
        id: 'normalizedDomainName',
        header: 'Domain',
        accessorKey: 'normalizedDomainName',
        filterFn: 'includesString',
      },
      {
        id: 'amountInUSDCents',
        header: 'Amount (USD)',
        accessorKey: 'amountInUSDCents',
        cell: ({ getValue }) => formatAmountUSD(getValue<number>()),
        sortingFn: (a, b) =>
          (a.getValue<number>('amountInUSDCents') ?? 0) -
          (b.getValue<number>('amountInUSDCents') ?? 0),
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        cell: ({ getValue }) => <StatusCell status={getValue<string>()} />,
      },
      {
        id: 'promoGroupOrCampaignKey',
        header: 'Promo',
        accessorFn: (row) => promoSearchValue(row),
        filterFn: 'includesString',
        cell: ({ row }) => <PromoCell row={row.original} />,
      },
      // Hidden computed column for combined search across domain and promo
      {
        id: 'search',
        header: 'Search',
        accessorFn: (row) =>
          `${row.normalizedDomainName ?? ''} ${row.promoGroupOrCampaignKey ?? ''} ${row.promoReason ?? ''}`.trim(),
        filterFn: 'includesString',
        cell: () => null,
      },
      {
        id: 'createdAt',
        header: 'Created At',
        accessorKey: 'createdAt',
        cell: ({ getValue }) => formatCreatedAt(getValue<string | Date>()),
        sortingFn: (a, b) =>
          // biome-ignore lint/suspicious/noExplicitAny: createdAt may arrive as string|Date.
          new Date(a.getValue<any>('createdAt')).getTime() -
          // biome-ignore lint/suspicious/noExplicitAny: createdAt may arrive as string|Date.
          new Date(b.getValue<any>('createdAt')).getTime(),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: items ?? [],
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === 'function'
          ? updater(table.getState().pagination)
          : updater;
      pagination.setPageIndex(newState.pageIndex);
      pagination.setPageSize(newState.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  // Update page count when data changes
  const totalRows = table.getFilteredRowModel().rows.length;
  useEffect(() => {
    const calculatedPageCount = Math.ceil(totalRows / pagination.pageSize);
    if (calculatedPageCount !== pagination.pageCount) {
      pagination.setPageCount(calculatedPageCount);
    }
  }, [
    totalRows,
    pagination.pageSize,
    pagination.pageCount,
    pagination.setPageCount,
  ]);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-3 mb-3">
        <Input
          placeholder="Filter by domain or promo..."
          value={search}
          onChange={(e) => {
            const v = e.target.value;
            setSearch(v);
            table.getColumn('search')?.setFilterValue(v);
          }}
          className="max-w-xs"
          data-testid="orders.list.search"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            if (!v) return;
            setStatus(v);
            table
              .getColumn('status')
              ?.setFilterValue(v === 'ALL' ? undefined : v);
          }}
        >
          <SelectTrigger
            className="w-44"
            data-testid="orders.list.status-filter"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="SUCCEEDED">SUCCEEDED</SelectItem>
            <SelectItem value="PROCESSING">PROCESSING</SelectItem>
            <SelectItem value="CREATED">CREATED</SelectItem>
            <SelectItem value="FAILED">FAILED</SelectItem>
            <SelectItem value="CANCELLED">CANCELLED</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isMobile ? (
        // Mobile: a vertical stack of cards built from the SAME sorted/filtered/
        // paginated rows as the desktop table, reusing the shared cell helpers.
        <div className="flex flex-col gap-3">
          {table.getRowModel().rows.map((row) => (
            <OrderCard key={row.id} row={row.original} />
          ))}
        </div>
      ) : (
        <table
          className="w-full text-sm" /* mobile-ok desktop-only */
          data-testid="orders.list.table"
        >
          {/* mobile renders cards via useIsMobile; see OrderCard above */}
          <thead className="text-start text-muted-foreground">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="[&>th]:py-3">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="py-3 cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getIsSorted() === 'asc'
                      ? ' ▲'
                      : header.column.getIsSorted() === 'desc'
                        ? ' ▼'
                        : ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t [&>td]:py-3">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <TablePageSizeSelector
            pageSize={pagination.pageSize}
            onPageSizeChange={(size) => {
              pagination.handlePageSizeChange(size);
            }}
          />
          <span className="text-sm text-zinc-500">
            Showing {table.getRowModel().rows.length} of {totalRows} results
          </span>
        </div>
        <TablePageSelector
          pageIndex={pagination.pageIndex}
          setPageIndex={pagination.setPageIndex}
          pageCount={pagination.pageCount}
        />
      </div>
    </div>
  );
}
