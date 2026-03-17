'use client';

import { useTRPC } from '@/lib/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckIcon, XIcon } from 'lucide-react';
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
import { Permission } from '@namefi-astra/utils/permissions';

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
        toast.success('Export approved and notification sent');
        queryClient.invalidateQueries({
          queryKey: trpc.admin.getExportTrackingRecords.queryKey(),
        });
      },
      onError: (error) => {
        toast.error('Could not approve export', {
          description: error.message,
        });
      },
    }),
  );

  const resolveMutation = useMutation(
    trpc.admin.resolveExportTracking.mutationOptions({
      onSuccess: () => {
        toast.success('Export review resolved');
        queryClient.invalidateQueries({
          queryKey: trpc.admin.getExportTrackingRecords.queryKey(),
        });
      },
      onError: (error) => {
        toast.error('Could not resolve export review', {
          description: error.message,
        });
      },
    }),
  );

  const isMutating = verifyMutation.isPending || resolveMutation.isPending;

  if (record.status === 'RESOLVED') {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  if (record.status === 'NOTIFIED' || record.adminVerifiedAt) {
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

  // Only show review actions for admin-review states
  if (
    record.status !== 'NEEDS_ADMIN_REVIEW' &&
    record.status !== 'TRANSFER_COMPLETED'
  ) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <PermissionGate permissions={[Permission.WRITE_NFT]}>
      <div className="flex items-center gap-2">
        <AlertDialog>
          <AlertDialogTrigger render={<Button size="sm" variant="outline" />}>
            <CheckIcon className="h-4 w-4 mr-1" />
            Approve
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Export</AlertDialogTitle>
              <AlertDialogDescription>
                This sends the export completion notice to the user and marks
                the review as notified for:
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
                disabled={isMutating}
              >
                {verifyMutation.isPending ? 'Approving...' : 'Approve'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger
            render={<Button size="sm" variant="outline" className="px-2" />}
          >
            <XIcon className="h-4 w-4" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resolve Without Notifying</AlertDialogTitle>
              <AlertDialogDescription>
                This closes the review without sending a user notification for:
                <br />
                <strong className="text-foreground">
                  {record.normalizedDomainName}
                </strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => resolveMutation.mutate({ id: record.id })}
                disabled={isMutating}
              >
                {resolveMutation.isPending ? 'Resolving...' : 'Resolve'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGate>
  );
}
