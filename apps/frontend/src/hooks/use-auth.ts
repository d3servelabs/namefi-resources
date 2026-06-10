import { useTRPC } from '@/lib/trpc';
import {
  usePrivy,
  useLogin as usePrivyLogin,
  useLogout as usePrivyLogout,
  type LoginModalOptions,
  type User as PrivyUser,
} from '@privy-io/react-auth';
import { useQuery, type AnyUseQueryOptions } from '@tanstack/react-query';
import { useMemo } from 'react';
import { privyStorageToPrivyCustomMetadata } from '@namefi-astra/common/privy-custom-metadata';
import { useEmailPrompt } from './use-email-prompt';
import { useCartContext } from '@/components/providers/cart';
import { usePreAuthSignals } from '@/components/providers/pre-auth-signals';
import { TRPCClientError } from '@trpc/client';
import { useSkipAuth, SKIP_AUTH_MOCK_USER } from './use-skip-auth';
import { useConsentIdentify } from './use-consent-identify';
import { useMockPrivy } from '@/lib/mock/privy';

type LoginCallbacks = Parameters<typeof usePrivyLogin>[0];
type LogoutCallbacks = Parameters<typeof usePrivyLogout>[0];

export function useAuth() {
  const {
    authenticated,
    ready,
    originalPrivyUser,
    isSkipAuthActive,
    definitelyNotAuthenticated,
    canPrefetchOrShouldFetch,
    isPrefetch,
  } = useAuthenticatedQueryState();

  const trpc = useTRPC();

  const userQuery = useQuery(
    handlePrefetchQueryKey(
      isPrefetch,
      trpc.users.getUser.queryOptions(undefined, {
        enabled: canPrefetchOrShouldFetch,
        retry(failureCount, error) {
          if (definitelyNotAuthenticated || failureCount > 2) {
            return false;
          }
          if (
            error instanceof TRPCClientError &&
            error.data?.code === 'UNAUTHORIZED'
          ) {
            return false;
          }
          return true;
        },
        trpc: { context: { skipBatch: true } },
      }),
    ),
  );

  const impersonation = useQuery(
    handlePrefetchQueryKey(
      isPrefetch,
      trpc.users.getImpersonationStatus.queryOptions(undefined, {
        enabled: canPrefetchOrShouldFetch,
        retry(failureCount, error) {
          if (definitelyNotAuthenticated || failureCount > 1) {
            return false;
          }
          if (
            error instanceof TRPCClientError &&
            error.data?.code === 'UNAUTHORIZED'
          ) {
            return false;
          }
          return failureCount < 3;
        },
        staleTime: 15_000,
        refetchInterval: 30_000,
        trpc: { context: { skipBatch: true } },
      }),
    ),
  );

  const impersonationTargetPrivyUser = impersonation.data?.impersonating
    ? impersonation.data.targetPrivyUser
    : null;
  const privyUser: PrivyUser | null = impersonationTargetPrivyUser
    ? (impersonationTargetPrivyUser as unknown as PrivyUser)
    : (originalPrivyUser as unknown as PrivyUser);

  const privyUserWithCustomMetadata = useMemo(() => {
    return {
      ...privyUser,
      customMetadata: privyStorageToPrivyCustomMetadata.parse(
        privyUser?.customMetadata,
      ),
    };
  }, [privyUser]);

  useConsentIdentify({
    ready,
    authenticated,
    userId: userQuery.data?.id,
  });

  if (isSkipAuthActive) {
    const mockUser = {
      id: SKIP_AUTH_MOCK_USER.id,
      privyUserId: SKIP_AUTH_MOCK_USER.privyUserId,
      primaryEmail: SKIP_AUTH_MOCK_USER.email,
      displayName: 'Skip Auth Test User',
      mainWalletAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Mock PrivyUser with all required properties to prevent runtime crashes
    // in components that access wallet, linkedAccounts, phone, or google fields
    const mockPrivyUser = {
      id: SKIP_AUTH_MOCK_USER.privyUserId,
      email: { address: SKIP_AUTH_MOCK_USER.email },
      customMetadata: privyStorageToPrivyCustomMetadata.parse(undefined),
      // Required properties to prevent crashes in user-avatar.tsx, payment-methods-manager.tsx,
      // use-user-wallet-addresses.ts, and contact-accounts.tsx
      wallet: null,
      linkedAccounts: [] as unknown[],
      phone: null,
      google: null,
    };
    return {
      ready: true,
      isAuthenticated: true,
      isImpersonating: false,
      isLoading: false,
      isImpersonationLoading: false,
      isSkipAuthActive: true,
      user: mockUser as any,
      privyUser: mockPrivyUser as any,
      rawPrivyUser: mockPrivyUser as any,
      impersonation: {
        originalPrivyUser: null,
        targetPrivyUser: null,
        status: null,
        refetchStatus: async () => undefined,
      },
    };
  }

  return {
    ready,
    isAuthenticated: ready && authenticated && !!userQuery.data?.privyUserId,
    isImpersonating: Boolean(impersonation.data?.impersonating),
    isLoading: !ready || userQuery.isLoading,
    isImpersonationLoading: impersonation.isLoading,
    isSkipAuthActive: false,
    user: ready && authenticated ? userQuery.data : undefined,
    privyUser: privyUserWithCustomMetadata,
    rawPrivyUser: privyUser,
    impersonation: {
      originalPrivyUser,
      targetPrivyUser: impersonationTargetPrivyUser,
      status: impersonation.data,
      refetchStatus: impersonation.refetch,
    },
  };
}

export function useMyPermissions() {
  const { definitelyNotAuthenticated, canPrefetchOrShouldFetch, isPrefetch } =
    useAuthenticatedQueryState();

  const trpc = useTRPC();

  return useQuery(
    handlePrefetchQueryKey(
      isPrefetch,
      trpc.users.getMyPermissions.queryOptions(void 0, {
        enabled: canPrefetchOrShouldFetch,
        retry(failureCount, error) {
          if (definitelyNotAuthenticated || failureCount > 1) {
            return false;
          }
          if (
            error instanceof TRPCClientError &&
            error.data?.code === 'UNAUTHORIZED'
          ) {
            return false;
          }
          return failureCount < 3;
        },
        staleTime: 60_000,
        trpc: { context: { skipBatch: true } },
      }),
    ),
  );
}

function useAuthenticatedQueryState() {
  const mockPrivy = useMockPrivy();
  const privy = usePrivy();
  const { authenticated, ready, user: originalPrivyUser } = mockPrivy ?? privy;
  const { isSkipAuthActive } = useSkipAuth();

  const definitelyNotAuthenticated = useMemo(() => {
    return ready && !authenticated;
  }, [authenticated, ready]);

  // Disable query when skip-auth is active to avoid unnecessary UNAUTHORIZED traffic
  const canPrefetchOrShouldFetch =
    !definitelyNotAuthenticated && !isSkipAuthActive;
  const isPrefetch = canPrefetchOrShouldFetch && !ready;

  return {
    authenticated,
    ready,
    originalPrivyUser,
    isSkipAuthActive,
    definitelyNotAuthenticated,
    canPrefetchOrShouldFetch,
    isPrefetch,
  };
}

export function useLogin(callbacks?: LoginCallbacks) {
  const { showEmailPrompt } = useEmailPrompt();
  const { stagePreAuthAugmentations } = usePreAuthSignals();

  const combinedCallbacks = useMemo(() => {
    const loginCallbacks: LoginCallbacks = {
      onComplete: async (params) => {
        if (!params.user.email?.address) {
          showEmailPrompt();
        }

        // Stage any one-time augmentations derived from pre-auth signals
        stagePreAuthAugmentations();

        if (callbacks?.onComplete) {
          callbacks.onComplete(params);
        }
      },
      onError: (error) => {
        if (callbacks?.onError) {
          callbacks.onError(error);
        }
      },
    };
    return loginCallbacks;
  }, [showEmailPrompt, callbacks, stagePreAuthAugmentations]);

  const { login: privyLogin } = usePrivyLogin(combinedCallbacks);

  const login = useMemo(() => {
    return (options?: LoginModalOptions) => {
      privyLogin({
        loginMethods: ['email', 'wallet'],
        ...options,
      });
    };
  }, [privyLogin]);

  return { login };
}

export function useLogout(callbacks?: LogoutCallbacks) {
  const { clearLocalCart } = useCartContext();

  const combinedCallbacks = useMemo(
    () => ({
      onSuccess: () => {
        clearLocalCart();

        callbacks?.onSuccess?.();
      },
    }),
    [clearLocalCart, callbacks],
  );

  const { logout } = usePrivyLogout(combinedCallbacks);

  return { logout };
}

/**
 * This extends the query key
 */
function extendTrpcQueryKey<Q extends AnyUseQueryOptions>(
  keys: unknown[],
  query: Q,
): Q {
  const queryKey: unknown[] | undefined = query.queryKey
    ? [...query.queryKey]
    : undefined;
  if (keys.length && queryKey) {
    queryKey.push(...keys);
  }
  return {
    ...query,
    queryKey,
  };
}

function handlePrefetchQueryKey<Q extends AnyUseQueryOptions>(
  isPrefetch: boolean,
  query: Q,
): Q {
  return extendTrpcQueryKey<Q>(isPrefetch ? [{ mode: 'prefetch' }] : [], query);
}
