'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { BellRing } from 'lucide-react';

import {
  requestBrowserNotificationPermissionForce,
  useBrowserNotificationCapability,
} from './browser-notifications';
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
        <EnableBrowserNotificationsCta />
        {isOpen && <NotificationsList initialFilter={filter} />}
      </DialogContent>
    </Dialog>
  );
}

function EnableBrowserNotificationsCta() {
  const capability = useBrowserNotificationCapability();
  if (capability !== 'default') return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-brand-primary/30 bg-brand-primary/5 px-3 py-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-2">
        <BellRing className="size-4 text-brand-primary" />
        Get OS banners when new notifications arrive.
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => void requestBrowserNotificationPermissionForce()}
      >
        Enable
      </Button>
    </div>
  );
}
