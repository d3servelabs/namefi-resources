import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { TablePageSizeSelector } from './table-page-size-selector';
import { ArrowUpDown, Loader2Icon } from 'lucide-react';
import { cn } from '@/lib/cn';

type DataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading?: boolean;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
  nextPageToken?: string;
  onLoadMore?: (token?: string) => void;
  orderBy?: 'timestamp_desc' | 'timestamp_asc';
  onOrderByChange?: (o: 'timestamp_desc' | 'timestamp_asc') => void;
};

export function DataTable<TData>(props: DataTableProps<TData>) {
  const {
    columns,
    data,
    isLoading,
    pageSize,
    onPageSizeChange,
    nextPageToken,
    onLoadMore,
    orderBy,
    onOrderByChange,
  } = props;

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <TablePageSizeSelector
            pageSize={pageSize}
            onPageSizeChange={(n) => onPageSizeChange(n)}
          />
          <span className="text-sm text-muted-foreground">
            Showing {data.length} {data.length === 1 ? 'row' : 'rows'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onOrderByChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onOrderByChange(
                  orderBy === 'timestamp_desc'
                    ? 'timestamp_asc'
                    : 'timestamp_desc',
                )
              }
            >
              <ArrowUpDown className="h-3 w-3 mr-1" />
              {orderBy === 'timestamp_desc' ? 'Newest First' : 'Oldest First'}
            </Button>
          )}
          {onLoadMore && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onLoadMore(nextPageToken)}
              disabled={!nextPageToken || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="h-3 w-3 mr-1 animate-spin" />
                  Loading...
                </>
              ) : nextPageToken ? (
                'Load More'
              ) : (
                'No More Rows'
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        'px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                        header.column.getCanSort() &&
                          'cursor-pointer select-none hover:text-foreground transition-colors',
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {isLoading && data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    <Loader2Icon className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p>Loading audit logs...</p>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No audit logs found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
