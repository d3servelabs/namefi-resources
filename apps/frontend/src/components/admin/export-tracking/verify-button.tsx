'use client';

import { useTRPC } from '@/lib/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckIcon, MailIcon, XIcon } from 'lucide-react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
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
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import { PermissionGate } from '@/components/access/PermissionGate';
import { Permission } from '@namefi-astra/utils/permissions';

type ExportTrackingRecord = {
  id: string;
  normalizedDomainName: string;
  status: string;
  isActive: boolean;
  adminVerifiedAt: Date | null;
  nftBurnedAt: Date | null;
  pendingExportEmailSentAt: Date | null;
  failedExportEmailSentAt: Date | null;
  completedExportEmailSentAt: Date | null;
};

type VerifyButtonProps = {
  record: ExportTrackingRecord;
  /**
   * Optional test-id root for this row's action group. Callers (the table cells
   * / mobile card) pass a per-row id so each row's actions are individually
   * targetable; children derive their ids from it.
   */
  'data-testid'?: string;
};

type ExportTrackingEmailType = 'pending' | 'failed' | 'complete';

const getEmailTypeForStatus = (
  status: string,
): ExportTrackingEmailType | null => {
  if (status === 'PENDING_TRANSFER' || status === 'TRANSFER_PERIOD') {
    return 'pending';
  }

  if (status === 'TRANSFER_FAILED') {
    return 'failed';
  }

  if (status === 'TRANSFER_COMPLETED' || status === 'NEEDS_ADMIN_REVIEW') {
    return 'complete';
  }

  return null;
};

export function VerifyButton({
  record,
  'data-testid': testId = 'admin.export-tracking.row.actions',
}: VerifyButtonProps) {
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

  // Approve / Resolve are only valid on active (non-terminal) rows. Email
  // resends remain valid on terminal rows for admin support purposes.
  const canApprove =
    record.isActive &&
    !record.nftBurnedAt &&
    !record.adminVerifiedAt &&
    record.status === 'NEEDS_ADMIN_REVIEW';

  const canResolve =
    record.isActive &&
    !record.nftBurnedAt &&
    record.status === 'NEEDS_ADMIN_REVIEW';

  const emailType = getEmailTypeForStatus(record.status);
  const emailAlreadySent =
    emailType === 'pending'
      ? Boolean(record.pendingExportEmailSentAt)
      : emailType === 'failed'
        ? Boolean(record.failedExportEmailSentAt)
        : emailType === 'complete'
          ? Boolean(record.completedExportEmailSentAt)
          : false;

  const emailLabels: Record<
    NonNullable<typeof emailType>,
    {
      short: string;
      dialogTitle: string;
      dialogDescription: string;
    }
  > = {
    pending: {
      short: 'Pending Email',
      dialogTitle: 'Pending Export Email',
      dialogDescription:
        'This will send the pending export notice to the user for:',
    },
    failed: {
      short: 'Failed Email',
      dialogTitle: 'Failed Export Email',
      dialogDescription:
        'This will send the export-did-not-complete notice to the user for:',
    },
    complete: {
      short: 'Completion Email',
      dialogTitle: 'Export Completion Email',
      dialogDescription:
        'This will send the export completion notice to the user for:',
    },
  };

  const emailLabel = emailType ? emailLabels[emailType] : undefined;
  const emailActionText = emailLabel
    ? `${emailAlreadySent ? 'Resend' : 'Send'} ${emailLabel.short}`
    : '';
  const emailDialogTitle = emailLabel
    ? `${emailAlreadySent ? 'Resend' : 'Send'} ${emailLabel.dialogTitle}`
    : '';
  const emailDialogDescription = emailLabel
    ? emailAlreadySent
      ? emailLabel.dialogDescription.replace('will send', 'will resend')
      : emailLabel.dialogDescription
    : '';

  const hasAction = canApprove || canResolve || emailType !== null;

  if (!hasAction) {
    if (!record.isActive || record.adminVerifiedAt) {
      return (
        <Badge
          variant="outline"
          className="text-green-600 border-green-600"
          data-testid={`${testId}.verified`}
        >
          <CheckIcon className="h-3 w-3 me-1" />
          Verified
        </Badge>
      );
    }

    return (
      <span
        className="text-xs text-muted-foreground"
        data-testid={`${testId}.none`}
      >
        -
      </span>
    );
  }

  return (
    <PermissionGate permissions={[Permission.WRITE_NFT]}>
      <div className="flex items-center gap-2" data-testid={testId}>
        {canApprove && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  size="sm"
                  variant="outline"
                  data-testid={`${testId}.approve-button`}
                />
              }
            >
              <CheckIcon className="h-4 w-4 me-1" />
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
              render={
                <Button
                  size="sm"
                  variant="outline"
                  className="px-2"
                  data-testid={`${testId}.resolve-button`}
                />
              }
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
              render={
                <Button
                  size="sm"
                  variant="outline"
                  className="px-2"
                  data-testid={`${testId}.send-email-button`}
                />
              }
            >
              <MailIcon className="h-4 w-4 me-1" />
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
