import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@namefi-astra/ui/components/shadcn/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { ScrollArea } from '@namefi-astra/ui/components/shadcn/scroll-area';
import { useTRPC } from '@/lib/trpc';
import type { DnsRecordSelect } from '@namefi-astra/common/contract/entity-schemas';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { ChevronDown, CircleCheck, CircleX, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { pluck } from 'ramda';
import { type ReactElement, type ReactNode, useCallback } from 'react';
import { toast } from 'sonner';

export type DeleteRecordDialogProps = {
  records: DnsRecordSelect[];
  onDeleteSettledCallback?: (status: 'success' | 'failure') => void;
  onCancelClicked?: () => void;
  zoneName: NamefiNormalizedDomain;
  isOpen: boolean;
  children?: ReactNode;
  onOpenChange?: (open: boolean) => void;
};

export const DeleteRecordDialog = ({
  records,
  onDeleteSettledCallback,
  onCancelClicked,
  zoneName,
  isOpen,
  children,
  onOpenChange,
}: DeleteRecordDialogProps) => {
  const t = useTranslations('dnsManagement');
  const tCommon = useTranslations('common');
  const trpc = useTRPC();
  const { mutateAsync, isPending } = useMutation(
    trpc.dnsRecords.deleteRecords.mutationOptions(),
  );

  const recordCount = records.length;

  const queryClient = useQueryClient();
  const handleDelete = useCallback(async () => {
    try {
      await mutateAsync({
        recordsIds: pluck('id', records),
        zoneName,
      });
      onDeleteSettledCallback?.('success');
      toast.success(t('records.toasts.deleted', { count: recordCount }));
      queryClient.invalidateQueries({
        queryKey: trpc.dnsRecords.getRecords.queryKey({ zoneName }),
      });
      toast.success(t('records.toasts.deleted', { count: recordCount }), {
        duration: 10_000,
        dismissible: true,
        icon: <CircleCheck className="h-4 w-4" />,
        richColors: true,
      });
    } catch (error) {
      console.error('Error deleting records:', error);
      onDeleteSettledCallback?.('failure');
      if (error instanceof TRPCClientError) {
        if (error.data?.zodError) {
          toast.error(error.data.zodError, {
            duration: 10_000,
            dismissible: true,
            icon: <CircleX className="h-4 w-4" />,
            richColors: true,
          });
        } else {
          toast.error(
            t('records.toasts.deleteFailed', { error: error.message }),
            {
              duration: 10_000,
              dismissible: true,
              icon: <CircleX className="h-4 w-4" />,
              richColors: true,
            },
          );
        }
      }
    }
    onOpenChange?.(false);
  }, [
    records,
    recordCount,
    mutateAsync,
    onDeleteSettledCallback,
    zoneName,
    onOpenChange,
    queryClient,
    trpc.dnsRecords.getRecords.queryKey,
    t,
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {children ? <DialogTrigger render={children as ReactElement} /> : false}
      <DialogContent
        data-testid="dnsManagement.delete.dialog"
        className={cn(
          MOBILE_BOTTOM_SHEET_DIALOG,
          'sm:max-w-[500px] bg-zinc-950 border-zinc-800',
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t('dialogs.delete.title')}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {t('dialogs.delete.description')}
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-zinc-950 border-zinc-800">
          <Collapsible open={true} className="w-full">
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-900/50 transition-colors">
              <h4 className="text-sm font-medium">
                {t('dialogs.delete.summary', { count: recordCount })}
              </h4>
              <CollapsibleTrigger
                render={
                  <Button
                    data-testid="dnsManagement.delete.toggle"
                    variant="ghost"
                    size="sm"
                    className="p-0 h-6 w-6 hover:bg-transparent"
                  />
                }
              >
                <ChevronDown
                  className={`h-5 w-5 text-zinc-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                />
                <span className="sr-only">{t('dialogs.delete.toggle')}</span>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="px-4 pb-4">
                <div className="rounded-md border border-zinc-800 px-4 py-3 font-mono text-sm">
                  <div className="grid grid-cols-4 gap-4 text-zinc-400 border-b border-zinc-800 pb-2">
                    <div>{t('dialogs.delete.columnName')}</div>
                    <div>{t('dialogs.delete.columnType')}</div>
                    <div>{t('dialogs.delete.columnValue')}</div>
                    <div>{t('dialogs.delete.columnTtl')}</div>
                  </div>
                  <ScrollArea
                    className={recordCount > 3 ? 'h-40 mt-2' : 'mt-2'}
                  >
                    {records.map((record, index) => (
                      <div
                        key={record.id}
                        data-testid={`dnsManagement.delete.row.${record.id}`}
                        className={`grid grid-cols-4 gap-4 py-2 ${
                          index < records.length - 1
                            ? 'border-b border-zinc-800/50'
                            : ''
                        }`}
                      >
                        <div
                          data-testid={`dnsManagement.delete.row.${record.id}.name`}
                          className="truncate"
                        >
                          {record.name}
                        </div>
                        <div
                          data-testid={`dnsManagement.delete.row.${record.id}.type`}
                        >
                          {record.type}
                        </div>
                        <div
                          data-testid={`dnsManagement.delete.row.${record.id}.value`}
                          className="truncate"
                        >
                          {record.rdata}
                        </div>
                        <div
                          data-testid={`dnsManagement.delete.row.${record.id}.ttl`}
                        >
                          {record.ttl}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            data-testid="dnsManagement.delete.cancel"
            variant="ghost"
            onClick={() => {
              onCancelClicked?.();
              onOpenChange?.(false);
            }}
          >
            {tCommon('actions.cancel')}
          </Button>
          <Button
            data-testid="dnsManagement.delete.confirm"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />{' '}
                <span>{t('dialogs.delete.deleting')}</span>
              </>
            ) : recordCount > 1 ? (
              t('dialogs.delete.confirmMultiple')
            ) : (
              t('dialogs.delete.confirmSingle')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
