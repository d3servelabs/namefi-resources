import { useTRPC } from '@/lib/trpc';
import {
  usePrivy,
  useLogin as usePrivyLogin,
  useLogout as usePrivyLogout,
  type LoginModalOptions,
} from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { privyStorageToPrivyCustomMetadata } from '@namefi-astra/backend/trpc/types';
import { useEmailPrompt } from './use-email-prompt';
import { useCartContext } from '@/components/providers/cart';

type LoginCallbacks = Parameters<typeof usePrivyLogin>[0];
type LogoutCallbacks = Parameters<typeof usePrivyLogout>[0];

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
    isAuthenticated: ready && authenticated && !!userQuery.data?.privyUserId,
    isLoading: !ready || userQuery.isLoading,
    user: ready && authenticated ? userQuery.data : undefined,
    privyUser: privyUserWithCustomMetadata,
  };
}

// Centralized login hook with configurable defaults
export function useLogin(callbacks?: LoginCallbacks) {
  const { showEmailPrompt } = useEmailPrompt();

  // Memoize the combined callbacks to call both default and user-supplied
  const combinedCallbacks = useMemo(() => {
    const loginCallbacks: LoginCallbacks = {
      onComplete: (params) => {
        // Always call default callback first
        if (!params.user.email?.address) {
          showEmailPrompt();
        }
        // Then call user-supplied callback if provided
        if (callbacks?.onComplete) {
          callbacks.onComplete(params);
        }
      },
      onError: (error) => {
        // Always call default callback first
        console.error('Login error:', error);
        // Then call user-supplied callback if provided
        if (callbacks?.onError) {
          callbacks.onError(error);
        }
      },
    };
    return loginCallbacks;
  }, [showEmailPrompt, callbacks]);

  const { login: privyLogin } = usePrivyLogin(combinedCallbacks);

  // Memoize the returned login function
  const login = useMemo(() => {
    return (options?: LoginModalOptions) => {
      privyLogin({
        loginMethods: ['email', 'wallet'], // Default login methods
        ...options, // Allow override
      });
    };
  }, [privyLogin]);

  return { login };
}

// Centralized logout hook with configurable defaults
export function useLogout(callbacks?: LogoutCallbacks) {
  const { clearLocalCart } = useCartContext();

  // Memoize the combined callbacks to call both default and user-supplied
  const combinedCallbacks = useMemo(
    () => ({
      onSuccess: () => {
        // Always call default callback first
        clearLocalCart();
        // Then call user-supplied callback if provided
        callbacks?.onSuccess?.();
      },
    }),
    [clearLocalCart, callbacks],
  );

  const { logout } = usePrivyLogout(combinedCallbacks);

  return { logout };
}
