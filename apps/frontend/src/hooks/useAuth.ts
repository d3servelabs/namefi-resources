import { useTRPC } from '@/utils/trpc';
import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';

export function useAuth() {
  const { authenticated, ready, user: privyUser } = usePrivy();

  const trpc = useTRPC();

  const userQuery = useQuery({
    ...trpc.users.getUser.queryOptions(),
    enabled: authenticated,
  });

  return {
    isAuthenticated: authenticated && !!userQuery.data?.privyUserId,
    isLoading: !ready || userQuery.isLoading,

    user: userQuery.data,
    privyUser,
  };
}
