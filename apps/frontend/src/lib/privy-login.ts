import {
  useLogin as usePrivyLogin,
  type LoginModalOptions,
  type PrivyEvents,
} from '@privy-io/react-auth';

export type { LoginModalOptions };
export type LoginCallbacks = PrivyEvents['login'];

export function useAppPrivyLogin(callbacks?: LoginCallbacks) {
  return usePrivyLogin(callbacks);
}
