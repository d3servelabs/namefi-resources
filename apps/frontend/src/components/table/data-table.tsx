import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
  type ColumnSizingState,
  type VisibilityState,
  type ColumnFiltersState,
  getExpandedRowModel,
  type ExpandedState,
  type Row,
  type PaginationState,
  type OnChangeFn,
} from '@tanstack/react-table';
import {
  Fragment,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { TablePageSizeSelector } from './table-page-size-selector';
import { TableFilterPanel } from './table-filter-panel';
import { ColumnFilter } from './column-filter';
import {
  ArrowUpDown,
  Loader2Icon,
  ColumnsIcon,
  FilterIcon,
  ArrowDownWideNarrowIcon,
  ArrowUpNarrowWideIcon,
  ArrowUpDownIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { Badge } from '@/components/ui/shadcn/badge';

// Helper function to apply filter operators for client-side filtering
export const applyFilterOperator = (
  cellValue: any,
  operator: string,
  filterValue: any,
): boolean => {
  if (typeof cellValue === 'string' && typeof filterValue === 'string') {
    const lowerCell = cellValue.toLowerCase();
    const lowerFilter = filterValue.toLowerCase();
    switch (operator) {
      case 'like':
        return lowerCell.includes(lowerFilter);
      case 'eq':
        return lowerCell === lowerFilter;
      case 'neq':
        return lowerCell !== lowerFilter;
      default:
        return lowerCell.includes(lowerFilter);
    }
  }

  if (typeof cellValue === 'number' && typeof filterValue === 'number') {
    switch (operator) {
      case 'eq':
        return cellValue === filterValue;
      case 'neq':
        return cellValue !== filterValue;
      case 'gt':
        return cellValue > filterValue;
      case 'gte':
        return cellValue >= filterValue;
      case 'lt':
        return cellValue < filterValue;
      case 'lte':
        return cellValue <= filterValue;
      default:
        return cellValue === filterValue;
    }
  }
  if (cellValue instanceof Date && filterValue instanceof Date) {
    return applyFilterOperator(
      cellValue.getTime(),
      operator,
      filterValue.getTime(),
    );
  }
  return false;
};

type FilterConfig = {
  [columnId: string]: {
    type: 'text' | 'number' | 'date' | 'select';
    label?: string;
    options?: { value: string; label: string }[];
  };
};

type CustomFilterField = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  value?: string | number;
  onChange: (value: string | number | undefined) => void;
  onClear?: () => void;
};

type FilterDisplayOptions = {
  showInHeader?: boolean; // Show filters in column headers (default: true)
  showInPanel?: boolean; // Show filters in side panel (default: true)
};

type DataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading?: boolean;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
  nextPageToken?: string;
  onLoadMore?: (token?: string) => void;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  renderSubRow?: (row: Row<TData>) => ReactNode;
  getRowCanExpand?: (row: Row<TData>) => boolean;

  // Column filtering
  filterConfig?: FilterConfig;
  enableColumnFilters?: boolean;
  filterDisplayOptions?: FilterDisplayOptions;
  customFilters?: CustomFilterField[];
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: Dispatch<SetStateAction<VisibilityState>>;
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
    sorting,
    onSortingChange,
    renderSubRow,
    getRowCanExpand,
    filterConfig,
    enableColumnFilters = false,
    filterDisplayOptions,
    customFilters,
    columnVisibility,
    onColumnVisibilityChange,
  } = props;

  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });

  // Create a stable string representation of filters for dependency tracking
  const filterKey = useMemo(
    () => JSON.stringify(columnFilters),
    [columnFilters],
  );

  // Reset to page 1 when filters change
  // biome-ignore lint/correctness/useExhaustiveDependencies: filterKey intentionally triggers reset
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [filterKey]);

  // Reset to page 1 and sync pageSize when it changes
  useEffect(() => {
    setPagination({ pageIndex: 0, pageSize });
  }, [pageSize]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sorting ?? internalSorting ?? [],
      columnVisibility,
      columnSizing,
      expanded,
      columnFilters,
      pagination,
    },
    onSortingChange: onSortingChange ?? setInternalSorting,
    onColumnVisibilityChange,
    onColumnSizingChange: setColumnSizing,
    onExpandedChange: setExpanded,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: enableColumnFilters
      ? getFilteredRowModel()
      : undefined,
    getPaginationRowModel: getPaginationRowModel(),
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

  // Calculate active filter count for rainbow gradient
  const activeFilterCount = useMemo(() => {
    const customFilterCount =
      customFilters?.filter((f) => f.value !== undefined && f.value !== '')
        .length ?? 0;
    return columnFilters.length + customFilterCount;
  }, [columnFilters.length, customFilters]);

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
          {/* Filter Panel Toggle */}
          {enableColumnFilters &&
            (filterConfig || customFilters) &&
            filterDisplayOptions?.showInPanel !== false && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterPanelOpen(true)}
                className={cn(
                  activeFilterCount > 0 && [
                    'relative',
                    'before:absolute before:inset-[-2px] before:rounded-md before:-z-10',
                    'before:bg-[conic-gradient(from_0deg,#ff7773,#ffed5f,#a8ff5f,#83fff7,#7894ff,#d875ff,#ff7773)]',
                    'before:animate-spin before:[animation-duration:3s]',
                    'bg-background',
                  ],
                )}
              >
                <FilterIcon className="h-3 w-3 mr-1" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            )}

          {/* Column Visibility Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <ColumnsIcon className="h-3 w-3 mr-1" />
              Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuGroup>
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
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

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
                          <div className="flex flex-col">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ArrowUpNarrowWideIcon className="h-3 w-3 text-primary" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDownWideNarrowIcon className="h-3 w-3 text-primary" />
                            ) : (
                              <ArrowUpDownIcon className="h-3 w-3 opacity-50" />
                            )}
                          </div>
                        )}
                        {enableColumnFilters &&
                          filterConfig?.[header.column.id] &&
                          filterDisplayOptions?.showInHeader !== false && (
                            // biome-ignore lint/a11y/useKeyWithClickEvents: not needed, this just to catch the event to stop event bubbling up
                            // biome-ignore lint/a11y/noStaticElementInteractions: needed to stop event bubbling up
                            <div onClick={(e) => e.stopPropagation()}>
                              <ColumnFilter
                                columnId={header.column.id}
                                columnName={
                                  typeof header.column.columnDef.header ===
                                  'string'
                                    ? header.column.columnDef.header
                                    : header.column.id
                                }
                                filterType={filterConfig[header.column.id].type}
                                options={filterConfig[header.column.id].options}
                                value={
                                  columnFilters?.find(
                                    (f) => f.id === header.column.id,
                                  )?.value as any
                                }
                                onChange={(value) => {
                                  const newFilters = value
                                    ? [
                                        ...columnFilters.filter(
                                          (f) => f.id !== header.column.id,
                                        ),
                                        {
                                          id: header.column.id,
                                          value: value,
                                        },
                                      ]
                                    : columnFilters.filter(
                                        (f) => f.id !== header.column.id,
                                      );
                                  setColumnFilters(newFilters);
                                }}
                              />
                            </div>
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

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()} — Total{' '}
          {table.getFilteredRowModel().rows.length}{' '}
          {table.getFilteredRowModel().rows.length === 1 ? 'row' : 'rows'}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {enableColumnFilters && (filterConfig || customFilters) && (
        <TableFilterPanel
          open={filterPanelOpen}
          onOpenChange={setFilterPanelOpen}
          filterConfig={filterConfig || {}}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          customFilters={customFilters}
        />
      )}
    </div>
  );
}
