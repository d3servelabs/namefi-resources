import { useTRPC, useTRPCClient } from '@/lib/trpc';
import {
  usePrivy,
  useLogin as usePrivyLogin,
  useLogout as usePrivyLogout,
  type LoginModalOptions,
  type User as PrivyUser,
} from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { privyStorageToPrivyCustomMetadata } from '@namefi-astra/common/privy-custom-metadata';
import { useEmailPrompt } from './use-email-prompt';
import { useCartContext } from '@/components/providers/cart';
import { config } from '@/lib/env';
import { usePreAuthSignals } from '@/components/providers/pre-auth-signals';
import { TRPCClientError } from '@trpc/client';
import { useConsentManager } from '@c15t/nextjs';
import { useSkipAuth, SKIP_AUTH_MOCK_USER } from './use-skip-auth';

type LoginCallbacks = Parameters<typeof usePrivyLogin>[0];
type LogoutCallbacks = Parameters<typeof usePrivyLogout>[0];

const identifiedConsentUserIds = new Set<string>();

export function useAuth() {
  const { authenticated, ready, user: originalPrivyUser } = usePrivy();
  const { isSkipAuthActive } = useSkipAuth();
  const { identifyUser } = useConsentManager();

  const trpc = useTRPC();

  const definitelyNotAuthenticated = useMemo(() => {
    return ready && !authenticated;
  }, [authenticated, ready]);

  const userQuery = useQuery(
    trpc.users.getUser.queryOptions(undefined, {
      // Disable query when skip-auth is active to avoid unnecessary UNAUTHORIZED traffic
      enabled: !definitelyNotAuthenticated && !isSkipAuthActive,
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
  );

  const impersonation = useQuery(
    trpc.users.getImpersonationStatus.queryOptions(undefined, {
      // Disable query when skip-auth is active to avoid unnecessary UNAUTHORIZED traffic
      enabled: !definitelyNotAuthenticated && !isSkipAuthActive,
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

  useEffect(() => {
    if (!ready || !authenticated) return;
    const userId = userQuery.data?.id;
    if (!userId) return;
    if (identifiedConsentUserIds.has(userId)) return;
    identifiedConsentUserIds.add(userId);
    void identifyUser({ id: userId, identityProvider: 'namefi' }).catch(() => {
      identifiedConsentUserIds.delete(userId);
    });
  }, [authenticated, identifyUser, ready, userQuery.data?.id]);

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
    },
  };
}

export function useLogin(callbacks?: LoginCallbacks) {
  const { showEmailPrompt } = useEmailPrompt();
  const { has } = useConsentManager();
  const hasMeasurement = has('measurement');
  const trpcClient = useTRPCClient();
  const { stagePreAuthAugmentations } = usePreAuthSignals();

  const combinedCallbacks = useMemo(() => {
    const loginCallbacks: LoginCallbacks = {
      onComplete: async (params) => {
        if (!params.user.email?.address) {
          showEmailPrompt();
        }

        if (hasMeasurement && config.GA_MEASUREMENT_ID) {
          try {
            const userData = await trpcClient.users.getUser.query();
            if (userData?.id) {
              window.gtag?.('config', config.GA_MEASUREMENT_ID, {
                user_id: userData.id,
                update: true,
              });
            }
          } catch {
            // Do nothing
          }
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
  }, [
    showEmailPrompt,
    callbacks,
    trpcClient,
    hasMeasurement,
    stagePreAuthAugmentations,
  ]);

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
  const { has } = useConsentManager();
  const hasMeasurement = has('measurement');

  const combinedCallbacks = useMemo(
    () => ({
      onSuccess: () => {
        clearLocalCart();

        if (hasMeasurement && config.GA_MEASUREMENT_ID) {
          window.gtag?.('config', config.GA_MEASUREMENT_ID, {
            user_id: null,
            update: true,
          });
        }

        callbacks?.onSuccess?.();
      },
    }),
    [clearLocalCart, callbacks, hasMeasurement],
  );

  const { logout } = usePrivyLogout(combinedCallbacks);

  return { logout };
}
