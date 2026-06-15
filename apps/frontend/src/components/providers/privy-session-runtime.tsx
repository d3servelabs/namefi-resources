'use client';

import { usePrivy, useToken, type PrivyEvents } from '@privy-io/react-auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { registerPrivySessionRefreshCommandHandler } from './privy-runtime-context';

type PrivySessionRuntimeProps = {
  onSettled: (hasToken: boolean) => void;
};

export function PrivySessionRuntime({ onSettled }: PrivySessionRuntimeProps) {
  return <PrivySessionRefresh onSettled={onSettled} />;
}

export function PrivySessionRefreshCommandBridge() {
  const nextCommandIdRef = useRef(0);
  const [command, setCommand] = useState<{
    id: number;
    onSettled: (hasToken: boolean) => void;
  } | null>(null);

  useEffect(
    () =>
      registerPrivySessionRefreshCommandHandler((onSettled) => {
        const id = nextCommandIdRef.current + 1;
        nextCommandIdRef.current = id;
        setCommand({ id, onSettled });
      }),
    [],
  );

  if (!command) return null;

  return (
    <PrivySessionRefresh
      key={command.id}
      onSettled={(hasToken) => {
        command.onSettled(hasToken);
        setCommand((current) => (current?.id === command.id ? null : current));
      }}
    />
  );
}

function PrivySessionRefresh({ onSettled }: PrivySessionRuntimeProps) {
  const { authenticated, ready } = usePrivy();
  const settledRef = useRef(false);

  const settle = useCallback(
    (hasToken: boolean) => {
      if (settledRef.current) return;
      settledRef.current = true;
      onSettled(hasToken);
    },
    [onSettled],
  );

  const tokenCallbacks = useMemo<PrivyEvents['accessToken']>(
    () => ({
      onAccessTokenGranted: ({ accessToken }) => {
        settle(Boolean(accessToken));
      },
      onAccessTokenRemoved: () => {
        if (ready && !authenticated) {
          settle(false);
        }
      },
    }),
    [authenticated, ready, settle],
  );
  const { getAccessToken } = useToken(tokenCallbacks);

  useEffect(() => {
    if (!ready || settledRef.current) return;

    let cancelled = false;
    void getAccessToken()
      .then((token) => {
        if (cancelled) return;
        settle(Boolean(token));
      })
      .catch(() => {
        if (!cancelled) {
          settle(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [getAccessToken, ready, settle]);

  return null;
}
