import type { Metadata } from 'next';
import { AdminGuard } from '@/components/admin/admin-guard';
import { MlsSellersDirectory } from '@/components/mls/mls-sellers-directory';

export const metadata: Metadata = {
  title: 'Twitter Users | Namefi Feed',
  description:
    'Rank, filter, and export Twitter users who post domains for sale.',
};

export default function MlsTwitterUsersPage() {
  return (
    <AdminGuard accessDeniedMessage="Admin access is required for the Twitter users index.">
      <MlsSellersDirectory />
    </AdminGuard>
  );
}
