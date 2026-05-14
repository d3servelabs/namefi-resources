'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';

import { NotificationsList } from './notifications-list';
import { setNotificationsModalOpen, useNotificationsModalState } from './store';

/**
 * Single centered dialog mounted once in `Main` (see
 * `apps/frontend/src/components/main.tsx`). The list inside the dialog is
 * not rendered until the dialog opens, so the closed-state cost is just
 * the wrapper.
 */
export function NotificationsModal() {
  const { isOpen, filter } = useNotificationsModalState();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => setNotificationsModalOpen(next)}
    >
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription className="sr-only">
            Your in-app notifications. Use the controls to mark as seen,
            archive, or filter by related resource.
          </DialogDescription>
        </DialogHeader>
        {isOpen && <NotificationsList initialFilter={filter} />}
      </DialogContent>
    </Dialog>
  );
}
