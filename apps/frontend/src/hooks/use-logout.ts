import { useCallback, useMemo } from 'react';
import { useCartContext } from '@/components/providers/cart';
import { useAuthContext } from '@/components/providers/auth';
import {
  type AuthLogoutCallbacks,
  usePrivyRuntimeLogout,
} from '@/components/providers/privy-logout-context';

export function useLogout(callbacks?: AuthLogoutCallbacks) {
  const { clearLocalCart } = useCartContext();
  const {
    beginLocalLogout,
    cancelLocalLogout,
    clearLocalAuthSession,
    requestLogout,
  } = useAuthContext();
  const requestPrivyRuntimeLogout = usePrivyRuntimeLogout();

  const completeLocalLogout = useCallback(() => {
    clearLocalAuthSession();
    clearLocalCart();

    callbacks?.onSuccess?.();
  }, [clearLocalAuthSession, clearLocalCart, callbacks]);

  const facadeCallbacks = useMemo<AuthLogoutCallbacks>(
    () => ({
      onSuccess: completeLocalLogout,
    }),
    [completeLocalLogout],
  );

  const logout = useCallback(async () => {
    beginLocalLogout();
    try {
      if (requestPrivyRuntimeLogout) {
        await requestPrivyRuntimeLogout({ callbacks: facadeCallbacks });
        return;
      }

      await requestLogout({ callbacks: facadeCallbacks });
    } catch (error) {
      cancelLocalLogout();
      throw error;
    }
  }, [
    beginLocalLogout,
    cancelLocalLogout,
    facadeCallbacks,
    requestPrivyRuntimeLogout,
    requestLogout,
  ]);

  return { logout };
}
