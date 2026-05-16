'use client';

import { Permission } from '@namefi-astra/utils/permissions';
import { withAdminGuard } from '@/components/admin/admin-guard';
import { PermissionGate } from '@/components/access/PermissionGate';
import { NotificationComposer } from '@/components/admin/notifications/notification-composer';
import { PageShell } from '@/components/page-shell';

export default withAdminGuard(function AdminNotificationsPage() {
  return (
    <PageShell padding="admin">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Send Notification</h1>
        <p className="text-muted-foreground">
          Compose an in-app notification and send it to specific users or to
          every user.
        </p>
      </div>

      <PermissionGate
        permissions={[Permission.WRITE_NOTIFICATIONS]}
        permissionsMode="some"
      >
        <NotificationComposer />
      </PermissionGate>
      <PermissionGate
        permissions={[Permission.WRITE_NOTIFICATIONS]}
        permissionsMode="some"
        gateMode="inverted"
      >
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          You don't have permission to send notifications. Ask an administrator
          to grant you the{' '}
          <code className="font-mono">NOTIFICATIONS;;WRITE</code> permission.
        </div>
      </PermissionGate>
    </PageShell>
  );
});
