import { Button } from '@/components/ui/shadcn/button';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { TooltipTrigger } from '@/components/ui/shadcn/tooltip';
import { TooltipContent } from '@/components/ui/shadcn/tooltip';
import { Tooltip } from '@/components/ui/shadcn/tooltip';
import { TooltipProvider } from '@/components/ui/shadcn/tooltip';
import type { DnsRecordSelect } from '@namefi-astra/db';
import type { CellContext, HeaderContext } from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AddEditRecordsDialog } from '../../../dialogs/add-edit-records-dialog';
import { DeleteRecordDialog } from '../../../dialogs/delete-records-dialog';
import { DNS_RECORD_TYPES, TTL_OPTIONS } from '../../../schemas';
import { EditableCell } from './editable-cell';

export const SelectColumnHeader = ({
  context,
}: {
  context: HeaderContext<DnsRecordSelect, any>;
}) => (
  <Checkbox
    checked={
      context.table.getIsAllPageRowsSelected() ||
      (context.table.getIsSomePageRowsSelected() && 'indeterminate')
    }
    onCheckedChange={(value) =>
      context.table.toggleAllPageRowsSelected(!!value)
    }
    aria-label="Select all"
  />
);
export const SelectColumnCell = ({
  context,
}: {
  context: CellContext<DnsRecordSelect, any>;
}) => (
  <Checkbox
    checked={context.row.getIsSelected()}
    onCheckedChange={(value) => context.row.toggleSelected(!!value)}
    aria-label="Select row"
  />
);

export const TypeColumnHeader = ({
  context,
}: {
  context: HeaderContext<DnsRecordSelect, any>;
}) => (
  <div className="flex items-center">
    <Button
      variant="ghost"
      onClick={() =>
        context.column.toggleSorting(context.column.getIsSorted() === 'asc')
      }
      className="p-0 hover:bg-transparent"
    >
      Type
      {context.column.getIsSorted() === 'asc' ? (
        <ChevronUp className="ml-1 h-4 w-4" />
      ) : context.column.getIsSorted() === 'desc' ? (
        <ChevronDown className="ml-1 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-1 h-4 w-4" />
      )}
    </Button>
  </div>
);

export const TypeColumnCell = ({
  context,
  onCellUpdate,
}: {
  context: CellContext<DnsRecordSelect, any>;
  onCellUpdate: (rowId: string, columnId: string, value: string) => void;
}) => {
  const type = context.row.getValue('type') as string;
  const rdata = context.row.original.rdata;
  const isSystemRecord = rdata === 'by AutoPark™' || rdata === 'by System';

  return (
    <div className="font-medium">
      {isSystemRecord ? (
        type
      ) : (
        <EditableCell
          enabled={false}
          value={type}
          row={context.row}
          column={context.column}
          onSave={(value) => onCellUpdate(context.row.id, 'type', value)}
          options={DNS_RECORD_TYPES.map((type) => ({
            value: type,
            label: type,
          }))}
          isSelectInput={true}
        />
      )}
    </div>
  );
};

export const NameColumnHeader = ({
  context,
}: {
  context: HeaderContext<DnsRecordSelect, any>;
}) => {
  // Memoize the sort handler
  const handleSort = () => {
    context.column.toggleSorting(context.column.getIsSorted() === 'asc');
  };

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        onClick={handleSort}
        className="p-0 hover:bg-transparent"
      >
        Name
        {context.column.getIsSorted() === 'asc' ? (
          <ChevronUp className="ml-1 h-4 w-4" />
        ) : context.column.getIsSorted() === 'desc' ? (
          <ChevronDown className="ml-1 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-1 h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export const NameColumnCell = ({
  context,
  onCellUpdate,
}: {
  context: CellContext<DnsRecordSelect, any>;
  onCellUpdate: (rowId: string, columnId: string, value: string) => void;
}) => {
  const name = context.row.getValue('name') as string;
  const rdata = context.row.original.rdata;
  const isSystemRecord = rdata === 'by AutoPark™' || rdata === 'by System';

  return isSystemRecord ? (
    name
  ) : (
    <EditableCell
      enabled={false}
      value={name}
      row={context.row}
      column={context.column}
      onSave={(value) => onCellUpdate(context.row.id, 'name', value)}
    />
  );
};

export const ValueColumnCell = ({
  context,
  onCellUpdate,
}: {
  context: CellContext<DnsRecordSelect, any>;
  onCellUpdate: (rowId: string, columnId: string, value: string) => void;
}) => {
  const value = context.row.getValue('rdata') as string;
  const rdata = context.row.original.rdata;
  const isSystemRecord = rdata === 'by AutoPark™' || rdata === 'by System';

  return (
    <div className="max-w-[300px] truncate">
      {isSystemRecord ? (
        value
      ) : (
        <EditableCell
          enabled={false}
          value={value}
          row={context.row}
          column={context.column}
          onSave={(value) => onCellUpdate(context.row.id, 'rdata', value)}
        />
      )}
    </div>
  );
};

export const TTLColumnHeader = ({
  context,
}: {
  context: HeaderContext<DnsRecordSelect, any>;
}) => {
  // Memoize the sort handler
  const handleSort = () => {
    context.column.toggleSorting(context.column.getIsSorted() === 'asc');
  };

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        onClick={handleSort}
        className="p-0 hover:bg-transparent"
      >
        TTL
        {context.column.getIsSorted() === 'asc' ? (
          <ChevronUp className="ml-1 h-4 w-4" />
        ) : context.column.getIsSorted() === 'desc' ? (
          <ChevronDown className="ml-1 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-1 h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export const TTLColumnCell = ({
  context,
  onCellUpdate,
}: {
  context: CellContext<DnsRecordSelect, any>;
  onCellUpdate: (rowId: string, columnId: string, value: string) => void;
}) => {
  const ttl = context.row.getValue('ttl') as string;
  const rdata = context.row.original.rdata;
  const isSystemRecord = rdata === 'by AutoPark™' || rdata === 'by System';

  // Format TTL for display
  const formatTtl = (ttlValue: string) => {
    const option = TTL_OPTIONS.find((opt) => opt.value.toString() === ttlValue);
    return option ? option.label : ttlValue;
  };

  return isSystemRecord ? (
    formatTtl(ttl)
  ) : (
    <EditableCell
      enabled={false}
      value={ttl}
      row={context.row}
      column={context.column}
      onSave={(value) => onCellUpdate(context.row.id, 'ttl', value)}
      options={TTL_OPTIONS.map(({ value, label }) => ({
        value: value.toString(),
        label,
      }))}
      isSelectInput={true}
    />
  );
};

export const ActionsColumnCell = ({
  context,
}: {
  context: CellContext<DnsRecordSelect, any>;
}) => {
  const record = context.row.original;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
      <AddEditRecordsDialog
        mode="edit"
        isOpen={isEditDialogOpen}
        zoneName={record.zoneName}
        records={[record]}
        onOpenChange={setIsEditDialogOpen}
      />
      <DeleteRecordDialog
        records={[record]}
        zoneName={record.zoneName}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild={true}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsEditDialogOpen(true)}
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
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={
                record.rdata === 'by AutoPark™' || record.rdata === 'by System'
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
            <Button variant="ghost" size="icon" className="h-8 w-8 hidden">
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
};
