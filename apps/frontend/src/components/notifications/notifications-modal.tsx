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
import { useTheme } from 'next-themes';

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
 *
 * The DialogContent renders inside a base-ui portal at `document.body`.
 * `<html>` carries the hardcoded `dark` class and the next-themes
 * `data-theme` attribute, so theme tokens cascade through to the portal
 * via CSS variables. We also re-apply both attributes locally as a
 * belt-and-suspenders measure for any code path that bypasses
 * `<html>`-level inheritance (e.g. iframes, dev-only theme switchers).
 */
export function NotificationsModal() {
  const { isOpen, filter } = useNotificationsModalState();
  const { resolvedTheme, theme } = useTheme();
  const activeTheme = resolvedTheme ?? theme ?? 'astra';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => setNotificationsModalOpen(next)}
    >
      <DialogContent
        className="dark bg-background text-foreground sm:max-w-5xl"
        data-theme={activeTheme}
      >
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
