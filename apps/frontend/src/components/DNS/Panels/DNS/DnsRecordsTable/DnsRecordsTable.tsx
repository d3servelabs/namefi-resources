'use client';

import type { DnsManagementProps } from '@/components/DNS/DnsManagement';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/table';
import { Button } from '@/components/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { Input } from '@/components/ui/shadcn/input';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/utils/trpc';
import type { DnsRecordSelect } from '@namefi-astra/db/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { useQuery } from '@tanstack/react-query';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  Clipboard,
  Download,
  Edit,
  Filter,
  Search,
  Settings,
  SlidersHorizontal,
  Trash2,
  Upload,
} from 'lucide-react';
import type { FC, HTMLAttributes } from 'react';
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';
import { AddEditRecordsDialog } from '../../../dialogs/AddEditRecordsDialog';
import { DeleteRecordDialog } from '../../../dialogs/DeleteRecordsDialog';
import { DNS_RECORD_TYPES } from '../../../schemas';
import {
  ActionsColumnCell,
  NameColumnCell,
  NameColumnHeader,
  SelectColumnCell,
  SelectColumnHeader,
  TTLColumnCell,
  TTLColumnHeader,
  TypeColumnCell,
  TypeColumnHeader,
  ValueColumnCell,
} from './Columns';
import { TablePageSelector } from './TablePageSelector';
import { usePagination } from './usePagination';

export type DnsRecordsTableProps = HTMLAttributes<HTMLDivElement> & {
  domain: string;
};

