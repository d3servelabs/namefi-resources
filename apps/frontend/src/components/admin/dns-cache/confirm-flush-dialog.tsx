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
import { AlertCircle } from 'lucide-react';

interface ConfirmFlushDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  serverNames: string[];
  cacheSize?: number;
  isFlushingAll?: boolean;
}

export function ConfirmFlushDialog({
  open,
  onOpenChange,
  onConfirm,
  serverNames,
  cacheSize,
  isFlushingAll = false,
}: ConfirmFlushDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Confirm Cache Flush
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              {isFlushingAll
                ? 'This will flush ALL cached entries on the following servers:'
                : 'This will flush cached entries on the following servers:'}
            </p>
            <ul className="list-disc list-inside pl-2">
              {serverNames.map((name) => (
                <li key={name} className="font-medium">
                  {name}
                </li>
              ))}
            </ul>
            {cacheSize !== undefined && cacheSize > 0 && (
              <p className="text-sm">
                Current cache size:{' '}
                <span className="font-semibold">{cacheSize}</span> entries
              </p>
            )}
            <p className="font-semibold">This action cannot be undone.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            Yes, Flush Cache
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
