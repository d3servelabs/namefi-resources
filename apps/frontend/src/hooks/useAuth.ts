import { useTRPC } from '@/utils/trpc';
import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';

export function useAuth() {
  const {
    authenticated: privyAuthenticated,
    ready,
    user: privyUser,
  } = usePrivy();
  const trpc = useTRPC();

  const userQuery = useQuery({
    ...trpc.users.getUser.queryOptions(),
    enabled: !!privyAuthenticated,
  });

  return {
    isAuthenticated: privyAuthenticated && !!userQuery.data?.privyUserId,
    isLoading: !ready || userQuery.isLoading,
    user: userQuery.data,
    privyUser,
  };
}
