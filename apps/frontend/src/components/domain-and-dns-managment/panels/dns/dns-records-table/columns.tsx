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
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { TooltipTrigger } from '@namefi-astra/ui/components/shadcn/tooltip';
import { TooltipContent } from '@namefi-astra/ui/components/shadcn/tooltip';
import { Tooltip } from '@namefi-astra/ui/components/shadcn/tooltip';
import { TooltipProvider } from '@namefi-astra/ui/components/shadcn/tooltip';
import type { DnsRecordSelect } from '@namefi-astra/common/contract/entity-schemas';
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
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { AddEditRecordsDialog } from '../../../dialogs/add-edit-records-dialog';
import { DeleteRecordDialog } from '../../../dialogs/delete-records-dialog';
import { DNS_RECORD_TYPES, getTtlOptions } from '../../../schemas';
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
  const t = useTranslations('domains');
  const isAllSelected = context.table.getIsAllPageRowsSelected();
  const isSomeSelected = context.table.getIsSomePageRowsSelected();

  return (
    <Checkbox
      checked={isAllSelected}
      indeterminate={!isAllSelected && isSomeSelected}
      onCheckedChange={(value) =>
        context.table.toggleAllPageRowsSelected(!!value)
      }
      data-testid="domains.dns-records.select-all"
      aria-label={t('dnsRecords.selectAll')}
    />
  );
};

export const SelectColumnCell = ({
  context,
}: {
  context: CellContext<DnsRecordSelect, any>;
}) => {
  const t = useTranslations('domains');
  return (
    <Checkbox
      checked={context.row.getIsSelected()}
      onCheckedChange={(value) => context.row.toggleSelected(!!value)}
      data-testid={`domains.dns-records.select-row.${context.row.id}`}
      aria-label={t('dnsRecords.selectRow')}
      disabled={!context.row.getCanSelect()}
    />
  );
};

export const TypeColumnHeader = ({
  context,
}: {
  context: HeaderContext<DnsRecordSelect, any>;
}) => {
  const t = useTranslations('dnsManagement');
  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        onClick={() =>
          context.column.toggleSorting(context.column.getIsSorted() === 'asc')
        }
        data-testid="dnsManagement.records.sort-type"
        className="p-0 hover:bg-transparent"
      >
        {t('records.table.columnType')}
        {context.column.getIsSorted() === 'asc' ? (
          <ChevronUp className="ms-1 h-4 w-4" />
        ) : context.column.getIsSorted() === 'desc' ? (
          <ChevronDown className="ms-1 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ms-1 h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

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
  const t = useTranslations('dnsManagement');
  const handleSort = () => {
    context.column.toggleSorting(context.column.getIsSorted() === 'asc');
  };

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        onClick={handleSort}
        data-testid="dnsManagement.records.sort-name"
        className="p-0 hover:bg-transparent"
      >
        {t('records.table.columnName')}
        {context.column.getIsSorted() === 'asc' ? (
          <ChevronUp className="ms-1 h-4 w-4" />
        ) : context.column.getIsSorted() === 'desc' ? (
          <ChevronDown className="ms-1 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ms-1 h-4 w-4" />
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
  const t = useTranslations('dnsManagement');
  const handleSort = () => {
    context.column.toggleSorting(context.column.getIsSorted() === 'asc');
  };

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        onClick={handleSort}
        data-testid="dnsManagement.records.sort-ttl"
        className="p-0 hover:bg-transparent"
      >
        {t('records.table.columnTtl')}
        {context.column.getIsSorted() === 'asc' ? (
          <ChevronUp className="ms-1 h-4 w-4" />
        ) : context.column.getIsSorted() === 'desc' ? (
          <ChevronDown className="ms-1 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ms-1 h-4 w-4" />
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
  const t = useTranslations('dnsManagement');
  const ttlOptions = getTtlOptions();

  const formatTtl = (ttlValue: string) => {
    const option = ttlOptions.find((opt) => opt.value.toString() === ttlValue);
    return option ? t(option.labelKey) : ttlValue;
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
      options={ttlOptions.map(({ value, labelKey }) => ({
        value: value.toString(),
        label: t(labelKey),
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
  const t = useTranslations('dnsManagement');
  const tCommon = useTranslations('common');
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
    toast(t('records.toasts.copiedToClipboard'), {
      description: t('records.toasts.copiedToClipboardDescription'),
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
          ? t('records.toasts.parkingForwardingDisabled')
          : managedMetadata?.managedBy === 'autoEns'
            ? t('records.toasts.autoEnsDisabled')
            : t('records.toasts.forwardingDisabled');

      toast.success(successMessage);
      setIsManagedDeleteDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('records.toasts.managedUpdateFailed'),
      );
    }
  };

  const managedDeleteTitle =
    managedMetadata?.managedBy === 'autoPark'
      ? t('records.managedDelete.disableParkingTitle')
      : managedMetadata?.managedBy === 'autoEns'
        ? t('records.managedDelete.disableAutoEnsTitle')
        : t('records.managedDelete.disableForwardingTitle');

  const managedDeleteDescription =
    managedMetadata?.managedBy === 'autoPark'
      ? t('records.managedDelete.disableParkingDescription')
      : managedMetadata?.managedBy === 'autoEns'
        ? t('records.managedDelete.disableAutoEnsDescription')
        : t('records.managedDelete.disableForwardingDescription');

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
          <AlertDialogContent
            className="bg-zinc-950 border-zinc-800"
            data-testid="dnsManagement.records.managed-delete.dialog"
          >
            <AlertDialogHeader>
              <AlertDialogTitle>{managedDeleteTitle}</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2 text-zinc-400">
                <p>{managedDeleteDescription}</p>
                {managedMetadata?.managedBy === 'autoPark' &&
                  isForwardingEnabled && (
                    <p className="text-amber-500">
                      {t('records.managedDelete.parkingDisablesForwarding')}
                    </p>
                  )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                data-testid="dnsManagement.records.managed-delete.cancel"
                disabled={updateDomainPreferencesAndConfig.isPending}
              >
                {tCommon('actions.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                data-testid="dnsManagement.records.managed-delete.confirm"
                onClick={(event) => {
                  event.preventDefault();
                  void handleManagedDelete();
                }}
                disabled={updateDomainPreferencesAndConfig.isPending}
              >
                {updateDomainPreferencesAndConfig.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />{' '}
                    {t('records.managedDelete.disabling')}
                  </>
                ) : (
                  tCommon('actions.disable')
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  data-testid={`dnsManagement.records.edit.${record.id}`}
                />
              }
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('records.table.editRecordTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid={`dnsManagement.records.delete.${record.id}`}
              />
            }
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
              {isManagedRecord
                ? t('records.table.disableManagedRecordTooltip')
                : t('records.table.deleteRecordTooltip')}
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
            <p>{t('records.table.copyRecordTooltip')}</p>
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
            <p>{t('records.table.refreshRecordTooltip')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
