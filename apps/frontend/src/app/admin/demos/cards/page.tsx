'use client';
import { withAdminGuard } from '@/components/admin/admin-guard';

import { WalletCardDemo } from '@/components/ui/untitled/wallet-card-demo';
import { PageShell } from '@/components/page-shell';

export default withAdminGuard(function AdminPage() {
  return (
    <PageShell padding="admin">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Demo Cards</h1>
      </div>

      <WalletCardDemo />
    </PageShell>
  );
});
