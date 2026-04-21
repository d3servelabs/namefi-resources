'use client';

import type { ReactNode } from 'react';
import { useTRPC } from '@/lib/trpc';
import { skipToken, useQuery } from '@tanstack/react-query';
import { AuthRequired } from '@/components/auth-required';
import { useAuth } from '@/hooks/use-auth';
import {
  Alert,
  AlertDescription,
} from '@namefi-astra/ui/components/shadcn/alert';
import { Loader2, ShieldAlert } from 'lucide-react';
import { PageShell } from '@/components/page-shell';

interface AdminGuardProps {
  children: ReactNode;
  loadingMessage?: string;
  accessDeniedMessage?: string;
}

export function AdminGuard({
  children,
  loadingMessage = 'Verifying admin access...',
  accessDeniedMessage = 'You are not an admin',
}: AdminGuardProps) {
  const trpc = useTRPC();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const { data, isLoading, error } = useQuery(
    trpc.admin.isUserAdmin.queryOptions(void 0, {
      enabled: isAuthenticated,
      trpc: { context: { skipBatch: true } },
    }),
  );

  // Show loading state
  if (isAuthLoading || isLoading) {
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
  if (error || !data) {
    return (
      <PageShell
        padding="admin"
        className="flex items-center justify-center min-h-[50vh]"
      >
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription className="text-base">
            {error?.message || accessDeniedMessage}
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  // Render children if admin
  return <>{children}</>;
}

// Higher-Order Component version for easier usage
export function withAdminGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    loadingMessage?: string;
    accessDeniedMessage?: string;
  },
) {
  function AdminGuardedComponent(props: P) {
    return (
      <AdminGuard
        loadingMessage={options?.loadingMessage}
        accessDeniedMessage={options?.accessDeniedMessage}
      >
        <Component {...props} />
      </AdminGuard>
    );
  }

  // Set display name for better debugging
  AdminGuardedComponent.displayName = `withAdminGuard(${Component.displayName || Component.name})`;

  return AdminGuardedComponent;
}

/**
 * Example Usage:
 *
 * // Method 1: Wrapper component
 * export default function MyAdminPage() {
 *   return (
 *     <AdminGuard>
 *       <MyAdminContent />
 *     </AdminGuard>
 *   );
 * }
 *
 * // Method 2: HOC pattern
 * const MyAdminPage = withAdminGuard(MyAdminContent);
 * export default MyAdminPage;
 *
 * // Method 3: With custom messages
 * const MyAdminPage = withAdminGuard(MyAdminContent, {
 *   loadingMessage: "Loading admin panel...",
 *   accessDeniedMessage: "Admin access required for this feature"
 * });
 */
