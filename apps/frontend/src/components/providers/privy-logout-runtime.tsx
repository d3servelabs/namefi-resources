'use client';

import {
  type AuthLogoutRequest,
  usePrivyRuntimeLogout,
} from './privy-logout-context';
import { useEffect, useRef } from 'react';

type PrivyLogoutRuntimeProps = {
  request: AuthLogoutRequest | null;
  onTriggered: (requestId: number, error?: unknown) => void;
};

export function PrivyLogoutRuntime({
  request,
  onTriggered,
}: PrivyLogoutRuntimeProps) {
  return (
    <PrivyLogoutRuntimeInner request={request} onTriggered={onTriggered} />
  );
}

function PrivyLogoutRuntimeInner({
  request,
  onTriggered,
}: PrivyLogoutRuntimeProps) {
  const settledRequestIdsRef = useRef(new Set<number>());
  const lastHandledRequestId = useRef(0);
  const requestLogout = usePrivyRuntimeLogout();

  useEffect(() => {
    if (!request || request.id <= 0) return;
    if (lastHandledRequestId.current === request.id) return;
    if (!requestLogout) return;

    lastHandledRequestId.current = request.id;
    void requestLogout({ callbacks: request.callbacks })
      .then(() => {
        if (!settledRequestIdsRef.current.has(request.id)) {
          settledRequestIdsRef.current.add(request.id);
          onTriggered(request.id);
        }
      })
      .catch((error) => {
        if (!settledRequestIdsRef.current.has(request.id)) {
          settledRequestIdsRef.current.add(request.id);
          onTriggered(request.id, error);
        }
      });
  }, [onTriggered, request, requestLogout]);

  return null;
}
