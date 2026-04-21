import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
  type ColumnSizingState,
  type VisibilityState,
  getExpandedRowModel,
  type ExpandedState,
  type Row,
  type ColumnFiltersState,
  type ColumnOrderState,
} from '@tanstack/react-table';
import {
  useState,
  useCallback,
  useMemo,
  Fragment,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { TablePageSizeSelector } from './table-page-size-selector';
import { TablePageSelector } from './table-page-selector';
import {
  Loader2Icon,
  ColumnsIcon,
  Search,
  ArrowDownWideNarrowIcon,
  ArrowUpNarrowWideIcon,
  ArrowUpDownIcon,
  FilterIcon,
  RotateCcwIcon,
} from 'lucide-react';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { ColumnFilter } from './column-filter';
import { TableFilterPanel } from './table-filter-panel';
import { isNotNil } from 'ramda';

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

type ServerDataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading?: boolean;
  isFetching?: boolean;

  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;

  // Sorting
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;

  // Global search
  searchTerm?: string;
  onSearchChange?: (search: string) => void;
  searchPlaceholder?: string;

  // Column filtering
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  filterConfig?: FilterConfig;
  filterDisplayOptions?: FilterDisplayOptions;
  customFilters?: CustomFilterField[];

  // Expansion
  renderSubRow?: (row: Row<TData>) => ReactNode;
  getRowCanExpand?: (row: Row<TData>) => boolean;

  // Custom rendering
  emptyMessage?: string;
  loadingMessage?: string;

  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: Dispatch<SetStateAction<VisibilityState>>;

  // Column ordering
  columnOrder?: ColumnOrderState;
  onColumnOrderChange?: Dispatch<SetStateAction<ColumnOrderState>>;

  // Reset preferences
  onResetPreferences?: () => void;
};

