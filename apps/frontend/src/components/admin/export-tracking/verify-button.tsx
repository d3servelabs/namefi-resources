'use client';

import { useTRPC } from '@/lib/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/shadcn/alert-dialog';
import { PermissionGate } from '@/components/access/PermissionGate';
import { Permission } from '@namefi-astra/utils';

type ExportTrackingRecord = {
  id: string;
  normalizedDomainName: string;
  status: string;
  adminVerifiedAt: Date | null;
  nftBurnedAt: Date | null;
};

type VerifyButtonProps = {
  record: ExportTrackingRecord;
};

export function VerifyButton({ record }: VerifyButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const verifyMutation = useMutation(
    trpc.admin.verifyExportTracking.mutationOptions({
      onSuccess: () => {
        toast.success('Export verified successfully');
        queryClient.invalidateQueries({
          queryKey: trpc.admin.getExportTrackingRecords.queryKey(),
        });
      },
      onError: (error) => {
        toast.error('Failed to verify export', {
          description: error.message,
        });
      },
    }),
  );

  // Already verified - show verified badge
  if (record.adminVerifiedAt) {
    return (
      <Badge variant="outline" className="text-green-600 border-green-600">
        <CheckIcon className="h-3 w-3 mr-1" />
        Verified
      </Badge>
    );
  }

  // NFT already burned - show burned badge
  if (record.nftBurnedAt) {
    return (
      <Badge variant="outline" className="text-gray-600 border-gray-600">
        Burned
      </Badge>
    );
  }

  // Only show verify button for TRANSFER_COMPLETED status
  if (record.status !== 'TRANSFER_COMPLETED') {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <PermissionGate permissions={[Permission.WRITE_NFT]}>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline">
            <CheckIcon className="h-4 w-4 mr-1" />
            Verify
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Export</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the export as admin-verified, allowing the NFT to
              be burned. Are you sure you want to verify the export for:
              <br />
              <strong className="text-foreground">
                {record.normalizedDomainName}
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => verifyMutation.mutate({ id: record.id })}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? 'Verifying...' : 'Verify Export'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PermissionGate>
  );
}
