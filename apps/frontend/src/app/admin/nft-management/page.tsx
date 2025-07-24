'use client';
import { useTRPC } from '@/lib/trpc';
import AdminNftManagement from '../../../components/admin/nft-management';
import { skipToken, useQuery } from '@tanstack/react-query';
import { AuthRequired } from '@/components/auth-required';
import { useAuth } from '@/hooks/use-auth';

export default function AdminNftManagementPage() {
  const trpc = useTRPC();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  skipToken;
  const { data, isLoading, error } = useQuery(
    trpc.admin.isUserAdmin.queryOptions(void 0, { enabled: isAuthenticated }),
  );

  if (isAuthLoading || isLoading) {
    return <div>Loading...</div>;
  }
  if (!isAuthenticated) {
    return <AuthRequired />;
  }
  if (error || !data) {
    return <div>{error?.message || 'You are not an admin'}</div>;
  }
  return (
    <div>
      <AdminNftManagement />
    </div>
  );
}
