import { useTRPC } from '@/utils/trpc';
import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { privyStorageToPrivyCustomMetadata } from '@namefi-astra/backend/trpc/types';

export function useAuth() {
  const { authenticated, ready, user: privyUser } = usePrivy();

  const trpc = useTRPC();

  const userQuery = useQuery(
    trpc.users.getUser.queryOptions(undefined, {
      enabled: authenticated,
    }),
  );

  const privyUserWithCustomMetadata = useMemo(() => {
    return {
      ...privyUser,
      customMetadata: privyStorageToPrivyCustomMetadata.parse(
        privyUser?.customMetadata,
      ),
    };
  }, [privyUser]);

  return {
    isAuthenticated: authenticated && !!userQuery.data?.privyUserId,
    isLoading: !ready || userQuery.isLoading,
    user: authenticated ? userQuery.data : undefined,
    privyUser: privyUserWithCustomMetadata,
  };
}
