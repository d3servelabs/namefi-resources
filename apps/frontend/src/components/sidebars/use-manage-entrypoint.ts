import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';

/**
 * Whether the bulk "Manage" entrypoint (`/manage`) is viewable for the current
 * user. The backend gates it beyond plain auth, so a signed-in user may still
 * not see it. Shared by the sidebar and the header OmniSearch so the two never
 * disagree about whether to surface `items.manage`.
 *
 * Returns `false` while the gate is loading, refetching, or errored — matching
 * the sidebar's fail-closed behavior (don't reveal the entrypoint optimistically).
 */
export function useManageEntrypointViewable(): boolean {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();
  const query = useQuery({
    ...trpc.users.getManagerPageEntrypointViewable.queryOptions(),
    enabled: !isAuthLoading && isAuthenticated,
  });

  return useMemo(() => {
    if (!isAuthenticated) return false;
    if (query.isLoading || query.isFetching || query.isError) return false;
    return query.data?.viewable ?? false;
  }, [
    isAuthenticated,
    query.data,
    query.isError,
    query.isFetching,
    query.isLoading,
  ]);
}
