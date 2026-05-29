import type { Metadata } from 'next';
import { AdminGuard } from '@/components/admin/admin-guard';
import { MlsSellersDirectory } from '@/components/mls/mls-sellers-directory';

export const metadata: Metadata = {
  title: 'Users | Namefi Feed',
  description: 'Rank, filter, and export users who post domains for sale.',
};

export default function MlsFeedUsersPage() {
  return (
    <AdminGuard accessDeniedMessage="Admin access is required for the users index.">
      <MlsSellersDirectory />
    </AdminGuard>
  );
}
