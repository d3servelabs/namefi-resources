'use client';

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
} from '@/components/ui/shadcn/dialog';
import { ScrollArea } from '@/components/ui/shadcn/scroll-area';
import { ChevronDown } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDialogStore } from '../stores/dialog';

export function DeleteRecordDialog() {
  const { deleteDialog, closeDeleteDialog } = useDialogStore();

  const [isOpen, setIsOpen] = useState(true);

  const { records } = deleteDialog;

  const recordCount = records.length;

  const handleDelete = useCallback(() => {
    try {
      // Here you would implement the actual delete functionality
      console.log('Deleting records:', records);

      // Call the callback with the action and data
      closeDeleteDialog('delete', {
        success: true,
        message: `Successfully deleted ${recordCount} record(s)`,
        originalRecords: records,
        updatedRecords: [],
      });
    } catch (error) {
      console.error('Error deleting records:', error);

      // Call the callback with error information
      closeDeleteDialog('delete', {
        success: false,
        message: `Failed to delete record(s): ${error}`,
        originalRecords: records,
        updatedRecords: [],
      });
    }
  }, [records, closeDeleteDialog, recordCount]);

  const handleCancel = useCallback(() => {
    closeDeleteDialog('cancel', {
      success: false,
      message: 'Delete operation cancelled',
      originalRecords: records,
      updatedRecords: [],
    });
  }, [closeDeleteDialog, records]);

  return (
    <Dialog
      open={deleteDialog.isOpen}
      onOpenChange={(open) => !open && handleCancel()}
    >
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl">Delete records?</DialogTitle>
          <DialogDescription className="text-zinc-400">
            This change may affect your domain&apos;s functionality and take
            time to update across networks.
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-zinc-950 border-zinc-800">
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="w-full"
          >
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
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Yes, delete {recordCount > 1 ? 'them' : 'it'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
