import { Button } from '@/components/ui/shadcn/button';
import { Card } from '@/components/ui/shadcn/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/shadcn/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcn/dialog';
import { ScrollArea } from '@/components/ui/shadcn/scroll-area';
import { useTRPC } from '@/utils/trpc';
import type { DnsRecordSelect } from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { ChevronDown, Loader2 } from 'lucide-react';
import { pluck } from 'ramda';
import { type ReactNode, useCallback } from 'react';
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
  const trpc = useTRPC();
  const { mutateAsync, isPending } = useMutation(
    trpc.dnsRecords.deleteRecords.mutationOptions(),
  );

  const recordCount = records.length;

  const queryClient = useQueryClient();
  const handleDelete = useCallback(async () => {
    try {
      console.log('Deleting records:', records);

      await mutateAsync({
        recordsIds: pluck('id', records),
        zoneName,
      });
      onDeleteSettledCallback?.('success');
      toast.success(`Successfully deleted ${recordCount} record(s)`);
      queryClient.invalidateQueries({
        queryKey: trpc.dnsRecords.getRecords.queryKey({ zoneName }),
      });
    } catch (error) {
      console.error('Error deleting records:', error);
      onDeleteSettledCallback?.('failure');
      if (error instanceof TRPCClientError) {
        if (error.data?.zodError) {
          toast.error(error.data.zodError);
        } else {
          toast.error(`Failed to delete record(s): ${error.message}`);
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
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {children ? (
        <DialogTrigger asChild={true}>{children}</DialogTrigger>
      ) : (
        false
      )}
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl">Delete records?</DialogTitle>
          <DialogDescription className="text-zinc-400">
            This change may affect your domain&apos;s functionality and take
            time to update across networks.
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-zinc-950 border-zinc-800">
          <Collapsible open={true} className="w-full">
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-900/50 transition-colors">
              <h4 className="text-sm font-medium">
                delete {recordCount} {recordCount === 1 ? 'record' : 'records'}
              </h4>
              <CollapsibleTrigger asChild={true}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-6 w-6 hover:bg-transparent"
                >
                  <ChevronDown
                    className={`h-5 w-5 text-zinc-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                  />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="px-4 pb-4">
                <div className="rounded-md border border-zinc-800 px-4 py-3 font-mono text-sm">
                  <div className="grid grid-cols-4 gap-4 text-zinc-400 border-b border-zinc-800 pb-2">
                    <div>Name</div>
                    <div>Type</div>
                    <div>Value</div>
                    <div>TTL</div>
                  </div>
                  <ScrollArea
                    className={recordCount > 3 ? 'h-40 mt-2' : 'mt-2'}
                  >
                    {records.map((record, index) => (
                      <div
                        key={record.id}
                        className={`grid grid-cols-4 gap-4 py-2 ${
                          index < records.length - 1
                            ? 'border-b border-zinc-800/50'
                            : ''
                        }`}
                      >
                        <div className="truncate">{record.name}</div>
                        <div>{record.type}</div>
                        <div className="truncate">{record.rdata}</div>
                        <div>{record.ttl}</div>
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
            variant="ghost"
            onClick={() => {
              onCancelClicked?.();
              onOpenChange?.(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />{' '}
                <span>Deleting...</span>
              </>
            ) : (
              `Yes, delete ${recordCount > 1 ? 'them' : 'it'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
