'use client';

import { Suspense } from 'react';
import { AuthRequired } from '@/components/auth-required';
import { PageShell } from '@/components/page-shell';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSkeletons } from '@/components/my-domains/loading-skeletons';
import { MyDomainsContent } from '@/components/my-domains/content';

export default function MyDomains() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!(isLoading || isAuthenticated)) {
    return <AuthRequired />;
  }

  return (
    <PageShell>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Domains</h2>
      </div>
      {isLoading ? (
        <LoadingSkeletons />
      ) : (
        <Suspense fallback={<LoadingSkeletons />}>
          <MyDomainsContent />
        </Suspense>
      )}
    </PageShell>
  );
}
