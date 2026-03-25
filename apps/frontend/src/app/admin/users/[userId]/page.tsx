'use client';

import { PermissionGate } from '@/components/access/PermissionGate';
import { withAdminGuard } from '@/components/admin/admin-guard';
import { AdminUserDetailsPageContent } from '@/components/admin/user-details';
import { PageShell } from '@/components/page-shell';
import { Permission } from '@namefi-astra/utils/permissions';
import { useParams } from 'next/navigation';

export default withAdminGuard(function AdminUserDetailsPage() {
  const params = useParams<{ userId: string }>();
  const userId = typeof params.userId === 'string' ? params.userId : '';

  return (
    <PermissionGate permissions={[Permission.READ_USERS]}>
      <PageShell padding="admin">
        <AdminUserDetailsPageContent userId={userId} />
      </PageShell>
    </PermissionGate>
  );
});
