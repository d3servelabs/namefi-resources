import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnSizingState,
  type VisibilityState,
  getExpandedRowModel,
  type ExpandedState,
  type Row,
} from '@tanstack/react-table';
import { Fragment, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { TablePageSizeSelector } from './table-page-size-selector';
import { ArrowUpDown, Loader2Icon, ColumnsIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';

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
  renderSubRow?: (row: Row<TData>) => ReactNode;
  getRowCanExpand?: (row: Row<TData>) => boolean;
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
    renderSubRow,
    getRowCanExpand,
  } = props;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnSizing,
      expanded,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: getRowCanExpand,
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    defaultColumn: {
      minSize: 50,
      maxSize: 800,
    },
  });

  // Check if any columns have been manually resized
  const hasResizedColumns = Object.keys(columnSizing).length > 0;

  // Calculate total table width based on column sizes
  const totalTableWidth = table
    .getVisibleFlatColumns()
    .reduce((total, column) => {
      return total + column.getSize();
    }, 0);

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
          {/* Column Visibility Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ColumnsIcon className="h-3 w-3 mr-1" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      onSelect={(e) => e.preventDefault()}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

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
        <div className="overflow-x-auto relative">
          <table
            className="w-full text-sm"
            style={
              hasResizedColumns
                ? {
                    width: `${totalTableWidth}px`,
                    minWidth: 'calc(100% - 5px)',
                  }
                : undefined
            }
          >
            <colgroup>
              {table.getVisibleFlatColumns().map((column) => (
                <col
                  key={column.id}
                  style={
                    hasResizedColumns
                      ? {
                          width: `${column.getSize()}px`,
                        }
                      : undefined
                  }
                />
              ))}
            </colgroup>
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
                      style={{
                        position: 'relative',
                        ...(hasResizedColumns && {
                          width: `${header.getSize()}px`,
                        }),
                      }}
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
                      {/* Resize handle */}
                      {header.column.getCanResize() && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            header.getResizeHandler()(e);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            header.getResizeHandler()(e);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                            }
                          }}
                          className={cn(
                            'absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none z-10',
                            'hover:bg-primary/50 active:bg-primary border-0 bg-transparent p-0',
                            header.column.getIsResizing() && 'bg-primary',
                          )}
                          style={{
                            transform: 'translateX(50%)',
                          }}
                          aria-label="Resize column"
                          tabIndex={-1}
                        />
                      )}
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
                  <Fragment key={row.id}>
                    <tr
                      key={row.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 overflow-hidden"
                          style={
                            hasResizedColumns
                              ? {
                                  width: `${cell.column.getSize()}px`,
                                  maxWidth: `${cell.column.getSize()}px`,
                                }
                              : undefined
                          }
                        >
                          <div className="break-words overflow-wrap-anywhere">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                    {row.getIsExpanded() && renderSubRow && (
                      <tr key={`${row.id}-expanded`}>
                        <td
                          colSpan={columns.length}
                          className="px-4 py-2 bg-muted/30"
                        >
                          {renderSubRow(row)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
