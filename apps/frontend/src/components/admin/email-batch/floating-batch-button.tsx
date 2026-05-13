'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Permission } from '@namefi-astra/utils/permissions';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { useHasPermissions } from '@/components/access/PermissionGate';
import { useEmailBatch } from './use-email-batch';

// Lazy-load the heavy modal (markdown editor + iframe) so non-admin pages
// and admins with empty batches don't pay the bundle cost.
const BulkEmailModal = dynamic(
  () => import('./bulk-email-modal').then((m) => m.BulkEmailModal),
  { ssr: false },
);

/**
 * Global, fixed-position envelope button rendered in the root layout.
 * Visible only when the viewer is an admin AND the localStorage batch
 * has at least one recipient.
 */
export function FloatingBatchButton() {
  // Mirror the backend gate on `sendBulkOneOffEmail` — admins who can't
  // ultimately submit the batch shouldn't see the floating composer entry.
  const { hasPermissions } = useHasPermissions(
    [
      Permission.VIEW_ADMIN_DASHBOARD,
      Permission.READ_USERS,
      Permission.WRITE_USERS,
    ],
    'every',
  );
  const { recipients } = useEmailBatch();
  const [open, setOpen] = useState(false);

  if (!hasPermissions || recipients.length === 0) {
    return null;
  }

  const count = recipients.length;
  const label = `Open admin email batch (${count} ${count === 1 ? 'recipient' : 'recipients'})`;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <Button
                {...props}
                type="button"
                onClick={() => setOpen(true)}
                aria-label={label}
                className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg p-0"
                size="icon"
              >
                <Mail className="h-5 w-5" />
                <span
                  className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center"
                  aria-hidden="true"
                >
                  {count > 99 ? '99+' : count}
                </span>
              </Button>
            )}
          />
          <TooltipContent side="left">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {open && <BulkEmailModal open={open} onOpenChange={setOpen} />}
    </>
  );
}
