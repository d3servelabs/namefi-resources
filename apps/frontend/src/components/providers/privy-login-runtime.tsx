'use client';

import type {
  AuthLoginRequest,
  AuthLoginCallbacks,
  AuthLoginSettledResult,
} from '@/components/providers/auth';
import { useAppPrivyLogin } from '@/lib/privy-login';
import { usePrivy, useToken, type PrivyEvents } from '@privy-io/react-auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEmailPrompt } from '@/hooks/use-email-prompt';
import { usePreAuthSignals } from '@/components/providers/pre-auth-signals';
import {
  getLoginAuthenticatedPrivyUserId,
  shouldTriggerPrivyLoginRequest,
} from './auth-query-policy';
import { decodePrivyAccessToken } from './privy-access-token';
import {
  type PrivyRuntimeLoginCommand,
  registerPrivyLoginCommandHandler,
} from './privy-runtime-context';

type PrivyLoginRuntimeProps = {
  request: AuthLoginRequest | null;
  onTriggered: (requestId: number, error?: unknown) => void;
  onAuthenticated: (requestId: number, result: AuthLoginSettledResult) => void;
  onFailed: (requestId: number, error: unknown) => void;
};

type LoginError = Parameters<NonNullable<AuthLoginCallbacks['onError']>>[0];
type ActiveLoginRequest = Pick<AuthLoginRequest, 'callbacks' | 'id'>;
type SdkSettleAttempt = {
  id: number;
  promise: Promise<boolean>;
};

export function PrivyLoginRuntime({
  request,
  onAuthenticated,
  onFailed,
  onTriggered,
}: PrivyLoginRuntimeProps) {
  return (
    <PrivyLoginRuntimeInner
      request={request}
      onAuthenticated={onAuthenticated}
      onFailed={onFailed}
      onTriggered={onTriggered}
    />
  );
}

export function PrivyLoginCommandBridge() {
  const [command, setCommand] = useState<PrivyRuntimeLoginCommand | null>(null);

  useEffect(() => registerPrivyLoginCommandHandler(setCommand), []);

  if (!command) return null;

  return (
    <PrivyLoginRuntimeInner
      request={command.request}
      onTriggered={(requestId, error) => {
        command.onTriggered(requestId, error);
        if (error) {
          setCommand((current) => (current === command ? null : current));
        }
      }}
      onAuthenticated={(requestId, result) => {
        command.onAuthenticated(requestId, result);
        setCommand((current) => (current === command ? null : current));
      }}
      onFailed={(requestId, error) => {
        command.onFailed(requestId, error);
        setCommand((current) => (current === command ? null : current));
      }}
    />
  );
}

