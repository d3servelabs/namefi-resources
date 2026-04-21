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
import { useMemo, useState } from 'react';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
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

export function OrdersDataTable({ items }: { items: OrdersDataRow[] }) {
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
        cell: ({ getValue }) => {
          const v = getValue<number | null>();
          if (!v) return '-';
          return <NetworkLogo network={v} className="w-6 h-6" />;
        },
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
        cell: ({ getValue }) => ((Number(getValue()) || 0) / 100).toFixed(2),
        sortingFn: (a, b) =>
          (a.getValue<number>('amountInUSDCents') ?? 0) -
          (b.getValue<number>('amountInUSDCents') ?? 0),
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        cell: ({ getValue }) => {
          const v = String(getValue() ?? '');
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
        },
      },
      {
        id: 'promoGroupOrCampaignKey',
        header: 'Promo',
        accessorFn: (row) => {
          const promoGroupOrCampaignKey = row.promoGroupOrCampaignKey ?? '';
          const promoReason = row.promoReason ?? '';
          if (promoGroupOrCampaignKey && promoReason) {
            return `${promoGroupOrCampaignKey} - (${promoReason})`;
          }
          return promoGroupOrCampaignKey || promoReason || '-';
        },
        filterFn: 'includesString',
        cell({ row }) {
          const promoGroupOrCampaignKey =
            row.original.promoGroupOrCampaignKey ?? '';
          const promoReason = row.original.promoReason ?? '';

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
        },
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
        cell: ({ getValue }) => {
          const v = getValue() as string | Date;
          return new Date(v as any).toLocaleString();
        },
        sortingFn: (a, b) =>
          new Date(a.getValue<any>('createdAt')).getTime() -
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
          <SelectTrigger className="w-44">
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
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
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
