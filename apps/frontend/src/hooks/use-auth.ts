import { useTRPC, useTRPCClient } from '@/lib/trpc';
import {
  usePrivy,
  useLogin as usePrivyLogin,
  useLogout as usePrivyLogout,
  type LoginModalOptions,
  type User as PrivyUser,
} from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { privyStorageToPrivyCustomMetadata } from '@namefi-astra/backend/trpc/types';
import { useEmailPrompt } from './use-email-prompt';
import { useCartContext } from '@/components/providers/cart';
import { config } from '@/lib/env';
import { useCookieConsent } from '@/components/providers/cookie-consent';
import { usePreAuthSignals } from '@/components/providers/pre-auth-signals';

type LoginCallbacks = Parameters<typeof usePrivyLogin>[0];
type LogoutCallbacks = Parameters<typeof usePrivyLogout>[0];

export function useAuth() {
  const { authenticated, ready, user: originalPrivyUser } = usePrivy();

  const trpc = useTRPC();

  const userQuery = useQuery(
    trpc.users.getUser.queryOptions(undefined, {
      enabled: authenticated,
    }),
  );

  const impersonation = useQuery(
    trpc.users.getImpersonationStatus.queryOptions(undefined, {
      enabled: authenticated,
      staleTime: 15_000,
      refetchInterval: 30_000,
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

  return {
    ready,
    isAuthenticated: ready && authenticated && !!userQuery.data?.privyUserId,
    isImpersonating: Boolean(impersonation.data?.impersonating),
    isLoading: !ready || userQuery.isLoading || impersonation.isLoading,
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
  const { consent } = useCookieConsent();
  const trpcClient = useTRPCClient();
  const { stagePreAuthAugmentations } = usePreAuthSignals();

  const combinedCallbacks = useMemo(() => {
    const loginCallbacks: LoginCallbacks = {
      onComplete: async (params) => {
        if (!params.user.email?.address) {
          showEmailPrompt();
        }

        if (consent === 'accepted') {
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
    consent,
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
  const { consent } = useCookieConsent();

  const combinedCallbacks = useMemo(
    () => ({
      onSuccess: () => {
        clearLocalCart();

        if (consent === 'accepted') {
          window.gtag?.('config', config.GA_MEASUREMENT_ID, {
            user_id: null,
            update: true,
          });
        }

        callbacks?.onSuccess?.();
      },
    }),
    [clearLocalCart, callbacks, consent],
  );

  const { logout } = usePrivyLogout(combinedCallbacks);

  return { logout };
}
