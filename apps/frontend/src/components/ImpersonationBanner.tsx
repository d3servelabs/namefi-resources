'use client';

import { useAuth } from '@/hooks/use-auth';
import dynamic from 'next/dynamic';

const ImpersonationBannerInner = dynamic(
  () => import('@/components/ImpersonationBannerInner'),
  {
    ssr: false,
  },
);

export default function ImpersonationBanner() {
  const { impersonation, isAuthenticated, isLoading } = useAuth();
  const status = impersonation.status;

  if (isLoading || !isAuthenticated || !status?.impersonating || !status.target)
    return null;

  return (
    <ImpersonationBannerInner
      refetchStatus={impersonation.refetchStatus}
      status={status}
    />
  );
}
