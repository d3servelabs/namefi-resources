import { useCallback } from 'react';
import { useAuthContext } from '@/components/providers/auth';
import type { LoginModalOptions, PrivyEvents } from '@privy-io/react-auth';

export type LoginCallbacks = PrivyEvents['login'];
export type { LoginModalOptions };

export function useLogin(callbacks?: LoginCallbacks) {
  const { requestLogin } = useAuthContext();

  const login = useCallback(
    (options?: LoginModalOptions) => {
      return requestLogin({
        callbacks,
        options,
      });
    },
    [callbacks, requestLogin],
  );

  return { login };
}