export function ServerDataTable<TData>(props: ServerDataTableProps<TData>) {
  const {
    columns,
    data,
    isLoading,
    isFetching,
    page,
    pageSize,
    totalPages,
    totalCount,
    onPageChange,
    onPageSizeChange,
    sorting: controlledSorting,
    onSortingChange,
    searchTerm,
    onSearchChange,
    searchPlaceholder = 'Search...',
    columnFilters: controlledColumnFilters,
    onColumnFiltersChange,
    filterConfig,
    filterDisplayOptions,
    customFilters,
    renderSubRow,
    getRowCanExpand,
    emptyMessage = 'No data found',
    loadingMessage = 'Loading...',
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder: controlledColumnOrder,
    onColumnOrderChange,
    onResetPreferences,
  } = props;

  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  // Local state for column order if not controlled
  const [localColumnOrder, setLocalColumnOrder] = useState<ColumnOrderState>(
    [],
  );
  const isControlledColumnOrder = isNotNil(controlledColumnOrder);
  const columnOrder = isControlledColumnOrder
    ? controlledColumnOrder
    : localColumnOrder;
  const setColumnOrder = isControlledColumnOrder
    ? (updater: any) => {
        const newValue =
          typeof updater === 'function'
            ? updater(controlledColumnOrder ?? [])
            : updater;
        onColumnOrderChange?.(newValue);
      }
    : setLocalColumnOrder;

  // Local state for sorting if not controlled
  const [localSorting, setLocalSorting] = useState<SortingState>([]);
  const sorting = controlledSorting ?? localSorting;
  const setSorting = onSortingChange
    ? (updater: any) => {
        const newValue =
          typeof updater === 'function'
            ? updater(controlledSorting ?? [])
            : updater;
        onSortingChange(newValue);
      }
    : setLocalSorting;

  // Local state for column filters if not controlled
  const [localColumnFilters, setLocalColumnFilters] =
    useState<ColumnFiltersState>([]);
  const columnFilters = controlledColumnFilters ?? localColumnFilters;
  const setColumnFilters = onColumnFiltersChange
    ? (updater: any) => {
        const newValue =
          typeof updater === 'function'
            ? updater(controlledColumnFilters ?? [])
            : updater;
        onColumnFiltersChange(newValue);
      }
    : setLocalColumnFilters;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnSizing,
      expanded,
      columnFilters,
      columnOrder,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange,
    onColumnSizingChange: setColumnSizing,
    onExpandedChange: setExpanded,
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: getRowCanExpand,
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    pageCount: totalPages,
    defaultColumn: {
      minSize: 50,
      maxSize: 800,
    },
  });

  // Check if any columns have been manually resized
  const hasResizedColumns = Object.keys(columnSizing).length > 0;

  // Column reordering handlers
  const handleDragStart = useCallback((columnId: string) => {
    setDraggedColumn(columnId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (targetColumnId: string) => {
      if (!draggedColumn || draggedColumn === targetColumnId) {
        setDraggedColumn(null);
        return;
      }

      const currentOrder = table.getState().columnOrder;
      const allColumns = table.getAllLeafColumns().map((col) => col.id);

      // Use current order if set, otherwise use default column order
      const workingOrder = currentOrder.length > 0 ? currentOrder : allColumns;

      const draggedIndex = workingOrder.indexOf(draggedColumn);
      const targetIndex = workingOrder.indexOf(targetColumnId);

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedColumn(null);
        return;
      }

      // Create new order by removing dragged column and inserting at target position
      const newOrder = [...workingOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedColumn);

      setColumnOrder(newOrder);
      setDraggedColumn(null);
    },
    [draggedColumn, table, setColumnOrder],
  );

  // Calculate total table width based on column sizes
  const totalTableWidth = table
    .getVisibleFlatColumns()
    .reduce((total, column) => {
      return total + column.getSize();
    }, 0);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange?.(e.target.value);
    },
    [onSearchChange],
  );

  const searchInput = useMemo(() => {
    if (!onSearchChange) return null;

    return (
      <div className="relative w-64">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm ?? ''}
          onChange={handleSearchChange}
          className="pl-8"
        />
      </div>
    );
  }, [searchTerm, handleSearchChange, searchPlaceholder, onSearchChange]);

  // Calculate total active filter count
  const activeFilterCount = useMemo(() => {
    const customFilterCount =
      customFilters?.filter((f) => f.value !== undefined && f.value !== '')
        .length ?? 0;
    return columnFilters.length + customFilterCount;
  }, [columnFilters.length, customFilters]);

  // Get columns that can be hidden for visibility dropdown
  const visibilityColumns = useMemo(
    () => table.getAllColumns().filter((column) => column.getCanHide()),
    [table],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">{searchInput}</div>
        <div className="flex items-center gap-2">
          {/* Filter Panel Toggle */}
          {(filterConfig || customFilters) &&
            onColumnFiltersChange &&
            filterDisplayOptions?.showInPanel !== false && (
              <div
                className={
                  activeFilterCount > 0
                    ? 'relative rounded-md p-[2px] bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-gradient-xy'
                    : ''
                }
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterPanelOpen(true)}
                >
                  <FilterIcon className="h-3 w-3 mr-1" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="outline" className="ml-1">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </div>
            )}

          {/* Column Visibility Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <ColumnsIcon className="h-3 w-3 mr-1" />
              Columns
              <Badge variant="outline" className="ml-1">
                {table.getVisibleFlatColumns().length}/
                {table.getAllColumns().length}
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {visibilityColumns.map((column) => (
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
                ))}
                {onResetPreferences && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="w-full justify-start text-xs font-normal"
                      onSelect={() => onResetPreferences()}
                    >
                      <RotateCcwIcon className="h-3 w-3 mr-2" />
                      Reset to defaults
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-visible relative">
        {isFetching && !isLoading && <TableLoadingBar />}
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
                      draggable
                      onDragStart={() => handleDragStart(header.column.id)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(header.column.id)}
                      className={cn(
                        'px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                        header.column.getCanSort() &&
                          'cursor-pointer select-none hover:text-foreground transition-colors',
                        draggedColumn === header.column.id &&
                          'opacity-50 bg-muted',
                        draggedColumn &&
                          draggedColumn !== header.column.id &&
                          'cursor-move',
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
                        {filterConfig?.[header.column.id] &&
                          onColumnFiltersChange &&
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
                                        { id: header.column.id, value },
                                      ]
                                    : columnFilters.filter(
                                        (f) => f.id !== header.column.id,
                                      );
                                  onColumnFiltersChange(newFilters);
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
                    <p>{loadingMessage}</p>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    {emptyMessage}
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TablePageSizeSelector
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
          />
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages} — Total {totalCount}{' '}
            {totalCount === 1 ? 'row' : 'rows'}
          </div>
        </div>
        <TablePageSelector
          pageIndex={page - 1}
          setPageIndex={(index) => {
            onPageChange(index + 1);
          }}
          pageCount={totalPages}
        />
      </div>

      {/* Filter Panel */}
      {(filterConfig || customFilters) && onColumnFiltersChange && (
        <TableFilterPanel
          open={filterPanelOpen}
          onOpenChange={setFilterPanelOpen}
          filterConfig={filterConfig || {}}
          columnFilters={columnFilters}
          onColumnFiltersChange={onColumnFiltersChange}
          customFilters={customFilters}
        />
      )}
    </div>
  );
}

export function TableLoadingBar() {
  return (
    <div className="absolute top-0 left-0 right-0 h-1.5 bg-card z-50 overflow-x-clip overflow-y-visible">
      <div
        className="h-full absolute w-[40%]"
        style={{
          animation: 'gradient-slide 4s ease-in-out infinite',
        }}
      >
        {/* Core gradient layer */}
        <div
          className="h-full w-full absolute"
          style={{
            background: `linear-gradient(
                  90deg,
                   transparent 0%,
                    oklch(from var(--brand-primary) calc(l/1.2) c h) 35%,
                     oklch(from var(--brand-primary) calc(l/1.1) c h) 50%,
                      oklch(from var(--brand-primary) calc(l/1.2) c h) 65%,
                       transparent 100%)`,
          }}
        >
          {/* Halo effect layer */}
          <div
            id="halo"
            className="-left-2 -right-2 w-full h-1 top-2 z-10 blur-md absolute"
            style={{
              background: `linear-gradient(90deg,
                   transparent 0%,
                    oklch(from var(--brand-primary) l c h / 0.4) 40%,
                    oklch(from var(--brand-primary) l c h / 0.6) 60%,
                    oklch(from var(--brand-primary) l c h / 0.4) 90%,
                    transparent 100%)`,
              boxShadow:
                '0 0 12px 4px oklch(from var(--brand-primary) calc(l/3) c h)',
            }}
          />
        </div>
      </div>
      <style jsx>{`
              @keyframes gradient-slide {
                0% {
                  left: -50%;
                }
                100% {
                  left: 110%;
                }

              }
            `}</style>
    </div>
  );
}
