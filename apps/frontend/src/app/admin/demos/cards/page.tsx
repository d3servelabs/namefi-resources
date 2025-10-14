'use client';
import { withAdminGuard } from '@/components/admin/admin-guard';

import { WalletCardDemo } from '@/components/ui/untitled/wallet-card-demo';

export default withAdminGuard(function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Demo Cards</h1>
      </div>

      <WalletCardDemo />
    </div>
  );
});
