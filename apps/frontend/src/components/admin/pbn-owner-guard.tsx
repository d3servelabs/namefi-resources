'use client';

import { useMemo, type ReactNode } from 'react';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { AuthRequired } from '@/components/auth-required';
import { useAuth } from '@/hooks/use-auth';
import {
  Alert,
  AlertDescription,
} from '@namefi-astra/ui/components/shadcn/alert';
import { Loader2, ShieldAlert } from 'lucide-react';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { isNotNil } from 'ramda';
import { PageShell } from '@/components/page-shell';

interface PbnOwnerGuardProps {
  children: ReactNode;
  loadingMessage?: string;
  accessDeniedMessage?: string;
  pbnDomain?: NamefiNormalizedDomain;
}

export function PbnOwnerGuard({
  children,
  loadingMessage = 'Verifying Powered by Namefi access...',
  accessDeniedMessage = 'You do not have access to this domain',
  pbnDomain,
}: PbnOwnerGuardProps) {
  const trpc = useTRPC();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const checkDomain = isNotNil(pbnDomain);

  const isAnOwnerQuery = useQuery(
    trpc.pbnOwner.isUserAPoweredByNamefiOwner.queryOptions(void 0, {
      enabled: isAuthenticated,
    }),
  );

  const isAnOwner = !isAnOwnerQuery.error && isAnOwnerQuery.data?.isOwner;
  const ownerDomainsQuery = useQuery(
    trpc.pbnOwner.listOwnedDomains.queryOptions(void 0, {
      enabled: isAuthenticated && checkDomain && isAnOwnerQuery.data?.isOwner,
    }),
  );

  const isCorrectOwner = useMemo(() => {
    if (ownerDomainsQuery.error || !ownerDomainsQuery.data || !pbnDomain)
      return false;
    const ownedDomains = ownerDomainsQuery.data.map(
      (domain) => domain.normalizedDomainName,
    );
    return ownedDomains.includes(pbnDomain);
  }, [ownerDomainsQuery.error, ownerDomainsQuery.data, pbnDomain]);

  // Show loading state
  if (
    isAuthLoading ||
    isAnOwnerQuery.isLoading ||
    (checkDomain && ownerDomainsQuery.isLoading)
  ) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg">{loadingMessage}</span>
        </div>
      </div>
    );
  }

  // Show auth required if not authenticated
  if (!isAuthenticated) {
    return <AuthRequired />;
  }

  // Show access denied if not admin
  if (!isAnOwner) {
    return (
      <PageShell
        padding="admin"
        className="flex items-center justify-center min-h-[50vh]"
      >
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription className="text-base">
            {isAnOwnerQuery.error?.message || accessDeniedMessage}
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  if (checkDomain && !isCorrectOwner) {
    return (
      <PageShell
        padding="admin"
        className="flex items-center justify-center min-h-[50vh]"
      >
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription className="text-base">
            {ownerDomainsQuery.error?.message || accessDeniedMessage}
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  // Render children if admin
  return <>{children}</>;
}

// Higher-Order Component version for easier usage
export function withPbnOwnerGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    loadingMessage?: string;
    accessDeniedMessage?: string;
  },
) {
  function PbnOwnerGuardedComponent(props: P) {
    return (
      <PbnOwnerGuard
        loadingMessage={options?.loadingMessage}
        accessDeniedMessage={options?.accessDeniedMessage}
      >
        <Component {...props} />
      </PbnOwnerGuard>
    );
  }

  // Set display name for better debugging
  PbnOwnerGuardedComponent.displayName = `withPbnOwnerGuard(${Component.displayName || Component.name})`;

  return PbnOwnerGuardedComponent;
}

/**
 * Example Usage:
 *
 * // Method 1: Wrapper component
 * export default function MyAdminPage() {
 *   return (
 *     <>
 *       <PbnOwnerGuard>
 *         <MyAdminContent />
 *       </PbnOwnerGuard>
 *     </>
 *   );
 * }
 *
 * // Method 2: HOC pattern
 * const MyAdminPage = withPbnOwnerGuard(MyAdminContent);
 * export default MyAdminPage;
 *
 * // Method 3: With custom messages
 * const MyAdminPage = withPbnOwnerGuard(MyAdminContent, {
 *   loadingMessage: "Loading admin panel...",
 *   accessDeniedMessage: "Admin access required for this feature"
 * });
 */
