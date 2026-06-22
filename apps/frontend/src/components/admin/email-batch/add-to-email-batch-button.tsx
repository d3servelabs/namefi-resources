'use client';

import { MailPlus, MailX } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { Permission } from '@namefi-astra/utils/permissions';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useHasPermissions } from '@/components/access/PermissionGate';
import { useEmailBatch } from './use-email-batch';

type AddToEmailBatchButtonProps = {
  email: string | null | undefined;
  userId?: string | null;
  privyUserId?: string | null;
  displayLabel?: string | null;
  className?: string;
};

/**
 * Admin-only sibling for `mailto:` links. Stages a recipient into the
 * batch composer's localStorage list, then a global floating button opens
 * the bulk-send modal (`<FloatingBatchButton />`).
 *
 * Renders nothing for non-admins or when no email is available — safe to
 * drop next to any existing mailto site without leaking the affordance.
 */
export function AddToEmailBatchButton({
  email,
  userId,
  privyUserId,
  displayLabel,
  className,
}: AddToEmailBatchButtonProps) {
  // Mirror the backend gate on `sendBulkOneOffEmail` so admins who can't
  // actually send the batch don't see the staging affordance to begin with.
  const { hasPermissions } = useHasPermissions(
    [
      Permission.VIEW_ADMIN_DASHBOARD,
      Permission.READ_USERS,
      Permission.WRITE_USERS,
    ],
    'every',
  );
  const { addRecipient, removeRecipient, hasRecipient } = useEmailBatch();
  const trimmedEmail = email?.trim() ?? '';
  const alreadyAdded = trimmedEmail ? hasRecipient(trimmedEmail) : false;

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      // Defensive: many callsites live inside clickable rows. Stop the
      // event so toggling batch membership doesn't also navigate / expand
      // a row.
      event.stopPropagation();
      if (!trimmedEmail) return;
      if (alreadyAdded) {
        removeRecipient(trimmedEmail);
        toast(`Removed ${trimmedEmail} from the email batch`);
        return;
      }
      addRecipient({
        email: trimmedEmail,
        userId: userId ?? undefined,
        privyUserId: privyUserId ?? undefined,
        displayLabel: displayLabel ?? undefined,
      });
      toast.success(`Added ${trimmedEmail} to the email batch`);
    },
    [
      addRecipient,
      removeRecipient,
      alreadyAdded,
      displayLabel,
      privyUserId,
      trimmedEmail,
      userId,
    ],
  );

  if (!hasPermissions || !trimmedEmail) {
    return null;
  }

  const Icon = alreadyAdded ? MailX : MailPlus;
  const label = alreadyAdded
    ? 'Remove from admin email batch'
    : 'Add to admin email batch — compose a bulk one-off email later';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={(triggerProps) => (
            <Button
              {...triggerProps}
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleClick}
              aria-label={label}
              data-testid={
                alreadyAdded
                  ? `admin.email-batch.add-button.remove.${trimmedEmail}`
                  : `admin.email-batch.add-button.add.${trimmedEmail}`
              }
              className={cn(
                'h-7 w-7 p-0 inline-flex items-center justify-center',
                alreadyAdded && 'text-destructive hover:text-destructive',
                className,
              )}
            >
              <Icon className="h-[14px] w-[14px]" />
            </Button>
          )}
        />
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
