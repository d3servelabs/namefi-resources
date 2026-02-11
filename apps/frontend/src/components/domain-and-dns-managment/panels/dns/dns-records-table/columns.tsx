import { useTRPC } from '@/lib/trpc';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/shadcn/alert-dialog';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { TooltipTrigger } from '@/components/ui/shadcn/tooltip';
import { TooltipContent } from '@/components/ui/shadcn/tooltip';
import { Tooltip } from '@/components/ui/shadcn/tooltip';
import { TooltipProvider } from '@/components/ui/shadcn/tooltip';
import type { DnsRecordSelect } from '@namefi-astra/db';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CellContext, HeaderContext } from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit,
  Loader2,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AddEditRecordsDialog } from '../../../dialogs/add-edit-records-dialog';
import { DeleteRecordDialog } from '../../../dialogs/delete-records-dialog';
import { DNS_RECORD_TYPES, TTL_OPTIONS } from '../../../schemas';
import { EditableCell } from './editable-cell';
import {
  getManagedDnsRecordMetadata,
  getManagedRecordDisablePatch,
  getManagedRecordLabel,
  isManagedDnsRecord,
} from './managed-records';

export const SelectColumnHeader = ({
  context,
}: {
  context: HeaderContext<DnsRecordSelect, any>;
}) => {
  const isAllSelected = context.table.getIsAllPageRowsSelected();
  const isSomeSelected = context.table.getIsSomePageRowsSelected();

  return (
    <Checkbox
      checked={isAllSelected}
      indeterminate={!isAllSelected && isSomeSelected}
      onCheckedChange={(value) =>
        context.table.toggleAllPageRowsSelected(!!value)
      }
      aria-label="Select all"
    />
  );
};

export const SelectColumnCell = ({
  context,
}: {
  context: CellContext<DnsRecordSelect, any>;
}) => (
  <Checkbox
    checked={context.row.getIsSelected()}
    onCheckedChange={(value) => context.row.toggleSelected(!!value)}
    aria-label="Select row"
    disabled={!context.row.getCanSelect()}
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
  const managedLabel = getManagedRecordLabel(context.row.original);
  const isManagedRecord = managedLabel !== null;

  return (
    <div className="font-medium flex items-center gap-2">
      {isManagedRecord ? (
        <span>{type}</span>
      ) : (
        <EditableCell
          enabled={false}
          value={type}
          row={context.row}
          column={context.column}
          onSave={(value) => onCellUpdate(context.row.id, 'type', value)}
          options={DNS_RECORD_TYPES.map((recordType) => ({
            value: recordType,
            label: recordType,
          }))}
          isSelectInput={true}
        />
      )}
      {managedLabel && (
        <Badge variant="secondary" className="text-[10px] uppercase">
          {managedLabel}
        </Badge>
      )}
    </div>
  );
};

