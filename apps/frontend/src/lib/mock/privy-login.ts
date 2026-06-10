import type { LoginModalOptions, PrivyEvents } from '@privy-io/react-auth';
import { useCallback } from 'react';
import { privyMockUser, useMockPrivy } from './privy';

export type { LoginModalOptions };
export type LoginCallbacks = PrivyEvents['login'];

type MockLogin = (options?: LoginModalOptions) => void | Promise<void>;
type LoginCompleteParams = Parameters<
  NonNullable<LoginCallbacks['onComplete']>
>[0];
type LoginError = Parameters<NonNullable<LoginCallbacks['onError']>>[0];

export function useAppPrivyLogin(callbacks?: LoginCallbacks) {
  const mockPrivy = useMockPrivy();

  const login = useCallback(
    (options?: LoginModalOptions) => {
      const mockLogin = (mockPrivy as { login?: MockLogin } | null)?.login;
      const complete = () => {
        callbacks?.onComplete?.({
          user: mockPrivy?.user ?? privyMockUser,
          isNewUser: false,
          wasAlreadyAuthenticated: Boolean(mockPrivy?.authenticated),
          loginMethod: null,
          loginAccount: null,
        } satisfies LoginCompleteParams);
      };
      const fail = (error: unknown) => {
        callbacks?.onError?.(error as LoginError);
      };

      try {
        const result = mockLogin?.(options);
        void Promise.resolve(result).then(complete, fail);
      } catch (error) {
        fail(error);
      }
    },
    [callbacks, mockPrivy],
  );

  return { login };
}
