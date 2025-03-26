'use client';

import type { DnsManagementProps } from '@/components/DNS/DnsManagement';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/table';
import { Button } from '@/components/ui/shadcn/button';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/utils/trpc';
import type { DnsRecordSelect } from '@namefi-astra/db/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
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
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronUp,
  Clipboard,
  Copy,
  Download,
  Edit,
  Filter,
  RotateCw,
  Search,
  Settings,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { FC, HTMLAttributes, KeyboardEvent } from 'react';
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { DeleteRecordDialog } from '../dialogs/DeleteRecordDialog';
import { RecordDialog } from '../dialogs/RecordDialog';
import { DNS_RECORD_TYPES, TTL_OPTIONS } from '../schemas';
import {
  type DialogAction,
  type DialogData,
  useDialogStore,
} from '../stores/dialog';

export type DnsRecordsTableProps = HTMLAttributes<HTMLDivElement> & {
  domain: string;
};

interface EditableCellProps {
  value: string;
  row: Row<DnsRecordSelect>;
  column: Column<DnsRecordSelect>;
  onSave: (value: string) => void;
  options?: { value: string; label: string }[];
  isSelectInput?: boolean;
}

const EditableCell = ({
  value: initialValue,
  row,
  // column,
  onSave,
  options,
  isSelectInput = false,
}: EditableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(value);
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSelectChange = (newValue: string) => {
    setValue(newValue);
    onSave(newValue);
    setIsEditing(false);
  };

  if (isEditing) {
    if (isSelectInput && options) {
      return (
        <Select defaultValue={value} onValueChange={handleSelectChange}>
          <SelectTrigger className="h-8 w-full bg-zinc-900 border-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            onSave(value);
            setIsEditing(false);
          }}
          className="h-8 bg-zinc-900 border-zinc-700"
        />
        <div className="flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-green-500"
            onClick={() => {
              onSave(value);
              setIsEditing(false);
            }}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-500"
            onClick={() => {
              setValue(initialValue);
              setIsEditing(false);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="cursor-pointer hover:bg-zinc-800 p-1 rounded"
      onClick={() => {
        // Don't allow editing system records
        const rdata = row.original.rdata;
        if (rdata === 'by AutoPark™' || rdata === 'by System') {
          return;
        }
        setIsEditing(true);
      }}
    >
      {initialValue}
    </button>
  );
};

export const DnsRecordsTable: FC<DnsManagementProps> = ({
  domain,
  className,
  ...rest
}: DnsRecordsTableProps) => {
  const trpc = useTRPC();

  // State for table
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [data, setData] = useState<DnsRecordSelect[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  // State for data

  const dnsRecords = useQuery(
    trpc.dnsRecords.getRecords.queryOptions(
      {
        normalizedDomainName: domain ?? '',
      },
      {
        enabled: !!domain,
      },
    ),
  );

  const onRefetch = useCallback(async () => {
    await dnsRecords.refetch();
  }, [dnsRecords]);

  // Create DNS record mutation
  const createDnsRecord = useMutation(
    trpc.dnsRecords.createDnsRecord.mutationOptions({
      onSuccess: onRefetch,
      onError: (error) => {
        toast('Failed to create DNS record', {
          description: error.message,
        });
      },
    }),
  );

  // UpdateNS record mutation
  const updateDnsRecord = useMutation(
    trpc.dnsRecords.updateRecord.mutationOptions({
      onSuccess: onRefetch,
      onError: (error) => {
        toast('Failed to update DNS record', {
          description: error.message,
        });
      },
    }),
  );

  // Delete DNS record mutation
  const deleteDnsRecord = useMutation(
    trpc.dnsRecords.deleteRecord.mutationOptions({
      onSuccess: onRefetch,
      onError: (error) => {
        toast('Failed to delete DNS record', {
          description: error.message,
        });
      },
    }),
  );

  // Add the openEditDialog from the store
  const {
    openDeleteDialog,
    openDeleteDialogSingle,
    openEditDialog,
    openEditDialogSingle,
  } = useDialogStore();

  // Define the callback handlers
  const handleDialogCallback = useCallback(
    async (action: DialogAction, data?: DialogData) => {
      console.log(`Dialog action: "${action}"`, data);

      if (!data) {
        return;
      }

      if (action === 'delete' && data.success) {
        await Promise.allSettled(
          data.originalRecords.map((record) =>
            deleteDnsRecord.mutateAsync({
              id: record.id as string,
              normalizedDomainName: domain as string,
            }),
          ),
        );

        toast('Records deleted', {
          description: data.message,
        });
      } else if (action === 'save' && data.success) {
        await Promise.allSettled(
          data.updatedRecords.map((record) =>
            updateDnsRecord.mutateAsync({
              id: record.id as string,
              normalizedDomainName: domain as string,
              type: record.type,
              name: record.name,
              rdata: record.rdata,
            }),
          ),
        );

        toast('Records saved', {
          description: data.message,
        });
      } else if (action === 'add' && data.success) {
        await Promise.allSettled(
          data.updatedRecords.map((record) =>
            createDnsRecord.mutateAsync({
              normalizedDomainName: domain as string,
              type: record.type,
              name: record.name,
              rdata: record.rdata,
            }),
          ),
        );

        toast('Records added', {
          description: data.message,
        });
      } else if (action === 'cancel') {
        console.log('Operation cancelled');
      }
    },
    [domain, deleteDnsRecord, updateDnsRecord, createDnsRecord],
  );

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
      setData((prev) =>
        prev.map((row) =>
          row.id === rowId ? { ...row, [columnId]: value } : row,
        ),
      );

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
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'type',
        header: ({ column }) => {
          // Memoize the sort handler
          const handleSort = () => {
            column.toggleSorting(column.getIsSorted() === 'asc');
          };

          return (
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={handleSort}
                className="p-0 hover:bg-transparent"
              >
                Type
                {column.getIsSorted() === 'asc' ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : column.getIsSorted() === 'desc' ? (
                  <ChevronDown className="ml-1 h-4 w-4" />
                ) : (
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                )}
              </Button>
            </div>
          );
        },
        cell: ({ row, column }) => {
          const type = row.getValue('type') as string;
          const rdata = row.original.rdata;
          const isSystemRecord =
            rdata === 'by AutoPark™' || rdata === 'by System';

          return (
            <div className="font-medium">
              {isSystemRecord ? (
                type
              ) : (
                <EditableCell
                  value={type}
                  row={row}
                  column={column}
                  onSave={(value) => handleCellUpdate(row.id, 'type', value)}
                  options={DNS_RECORD_TYPES.map((type) => ({
                    value: type,
                    label: type,
                  }))}
                  isSelectInput={true}
                />
              )}
            </div>
          );
        },
        filterFn: 'includesString',
      },
      {
        accessorKey: 'name',
        header: ({ column }) => {
          // Memoize the sort handler
          const handleSort = () => {
            column.toggleSorting(column.getIsSorted() === 'asc');
          };

          return (
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={handleSort}
                className="p-0 hover:bg-transparent"
              >
                Name
                {column.getIsSorted() === 'asc' ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : column.getIsSorted() === 'desc' ? (
                  <ChevronDown className="ml-1 h-4 w-4" />
                ) : (
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                )}
              </Button>
            </div>
          );
        },
        cell: ({ row, column }) => {
          const name = row.getValue('name') as string;
          const rdata = row.original.rdata;
          const isSystemRecord =
            rdata === 'by AutoPark™' || rdata === 'by System';

          return isSystemRecord ? (
            name
          ) : (
            <EditableCell
              value={name}
              row={row}
              column={column}
              onSave={(value) => handleCellUpdate(row.id, 'name', value)}
            />
          );
        },
        filterFn: 'includesString',
      },
      {
        accessorKey: 'rdata',
        header: 'Value',
        cell: ({ row, column }) => {
          const value = row.getValue('rdata') as string;
          const rdata = row.original.rdata;
          const isSystemRecord =
            rdata === 'by AutoPark™' || rdata === 'by System';

          return (
            <div className="max-w-[300px] truncate">
              {isSystemRecord ? (
                value
              ) : (
                <EditableCell
                  value={value}
                  row={row}
                  column={column}
                  onSave={(value) => handleCellUpdate(row.id, 'rdata', value)}
                />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'ttl',
        header: ({ column }) => {
          // Memoize the sort handler
          const handleSort = () => {
            column.toggleSorting(column.getIsSorted() === 'asc');
          };

          return (
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={handleSort}
                className="p-0 hover:bg-transparent"
              >
                TTL
                {column.getIsSorted() === 'asc' ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : column.getIsSorted() === 'desc' ? (
                  <ChevronDown className="ml-1 h-4 w-4" />
                ) : (
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                )}
              </Button>
            </div>
          );
        },
        cell: ({ row, column }) => {
          const ttl = row.getValue('ttl') as string;
          const rdata = row.original.rdata;
          const isSystemRecord =
            rdata === 'by AutoPark™' || rdata === 'by System';

          // Format TTL for display
          const formatTTL = (ttlValue: string) => {
            const option = TTL_OPTIONS.find((opt) => opt.value === ttlValue);
            return option ? option.label : ttlValue;
          };

          return isSystemRecord ? (
            formatTTL(ttl)
          ) : (
            <EditableCell
              value={ttl}
              row={row}
              column={column}
              onSave={(value) => handleCellUpdate(row.id, 'ttl', value)}
              options={TTL_OPTIONS}
              isSelectInput={true}
            />
          );
        },
      },
      // {
      //   accessorKey: 'rdata',
      //   header: 'Notes',
      //   cell: ({ row }) => {
      //     const record = row.original;
      //     return (
      //       <div className="flex items-center gap-1">
      //         {record.rdata}
      //         {(record.rdata === 'by AutoPark™' ||
      //           record.rdata === 'by System') && (
      //           <TooltipProvider>
      //             <Tooltip>
      //               <TooltipTrigger asChild={true}>
      //                 <Info className="h-4 w-4 text-zinc-500 cursor-help" />
      //               </TooltipTrigger>
      //               <TooltipContent>
      //                 <p>This record is managed by the system</p>
      //               </TooltipContent>
      //             </Tooltip>
      //           </TooltipProvider>
      //         )}
      //       </div>
      //     );
      //   },
      // },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const record = row.original;

          // Memoize the edit handler
          const handleEdit = () => {
            openEditDialogSingle(record, handleDialogCallback);
          };

          // Memoize the delete handler
          const handleDelete = () => {
            openDeleteDialogSingle(record, handleDialogCallback);
          };

          // Memoize the copy handler
          const handleCopy = () => {
            const text = `${record.type} ${record.name} ${record.rdata} ${record.ttl}`;
            navigator.clipboard.writeText(text);
            toast('Copied to clipboard', {
              description: 'Record details copied to clipboard',
            });
          };

          return (
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild={true}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleEdit}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit record</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild={true}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleDelete}
                      disabled={
                        record.rdata === 'by AutoPark™' ||
                        record.rdata === 'by System'
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete record</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild={true}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hidden"
                      onClick={handleCopy}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy record</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild={true}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hidden"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh record</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        },
      },
    ],
    [
      handleCellUpdate,
      handleDialogCallback,
      openDeleteDialogSingle,
      openEditDialogSingle,
    ],
  );

  // Memoize the table options
  const tableOptions = useMemo(
    () => ({
      data,
      columns,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onColumnVisibilityChange: setColumnVisibility,
      onRowSelectionChange: setRowSelection,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      state: {
        sorting,
        columnFilters,
        columnVisibility,
        rowSelection,
        globalFilter,
        pagination: {
          pageIndex,
          pageSize,
        },
      },
      manualPagination: false,
      pageCount: Math.ceil(data.length / pageSize),
    }),
    [
      data,
      columns,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pageIndex,
      pageSize,
    ],
  );

  // Initialize table
  const table = useReactTable(tableOptions);

  // Add bulk edit button next to bulk delete
  const selectedRows = useMemo(
    () => table.getFilteredSelectedRowModel().rows,
    [table],
  );
  const hasSelectedRows = useMemo(
    () => selectedRows.length > 0,
    [selectedRows.length],
  );

  // Handle bulk delete
  const handleBulkEdit = useCallback(() => {
    const selectedRecords = selectedRows.map((row) => row.original);
    openEditDialog(selectedRecords, handleDialogCallback);
  }, [handleDialogCallback, openEditDialog, selectedRows]);

  const handleBulkDelete = useCallback(() => {
    const selectedRecords = selectedRows.map((row) => row.original);
    openDeleteDialog(selectedRecords, handleDialogCallback);
  }, [handleDialogCallback, openDeleteDialog, selectedRows]);

  // Memoize pagination handlers
  const handlePreviousPage = useCallback(() => {
    setPageIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPageIndex((prev) => Math.min(table.getPageCount() - 1, prev + 1));
  }, [table]);

  const handleFirstPage = useCallback(() => {
    setPageIndex(0);
  }, []);

  const handleLastPage = useCallback(() => {
    setPageIndex(table.getPageCount() - 1);
  }, [table]);

  const handlePageSizeChange = useCallback((value: string) => {
    setPageSize(Number(value));
    setPageIndex(0); // Reset to first page when changing page size
  }, []);

  // Handle type filtering
  const handleTypeFilterChange = useCallback((type: string) => {
    setTypeFilter((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  }, []);

  useEffect(() => {
    if (typeFilter.length > 0) {
      setColumnFilters((prev) => {
        const typeFilterIndex = prev.findIndex(
          (filter) => filter.id === 'type',
        );
        if (typeFilterIndex >= 0) {
          const newFilters = [...prev];
          newFilters[typeFilterIndex] = { id: 'type', value: typeFilter };
          return newFilters;
        }
        return [...prev, { id: 'type', value: typeFilter }];
      });
    } else {
      setColumnFilters((prev) => prev.filter((filter) => filter.id !== 'type'));
    }
  }, [typeFilter]);

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
    [table],
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

  // Memoize the bulk action buttons
  const bulkActionButtons = useMemo(
    () =>
      hasSelectedRows && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkEdit}
            className="ml-2"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Selected ({selectedRows.length})
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="ml-2"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected ({selectedRows.length})
          </Button>
        </>
      ),
    [handleBulkDelete, handleBulkEdit, hasSelectedRows, selectedRows.length],
  );

  // Memoize the pagination info
  const paginationInfo = useMemo(
    () => (
      <span className="text-sm text-zinc-500">
        Page {pageIndex + 1} of {table.getPageCount() || 1}
      </span>
    ),
    [pageIndex, table],
  );

  // Memoize the selection info
  const selectionInfo = useMemo(
    () => (
      <div className="text-sm text-zinc-500">
        {table.getFilteredSelectedRowModel().rows.length} of{' '}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
    ),
    [table],
  );

  // Memoize the page size selector
  const pageSizeSelector = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500">Rows per page:</span>
        <Select
          value={pageSize.toString()}
          onValueChange={handlePageSizeChange}
        >
          <SelectTrigger className="h-8 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    [handlePageSizeChange, pageSize],
  );

  useEffect(() => {
    setData((dnsRecords.data as DnsRecordSelect[]) || []);
  }, [dnsRecords.data]);

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

          <div className="flex items-center gap-2">{pageSizeSelector}</div>
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
          {selectionInfo}
          <div className="flex items-center gap-2">
            {paginationInfo}
            <Button
              variant="outline"
              size="sm"
              onClick={handleFirstPage}
              disabled={pageIndex === 0}
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={pageIndex === 0}
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={pageIndex >= table.getPageCount() - 1}
            >
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLastPage}
              disabled={pageIndex >= table.getPageCount() - 1}
            >
              <ChevronLast className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <RecordDialog />
      <DeleteRecordDialog />
    </>
  );
};

DnsRecordsTable.displayName = 'DnsRecordsTable';