export const NameColumnHeader = ({
  context,
}: {
  context: HeaderContext<DnsRecordSelect, any>;
}) => {
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

  return isManagedDnsRecord(context.row.original) ? (
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

  return (
    <div className="max-w-[300px] truncate">
      {isManagedDnsRecord(context.row.original) ? (
        value
      ) : (
        <EditableCell
          enabled={false}
          value={value}
          row={context.row}
          column={context.column}
          onSave={(nextValue) =>
            onCellUpdate(context.row.id, 'rdata', nextValue)
          }
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
  const ttl = context.row.getValue('ttl');

  const formatTtl = (ttlValue: string) => {
    const option = TTL_OPTIONS.find((opt) => opt.value.toString() === ttlValue);
    return option ? option.label : ttlValue;
  };

  return isManagedDnsRecord(context.row.original) ? (
    formatTtl(String(ttl))
  ) : (
    <EditableCell
      enabled={false}
      value={String(ttl)}
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
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const managedMetadata = getManagedDnsRecordMetadata(record);
  const managedDisablePatch = getManagedRecordDisablePatch(record);
  const isManagedRecord = managedMetadata !== null;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isManagedDeleteDialogOpen, setIsManagedDeleteDialogOpen] =
    useState(false);

  const updateDomainPreferencesAndConfig = useMutation(
    trpc.domainConfig.updateDomainPreferencesAndConfig.mutationOptions(),
  );
  const { data: domainPreferencesAndConfig } = useQuery(
    trpc.domainConfig.getDomainPreferencesAndConfig.queryOptions(
      {
        domainName: record.zoneName,
      },
      {
        enabled:
          isManagedDeleteDialogOpen &&
          managedMetadata?.managedBy === 'autoPark',
      },
    ),
  );
  const isForwardingEnabled = Boolean(
    domainPreferencesAndConfig?.forwardTo?.trim(),
  );

  const handleCopy = () => {
    const text = `${record.type} ${record.name} ${record.rdata} ${record.ttl}`;
    navigator.clipboard.writeText(text);
    toast('Copied to clipboard', {
      description: 'Record details copied to clipboard',
    });
  };

  const handleManagedDelete = async () => {
    if (!managedDisablePatch) {
      return;
    }

    try {
      await updateDomainPreferencesAndConfig.mutateAsync({
        domainName: record.zoneName,
        domainPreferencesAndConfig: managedDisablePatch,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.dnsRecords.getRecords.queryKey({
            zoneName: record.zoneName,
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.domainConfig.getDomainPreferencesAndConfig.queryKey({
            domainName: record.zoneName,
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.users.getCurrentUserDomains.queryKey(),
        }),
      ]);

      const successMessage =
        managedMetadata?.managedBy === 'autoPark'
          ? 'Parking and forwarding disabled'
          : managedMetadata?.managedBy === 'autoEns'
            ? 'AutoENS disabled'
            : 'Forwarding disabled';

      toast.success(successMessage);
      setIsManagedDeleteDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update managed DNS settings',
      );
    }
  };

  const managedDeleteTitle =
    managedMetadata?.managedBy === 'autoPark'
      ? 'Disable parking records?'
      : managedMetadata?.managedBy === 'autoEns'
        ? 'Disable AutoENS record?'
        : 'Disable forwarding record?';

  const managedDeleteDescription =
    managedMetadata?.managedBy === 'autoPark'
      ? 'This row is managed by Domain Preferences. Disabling it turns off parking.'
      : managedMetadata?.managedBy === 'autoEns'
        ? 'This row is managed by Domain Preferences. Disabling it turns off AutoENS.'
        : 'This row is managed by Domain Preferences. Disabling it clears forwarding.';

  return (
    <div className="flex items-center gap-2">
      {!isManagedRecord && (
        <>
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
        </>
      )}

      {isManagedRecord && (
        <AlertDialog
          open={isManagedDeleteDialogOpen}
          onOpenChange={setIsManagedDeleteDialogOpen}
        >
          <AlertDialogContent className="bg-zinc-950 border-zinc-800">
            <AlertDialogHeader>
              <AlertDialogTitle>{managedDeleteTitle}</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2 text-zinc-400">
                <p>{managedDeleteDescription}</p>
                {managedMetadata?.managedBy === 'autoPark' &&
                  isForwardingEnabled && (
                    <p className="text-amber-500">
                      Disabling parking records also disables forwarding.
                    </p>
                  )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={updateDomainPreferencesAndConfig.isPending}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={(event) => {
                  event.preventDefault();
                  void handleManagedDelete();
                }}
                disabled={updateDomainPreferencesAndConfig.isPending}
              >
                {updateDomainPreferencesAndConfig.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Disabling...
                  </>
                ) : (
                  'Disable'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {!isManagedRecord && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon" className="h-8 w-8" />
              }
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit record</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
            onClick={() =>
              isManagedRecord
                ? setIsManagedDeleteDialogOpen(true)
                : setIsDeleteDialogOpen(true)
            }
            disabled={
              isManagedRecord && updateDomainPreferencesAndConfig.isPending
            }
          >
            <Trash2 className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isManagedRecord ? 'Disable managed record' : 'Delete record'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" className="h-8 w-8 hidden" />
            }
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy record</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" className="h-8 w-8 hidden" />
            }
          >
            <RotateCw className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh record</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