function PrivyLoginRuntimeInner({
  request,
  onAuthenticated,
  onFailed,
  onTriggered,
}: PrivyLoginRuntimeProps) {
  const { showEmailPrompt } = useEmailPrompt();
  const { stagePreAuthAugmentations } = usePreAuthSignals();
  const { ready, authenticated, user } = usePrivy();
  const activeRequestRef = useRef<ActiveLoginRequest | null>(null);
  const latestAccessTokenRef = useRef<string | null>(null);
  const sdkSettleAttemptRef = useRef<SdkSettleAttempt | null>(null);
  const settleActiveRequestFromObservedAuth = useCallback(
    (
      activeRequest: ActiveLoginRequest,
      {
        accessToken,
        runtimeUser,
      }: {
        accessToken?: string | null;
        runtimeUser?: unknown;
      },
    ) => {
      if (activeRequestRef.current?.id !== activeRequest.id) return;

      const tokenPrivyUserId = accessToken
        ? decodePrivyAccessToken(accessToken).privyUserId
        : null;
      const runtimePrivyUserId = getPrivyUserId(runtimeUser);
      const privyUserId = getLoginAuthenticatedPrivyUserId({
        runtimePrivyUserId,
        tokenPrivyUserId,
      });
      if (!privyUserId) return false;

      activeRequestRef.current = null;
      onAuthenticated(activeRequest.id, { privyUserId });
      return true;
    },
    [onAuthenticated],
  );

  const tokenCallbacks = useMemo<PrivyEvents['accessToken']>(
    () => ({
      onAccessTokenGranted: ({ accessToken }) => {
        latestAccessTokenRef.current = accessToken;
        const activeRequest = activeRequestRef.current;
        if (!activeRequest) return;

        settleActiveRequestFromObservedAuth(activeRequest, {
          accessToken,
          runtimeUser: user,
        });
      },
      onAccessTokenRemoved: () => {
        latestAccessTokenRef.current = null;
      },
    }),
    [settleActiveRequestFromObservedAuth, user],
  );
  const { getAccessToken } = useToken(tokenCallbacks);

  const settleActiveRequestFromSdkState = useCallback(
    (activeRequest: ActiveLoginRequest, runtimeUser: unknown) => {
      if (sdkSettleAttemptRef.current?.id === activeRequest.id) {
        return sdkSettleAttemptRef.current.promise;
      }

      const promise = (async () => {
        const accessToken = await getAccessToken().catch(() => null);
        if (accessToken) {
          latestAccessTokenRef.current = accessToken;
        }

        return Boolean(
          settleActiveRequestFromObservedAuth(activeRequest, {
            accessToken,
            runtimeUser,
          }),
        );
      })().finally(() => {
        if (sdkSettleAttemptRef.current?.id === activeRequest.id) {
          sdkSettleAttemptRef.current = null;
        }
      });

      sdkSettleAttemptRef.current = { id: activeRequest.id, promise };
      return promise;
    },
    [getAccessToken, settleActiveRequestFromObservedAuth],
  );
  const callbacks = useMemo(() => {
    const loginCallbacks: AuthLoginCallbacks = {
      onComplete: async (params) => {
        const activeRequest = activeRequestRef.current;
        try {
          if (!params.user.email?.address) {
            showEmailPrompt();
          }

          stagePreAuthAugmentations();

          activeRequest?.callbacks?.onComplete?.(params);
        } finally {
          if (activeRequest) {
            const completed = settleActiveRequestFromObservedAuth(
              activeRequest,
              {
                accessToken: latestAccessTokenRef.current,
                runtimeUser: params.user,
              },
            );
            if (!completed) {
              await settleActiveRequestFromSdkState(activeRequest, params.user);
            }
          }
        }
      },
      onError: (error) => {
        const activeRequest = activeRequestRef.current;
        if (!activeRequest) return;

        void (async () => {
          const completed = await settleActiveRequestFromSdkState(
            activeRequest,
            user,
          );
          if (completed) return;
          if (activeRequestRef.current?.id !== activeRequest.id) return;

          activeRequestRef.current = null;
          activeRequest.callbacks?.onError?.(error);
          onFailed(activeRequest.id, error);
        })();
      },
    };

    return loginCallbacks;
  }, [
    onFailed,
    settleActiveRequestFromObservedAuth,
    settleActiveRequestFromSdkState,
    showEmailPrompt,
    stagePreAuthAugmentations,
    user,
  ]);
  const { login } = useAppPrivyLogin(callbacks);
  const lastHandledRequestId = useRef(0);

  useEffect(() => {
    if (!ready || !authenticated || !user) return;

    const activeRequest = activeRequestRef.current;
    if (!activeRequest) return;

    const completed = settleActiveRequestFromObservedAuth(activeRequest, {
      accessToken: latestAccessTokenRef.current,
      runtimeUser: user,
    });
    if (!completed) {
      void settleActiveRequestFromSdkState(activeRequest, user);
    }
  }, [
    authenticated,
    ready,
    settleActiveRequestFromObservedAuth,
    settleActiveRequestFromSdkState,
    user,
  ]);

  useEffect(() => {
    if (!request || request.id <= 0) return;
    if (
      !shouldTriggerPrivyLoginRequest({
        ready,
        requestId: request.id,
        lastHandledRequestId: lastHandledRequestId.current,
      })
    ) {
      return;
    }

    lastHandledRequestId.current = request.id;
    activeRequestRef.current = {
      id: request.id,
      callbacks: request.callbacks,
    };
    try {
      login({
        loginMethods: ['email', 'wallet'],
        ...request.options,
      });
      onTriggered(request.id);
    } catch (error) {
      activeRequestRef.current?.callbacks?.onError?.(error as LoginError);
      activeRequestRef.current = null;
      onTriggered(request.id, error);
      onFailed(request.id, error);
    }
  }, [login, onFailed, onTriggered, ready, request]);

  return null;
}

function getPrivyUserId(user: unknown | null | undefined) {
  if (!user || typeof user !== 'object') return null;

  const id = (user as { id?: unknown }).id;
  return typeof id === 'string' && id ? id : null;
}
