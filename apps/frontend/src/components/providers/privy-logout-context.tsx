'use client';

import { createContext, useContext, type PropsWithChildren } from 'react';

export type AuthLogoutCallbacks = {
  onSuccess?: () => void;
};

export type AuthLogoutRequest = {
  id: number;
  callbacks?: AuthLogoutCallbacks;
};

type PrivyRuntimeLogoutRequest = {
  callbacks?: AuthLogoutCallbacks;
};

type PrivyRuntimeLogout = (
  request?: PrivyRuntimeLogoutRequest,
) => Promise<void>;

const PrivyLogoutContext = createContext<PrivyRuntimeLogout | null>(null);

export function PrivyLogoutProvider({
  children,
  requestLogout,
}: PropsWithChildren<{
  requestLogout: PrivyRuntimeLogout;
}>) {
  return (
    <PrivyLogoutContext.Provider value={requestLogout}>
      {children}
    </PrivyLogoutContext.Provider>
  );
}

export function usePrivyRuntimeLogout() {
  return useContext(PrivyLogoutContext);
}
