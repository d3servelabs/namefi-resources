'use client';

import { useTRPC } from '@/lib/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckIcon, MailIcon, XIcon } from 'lucide-react';
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
  pendingNotifiedAt: Date | null;
  userNotified: boolean;
};

type VerifyButtonProps = {
  record: ExportTrackingRecord;
};

type ExportTrackingEmailType = 'pending' | 'complete';

const getEmailTypeForStatus = (
  status: string,
): ExportTrackingEmailType | null => {
  if (status === 'PENDING_TRANSFER' || status === 'TRANSFER_PERIOD') {
    return 'pending';
  }

  if (
    status === 'TRANSFER_COMPLETED' ||
    status === 'NEEDS_ADMIN_REVIEW' ||
    status === 'NOTIFIED' ||
    status === 'RESOLVED'
  ) {
    return 'complete';
  }

  return null;
};

export function VerifyButton({ record }: VerifyButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const verifyMutation = useMutation(
    trpc.admin.exportTracking.verifyExportTracking.mutationOptions({
      onSuccess: () => {
        toast.success('Export approved and notification sent');
        queryClient.invalidateQueries({
          queryKey:
            trpc.admin.exportTracking.getExportTrackingRecords.queryKey(),
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
    trpc.admin.exportTracking.resolveExportTracking.mutationOptions({
      onSuccess: () => {
        toast.success('Export review resolved');
        queryClient.invalidateQueries({
          queryKey:
            trpc.admin.exportTracking.getExportTrackingRecords.queryKey(),
        });
      },
      onError: (error) => {
        toast.error('Could not resolve export review', {
          description: error.message,
        });
      },
    }),
  );

  const sendEmailMutation = useMutation(
    trpc.admin.exportTracking.sendExportTrackingEmail.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries({
          queryKey:
            trpc.admin.exportTracking.getExportTrackingRecords.queryKey(),
        });
      },
      onError: (error) => {
        toast.error('Could not send export email', {
          description: error.message,
        });
      },
    }),
  );

  const isMutating =
    verifyMutation.isPending ||
    resolveMutation.isPending ||
    sendEmailMutation.isPending;

  const canApprove =
    !record.nftBurnedAt &&
    !record.adminVerifiedAt &&
    (record.status === 'NEEDS_ADMIN_REVIEW' ||
      record.status === 'TRANSFER_COMPLETED');

  const canResolve =
    !record.nftBurnedAt &&
    (record.status === 'NEEDS_ADMIN_REVIEW' ||
      record.status === 'TRANSFER_COMPLETED' ||
      record.status === 'NOTIFIED');

  const emailType = getEmailTypeForStatus(record.status);
  const emailAlreadySent =
    emailType === 'pending'
      ? Boolean(record.pendingNotifiedAt)
      : emailType === 'complete'
        ? Boolean(record.userNotified)
        : false;

  const emailActionText =
    emailType === 'pending'
      ? emailAlreadySent
        ? 'Resend Pending Email'
        : 'Send Pending Email'
      : emailAlreadySent
        ? 'Resend Completion Email'
        : 'Send Completion Email';

  const emailDialogTitle =
    emailType === 'pending'
      ? emailAlreadySent
        ? 'Resend Pending Export Email'
        : 'Send Pending Export Email'
      : emailAlreadySent
        ? 'Resend Export Completion Email'
        : 'Send Export Completion Email';

  const emailDialogDescription =
    emailType === 'pending'
      ? emailAlreadySent
        ? 'This will resend the pending export notice to the user for:'
        : 'This will send the pending export notice to the user for:'
      : emailAlreadySent
        ? 'This will resend the export completion notice to the user for:'
        : 'This will send the export completion notice to the user for:';

  const hasAction = canApprove || canResolve || emailType !== null;

  if (!hasAction) {
    if (record.status === 'NOTIFIED' || record.adminVerifiedAt) {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckIcon className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    }

    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <PermissionGate permissions={[Permission.WRITE_NFT]}>
      <div className="flex items-center gap-2">
        {canApprove && (
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
        )}

        {canResolve && (
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
                  This closes the review without sending a user notification
                  for:
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
        )}

        {emailType && (
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button size="sm" variant="outline" className="px-2" />}
            >
              <MailIcon className="h-4 w-4 mr-1" />
              {emailAlreadySent ? 'Resend' : 'Send Email'}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{emailDialogTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {emailDialogDescription}
                  <br />
                  <strong className="text-foreground">
                    {record.normalizedDomainName}
                  </strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    sendEmailMutation.mutate({
                      id: record.id,
                      forceResend: emailAlreadySent,
                    })
                  }
                  disabled={isMutating}
                >
                  {sendEmailMutation.isPending ? 'Sending...' : emailActionText}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </PermissionGate>
  );
}
