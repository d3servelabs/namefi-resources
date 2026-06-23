import type { PropsWithChildren } from 'react';

export function SessionsProvider({ children }: PropsWithChildren) {
  return children;
}

export const PrivyRuntimeHost = SessionsProvider;
