'use client';

import { Permission } from '@namefi-astra/utils/permissions';
import { PermissionGate } from '@/components/access/PermissionGate';
import { AdminGuard } from '@/components/admin/admin-guard';
import { AdminAiCreditAwards } from '@/components/admin/ai-credit-awards';
import { PageShell } from '@/components/page-shell';

export default function AdminAiCreditsPage() {
  return (
    <AdminGuard accessDeniedMessage="You are not an admin.">
      <PermissionGate
        permissions={[Permission.READ_AI_CREDITS, Permission.WRITE_AI_CREDITS]}
        permissionsMode="some"
        loadingFallback={null}
      >
        <AdminAiCreditAwards />
      </PermissionGate>
      <PermissionGate
        gateMode="inverted"
        permissions={[Permission.READ_AI_CREDITS, Permission.WRITE_AI_CREDITS]}
        permissionsMode="some"
        loadingFallback={null}
      >
        <PageShell padding="admin">
          <div className="text-muted-foreground py-8 text-center">
            You do not have permission to access this page.
          </div>
        </PageShell>
      </PermissionGate>
    </AdminGuard>
  );
}