export const DnsRecordsTable: FC<DnsManagementProps> = ({
  domain,
  className,
  ...rest
}: DnsRecordsTableProps) => {
  const trpc = useTRPC();
  const dnsRecords = useQuery(
    trpc.dnsRecords.getRecords.queryOptions(
      {
        zoneName: domain ?? '',
      },
      {
        enabled: !!domain,
      },
    ),
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const {
    pageSize,
    pageIndex,
    setPageIndex,
    handlePageSizeChange,
    setPageCount,
    pageCount,
  } = usePagination();

  useEffect(() => {
    setPageCount(Math.ceil((dnsRecords.data?.length ?? 0) / pageSize));
  }, [dnsRecords.data, pageSize, setPageCount]);

  // Memoize the handleGlobalFilterChange function
  const handleGlobalFilterChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setGlobalFilter(e.target.value);
    },
    [],
  );

  // Handle cell updates
  const handleCellUpdate = useCallback(
    (rowId: string, columnId: string, value: string) => {
      // TODO: Implement this

      toast('Record updated', {
        description: `${columnId.charAt(0).toUpperCase() + columnId.slice(1)} updated successfully.`,
      });
    },
    [],
  );

  // Define columns with useMemo
  const columns = useMemo<ColumnDef<DnsRecordSelect>[]>(
    () => [
      {
        id: 'select',
        header: (context) => <SelectColumnHeader context={context} />,
        cell: (context) => <SelectColumnCell context={context} />,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'type',
        header: (context) => <TypeColumnHeader context={context} />,
        cell: (context) => (
          <TypeColumnCell context={context} onCellUpdate={handleCellUpdate} />
        ),
        filterFn: (row, _, filterValue) => {
          if (!filterValue || filterValue.length === 0) {
            return true;
          }
          return filterValue.includes(row.original.type);
        },
      },
      {
        accessorKey: 'name',
        header: (context) => <NameColumnHeader context={context} />,
        cell: (context) => (
          <NameColumnCell context={context} onCellUpdate={handleCellUpdate} />
        ),
        filterFn: 'includesString',
      },
      {
        accessorKey: 'rdata',
        header: 'Value',
        cell: (context) => (
          <ValueColumnCell context={context} onCellUpdate={handleCellUpdate} />
        ),
      },
      {
        accessorKey: 'ttl',
        header: (context) => <TTLColumnHeader context={context} />,
        cell: (context) => (
          <TTLColumnCell context={context} onCellUpdate={handleCellUpdate} />
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (context) => <ActionsColumnCell context={context} />,
      },
    ],
    [handleCellUpdate],
  );

  const finalColumnFilters = useMemo(
    () => [{ id: 'type', value: typeFilter }, ...columnFilters],
    [typeFilter, columnFilters],
  );
  // Initialize table
  const table = useReactTable({
    data: dnsRecords.data ?? [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      if (!filterValue || filterValue.length === 0) {
        return true;
      }
      return (
        row.original.type.includes(filterValue) ||
        row.original.name.includes(filterValue) ||
        row.original.rdata.includes(filterValue) ||
        row.original.ttl.toString().includes(filterValue)
      );
    },
    state: {
      sorting,
      columnFilters: finalColumnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    manualPagination: true,
    pageCount,
  });

  // Add bulk edit button next to bulk delete
  const selectedRowModels = useMemo(
    () => table.getFilteredSelectedRowModel().rows,
    [table],
  );
  const selectedRecords = useMemo(
    () => selectedRowModels.map((row) => row.original),
    [selectedRowModels],
  );
  const hasSelectedRows = useMemo(
    () => selectedRowModels.length > 0,
    [selectedRowModels.length],
  );

  // Handle type filtering
  const handleTypeFilterChange = useCallback((type: string) => {
    setTypeFilter((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return Array.from(newSet);
    });
  }, []);

  // Memoize the search input
  const searchInput = useMemo(
    () => (
      <div className="relative w-64">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Search records..."
          value={globalFilter ?? ''}
          onChange={handleGlobalFilterChange}
          className="pl-8"
        />
      </div>
    ),
    [globalFilter, handleGlobalFilterChange],
  );

  // Memoize the column visibility dropdown
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const columnVisibilityDropdown = useMemo(
    () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild={true}>
          <Button variant="outline" className="ml-2">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter((column) => column.id !== 'select' && column.getCanHide())
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(value)}
                >
                  {column.id === 'ttl'
                    ? 'TTL'
                    : column.id.charAt(0).toUpperCase() + column.id.slice(1)}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [columnVisibility],
  );

  // Memoize the filter dropdown
  const filterDropdown = useMemo(
    () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild={true}>
          <Button variant="outline" className="ml-2">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {DNS_RECORD_TYPES.map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={typeFilter.includes(type)}
              onCheckedChange={() => handleTypeFilterChange(type)}
            >
              {type}
            </DropdownMenuCheckboxItem>
          ))}
          {typeFilter.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setTypeFilter([])}
                className="text-red-500"
              >
                Clear Filters
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [handleTypeFilterChange, typeFilter],
  );

  // Memoize the export/import dropdown
  const exportImportDropdown = useMemo(
    () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild={true}>
          <Button variant="outline" className="ml-2 hidden">
            <Settings className="mr-2 h-4 w-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Table Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Download className="mr-2 h-4 w-4" />
            Export Records
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Upload className="mr-2 h-4 w-4" />
            Import Records
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Clipboard className="mr-2 h-4 w-4" />
            Copy as Zone File
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [],
  );

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // Memoize the bulk action buttons
  const bulkActionButtons = useMemo(
    () =>
      hasSelectedRows && (
        <>
          <AddEditRecordsDialog
            zoneName={domain as NamefiNormalizedDomain}
            isOpen={isEditDialogOpen}
            records={selectedRecords}
            mode="edit"
            onOpenChange={setIsEditDialogOpen}
          >
            <Button variant="outline" size="sm" className="ml-2">
              <Edit className="mr-2 h-4 w-4" />
              Edit Selected ({selectedRecords.length})
            </Button>
          </AddEditRecordsDialog>
          <DeleteRecordDialog
            records={selectedRecords}
            zoneName={domain as NamefiNormalizedDomain}
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <Button variant="destructive" size="sm" className="ml-2">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedRecords.length})
            </Button>
          </DeleteRecordDialog>
        </>
      ),
    [
      hasSelectedRows,
      selectedRecords,
      domain,
      isDeleteDialogOpen,
      isEditDialogOpen,
    ],
  );

  return (
    <>
      <div className={cn('space-y-4', className)} {...rest}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {searchInput}
            {columnVisibilityDropdown}
            {filterDropdown}
            {exportImportDropdown}
            {bulkActionButtons}
          </div>

          <div className="flex items-center gap-2">
            <TablePageSelector
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </div>

        <div className="rounded-md border border-zinc-800">
          <div className="w-full grid grid-cols-1 overflow-x-auto">
            <Table>
              <Thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <Tr key={headerGroup.id} className="border-b border-zinc-800">
                    {headerGroup.headers.map((header) => (
                      <Th key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </Th>
                    ))}
                  </Tr>
                ))}
              </Thead>
              <Tbody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <Tr
                      key={row.id}
                      className="border-b border-zinc-800 hover:bg-zinc-800/50"
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <Td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </Td>
                      ))}
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={columns.length} className="h-24 text-center">
                      No records found.
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-500">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">
              Page {pageIndex + 1} of {table.getPageCount() || 1}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex(0)}
              disabled={pageIndex === 0}
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
              disabled={pageIndex === 0}
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPageIndex((prev) =>
                  Math.min(table.getPageCount() - 1, prev + 1),
                )
              }
              disabled={pageIndex >= table.getPageCount() - 1}
            >
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex(table.getPageCount() - 1)}
              disabled={pageIndex >= table.getPageCount() - 1}
            >
              <ChevronLast className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
