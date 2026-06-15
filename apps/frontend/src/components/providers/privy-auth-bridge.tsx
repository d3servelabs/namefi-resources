'use client';

import { useAuthContext } from '@/components/providers/auth';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useId, useLayoutEffect } from 'react';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function PrivyAuthBridge() {
  const runtimeId = useId();
  const { ready, authenticated, user } = usePrivy();
  const { setPrivyRuntimeState, clearPrivyRuntimeState } = useAuthContext();

  useIsomorphicLayoutEffect(() => {
    setPrivyRuntimeState({
      id: runtimeId,
      ready,
      authenticated,
      user: user ?? null,
    });

    return () => {
      clearPrivyRuntimeState(runtimeId);
    };
  }, [
    authenticated,
    clearPrivyRuntimeState,
    ready,
    runtimeId,
    setPrivyRuntimeState,
    user,
  ]);

  return null;
}
