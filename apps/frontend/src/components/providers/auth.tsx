'use client';

import { useTRPC, type AppRouterOutput } from '@/lib/trpc';
import { useMockPrivy } from '@/lib/mock/privy';
import { privyStorageToPrivyCustomMetadata } from '@namefi-astra/common/privy-custom-metadata';
import { TRPCClientError } from '@trpc/client';
import {
  useQuery,
  useQueryClient,
  type AnyUseQueryOptions,
} from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type PropsWithChildren,
} from 'react';
import { useConsentIdentify } from '@/hooks/use-consent-identify';
import { useSkipAuth, SKIP_AUTH_MOCK_USER } from '@/hooks/use-skip-auth';
import { withFallbackContactEmail } from './auth-display-profile';
import type { LoginModalOptions, PrivyEvents } from '@privy-io/react-auth';
import { TRPC_INCLUDE_PRIVY_ID_TOKEN_CONTEXT_KEY } from '@/lib/trpc-request-headers';
import {
  getAuthReadiness,
  getAuthSubjectForAppGuards,
  getImpersonationStatusRefetchInterval,
  shouldPreloadLoginRuntimeOnIntent,
  shouldUseInitialSessionSnapshotForAuthSubject,
} from './auth-query-policy';
import {
  deserializeInitialAuthSessionSnapshot,
  type SerializedInitialAuthSessionSnapshot,
} from './auth-initial-snapshot';
import { readPrivyAccessTokenCookie } from './privy-access-token';
import type { AuthLogoutRequest } from './privy-logout-context';
import {
  getPrivyLoginCommandHandler,
  getPrivyRuntimeLogoutHandler,
  getPrivySessionRefreshCommandHandler,
} from './privy-runtime-context';

export type AuthCookieSnapshot = {
  hasPrivyToken: boolean;
  hasPrivySession: boolean;
};

type UserQueryData = AppRouterOutput['users']['getUser'];
type PermissionsQueryData = AppRouterOutput['users']['getMyPermissions'];
type AuthDisplayProfile = NonNullable<UserQueryData['displayProfile']>;
type ImpersonationStatus = AppRouterOutput['users']['getImpersonationStatus'];
type InitialAuthSessionSnapshot = NonNullable<
  ReturnType<typeof deserializeInitialAuthSessionSnapshot>
>;

type PrivyRuntimeState = {
  id: string;
  ready: boolean;
  authenticated: boolean;
  user: unknown | null;
};

type PrivySessionRuntimeProps = {
  onSettled: (hasToken: boolean) => void;
};

type PrivyRuntimeHostComponent = ComponentType<PropsWithChildren>;
type PrivySessionRuntimeComponent = ComponentType<PrivySessionRuntimeProps>;
export type AuthLoginCallbacks = PrivyEvents['login'];
type AuthLoginError = Parameters<NonNullable<AuthLoginCallbacks['onError']>>[0];
export type AuthLoginRequest = {
  id: number;
  options?: LoginModalOptions;
  callbacks?: AuthLoginCallbacks;
};
export type AuthLoginSettledResult = {
  privyUserId: string;
};
type PrivyLoginRuntimeProps = {
  request: AuthLoginRequest | null;
  onTriggered: (requestId: number, error?: unknown) => void;
  onAuthenticated: (requestId: number, result: AuthLoginSettledResult) => void;
  onFailed: (requestId: number, error: unknown) => void;
};
type PrivyLoginRuntimeComponent = ComponentType<PrivyLoginRuntimeProps>;
type PrivyLogoutRuntimeProps = {
  request: AuthLogoutRequest | null;
  onTriggered: (requestId: number, error?: unknown) => void;
};
type PrivyLogoutRuntimeComponent = ComponentType<PrivyLogoutRuntimeProps>;

type AuthContextValue = {
  authReady: boolean;
  privyRuntimeReady: boolean;
  privyRuntimeAuthenticated: boolean;
  /** Legacy alias for app auth readiness. Prefer authReady in new code. */
  ready: boolean;
  isAuthenticated: boolean;
  isImpersonating: boolean;
  isSkipAuthActive: boolean;
  isLoading: boolean;
  isDbUserLoading: boolean;
  isPrivyUserLoading: boolean;
  isImpersonationLoading: boolean;
  dbUser: UserQueryData | undefined;
  user: UserQueryData | undefined;
  unsafeDisplayProfile: AuthDisplayProfile | null;
  privyUser: any;
  rawPrivyUser: any;
  impersonation: {
    originalPrivyUser: unknown | null;
    targetPrivyUser: unknown | null;
    status: ImpersonationStatus | null | undefined;
    refetchStatus: () => Promise<unknown>;
  };
  definitelyNotAuthenticated: boolean;
  canPrefetchOrShouldFetch: boolean;
  isPrefetch: boolean;
  authSessionEpoch: number;
  authSubject: string | null;
  initialPermissionsData: PermissionsQueryData | undefined;
  initialSessionSnapshotResolvedAtMs: number | undefined;
  setPrivyRuntimeState: (state: PrivyRuntimeState) => void;
  clearPrivyRuntimeState: (id: string) => void;
  preloadLoginRuntime: () => void;
  requestLogin: (request: Omit<AuthLoginRequest, 'id'>) => Promise<void>;
  requestLogout: (request?: Omit<AuthLogoutRequest, 'id'>) => Promise<void>;
  beginLocalLogout: () => void;
  cancelLocalLogout: () => void;
  clearLocalAuthSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

let privyRuntimeHostPromise: Promise<PrivyRuntimeHostComponent> | null = null;
let privySessionRuntimePromise: Promise<PrivySessionRuntimeComponent> | null =
  null;
let privyLoginRuntimePromise: Promise<PrivyLoginRuntimeComponent> | null = null;
let privyLogoutRuntimePromise: Promise<PrivyLogoutRuntimeComponent> | null =
  null;

function loadPrivyRuntimeHost(): Promise<PrivyRuntimeHostComponent> {
  privyRuntimeHostPromise ??= import('@/components/providers/privy')
    .then((mod) => mod.PrivyRuntimeHost)
    .catch((error) => {
      privyRuntimeHostPromise = null;
      throw error;
    });
  return privyRuntimeHostPromise;
}

function loadPrivySessionRuntime(): Promise<PrivySessionRuntimeComponent> {
  privySessionRuntimePromise ??= import(
    '@/components/providers/privy-session-runtime'
  )
    .then((mod) => mod.PrivySessionRuntime)
    .catch((error) => {
      privySessionRuntimePromise = null;
      throw error;
    });
  return privySessionRuntimePromise;
}

function loadPrivyLoginRuntime(): Promise<PrivyLoginRuntimeComponent> {
  privyLoginRuntimePromise ??= import(
    '@/components/providers/privy-login-runtime'
  )
    .then((mod) => mod.PrivyLoginRuntime)
    .catch((error) => {
      privyLoginRuntimePromise = null;
      throw error;
    });
  return privyLoginRuntimePromise;
}

function loadPrivyLogoutRuntime(): Promise<PrivyLogoutRuntimeComponent> {
  privyLogoutRuntimePromise ??= import(
    '@/components/providers/privy-logout-runtime'
  )
    .then((mod) => mod.PrivyLogoutRuntime)
    .catch((error) => {
      privyLogoutRuntimePromise = null;
      throw error;
    });
  return privyLogoutRuntimePromise;
}

export function AuthProvider({
  children,
  initialCookieSnapshot,
  initialAuthSessionSnapshot: serializedInitialAuthSessionSnapshot,
}: PropsWithChildren<{
  initialCookieSnapshot: AuthCookieSnapshot;
  initialAuthSessionSnapshot?: SerializedInitialAuthSessionSnapshot;
}>) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const mockPrivy = useMockPrivy();
  const hasMockPrivyRuntime = Boolean(mockPrivy);
  const { isSkipAuthActive } = useSkipAuth();
  const initialAuthSessionSnapshot = useMemo(
    () =>
      deserializeInitialAuthSessionSnapshot(
        serializedInitialAuthSessionSnapshot ?? null,
      ),
    [serializedInitialAuthSessionSnapshot],
  );
  const initialHasServerReadableToken = initialCookieSnapshot.hasPrivyToken;
  const [hasServerReadableToken, setHasServerReadableToken] = useState(
    initialHasServerReadableToken,
  );
  const [hasAuthRejection, setHasAuthRejection] = useState(false);
  const [isLocalLogoutPending, setIsLocalLogoutPending] = useState(false);
  const [authSessionEpoch, setAuthSessionEpoch] = useState(0);
  const [completedLoginSubject, setCompletedLoginSubject] = useState<
    string | null
  >(null);
  const [privyRuntimeStates, setPrivyRuntimeStates] = useState<
    Record<string, PrivyRuntimeState>
  >({});
  const [sessionRefreshSettled, setSessionRefreshSettled] = useState(
    !initialCookieSnapshot.hasPrivySession || initialHasServerReadableToken,
  );
  const [PrivyRuntimeHost, setPrivyRuntimeHost] =
    useState<PrivyRuntimeHostComponent | null>(null);
  const [PrivySessionRuntime, setPrivySessionRuntime] =
    useState<PrivySessionRuntimeComponent | null>(null);
  const [PrivyLoginRuntime, setPrivyLoginRuntime] =
    useState<PrivyLoginRuntimeComponent | null>(null);
  const [PrivyLogoutRuntime, setPrivyLogoutRuntime] =
    useState<PrivyLogoutRuntimeComponent | null>(null);
  const [loginRequest, setLoginRequest] = useState<AuthLoginRequest | null>(
    null,
  );
  const [logoutRequest, setLogoutRequest] = useState<AuthLogoutRequest | null>(
    null,
  );
  const hasRequestedSessionRuntimeRef = useRef(false);
  const hasAttemptedUnauthorizedRefreshRef = useRef(false);
  const lastRuntimeAuthKeyRef = useRef<string | null>(null);
  const nextLoginRequestIdRef = useRef(0);
  const nextLogoutRequestIdRef = useRef(0);
  const completedLoginRequestIdsRef = useRef(new Set<number>());
  const loginRequestResolversRef = useRef(
    new Map<
      number,
      {
        resolve: () => void;
        reject: (error: unknown) => void;
      }
    >(),
  );
  const logoutRequestResolversRef = useRef(
    new Map<
      number,
      {
        resolve: () => void;
        reject: (error: unknown) => void;
      }
    >(),
  );

  const setPrivyRuntimeState = useCallback((state: PrivyRuntimeState) => {
    setPrivyRuntimeStates((current) => ({
      ...current,
      [state.id]: state,
    }));
  }, []);

  const clearPrivyRuntimeState = useCallback((id: string) => {
    setPrivyRuntimeStates((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const cancelAuthTransitionQueries = useCallback(() => {
    void queryClient.cancelQueries();
  }, [queryClient]);

  const clearAuthTransitionQueryCache = useCallback(() => {
    void queryClient.cancelQueries();
    queryClient.clear();
  }, [queryClient]);

  const beginLocalLogout = useCallback(() => {
    cancelAuthTransitionQueries();
    setHasAuthRejection(false);
    setIsLocalLogoutPending(true);
    setCompletedLoginSubject(null);
  }, [cancelAuthTransitionQueries]);

  const cancelLocalLogout = useCallback(() => {
    setIsLocalLogoutPending(false);
  }, []);

  const clearLocalAuthSession = useCallback(() => {
    clearAuthTransitionQueryCache();
    setHasServerReadableToken(false);
    setHasAuthRejection(false);
    setIsLocalLogoutPending(false);
    setSessionRefreshSettled(true);
    setPrivyRuntimeStates({});
    setCompletedLoginSubject(null);
    hasAttemptedUnauthorizedRefreshRef.current = false;
    lastRuntimeAuthKeyRef.current = 'anonymous';
    setAuthSessionEpoch((current) => current + 1);
  }, [clearAuthTransitionQueryCache]);

  const completeLoginRequest = useCallback(
    (requestId: number, privyUserId: string) => {
      if (completedLoginRequestIdsRef.current.has(requestId)) return;

      completedLoginRequestIdsRef.current.add(requestId);
      clearAuthTransitionQueryCache();
      setLoginRequest((current) =>
        current?.id === requestId ? null : current,
      );
      setCompletedLoginSubject(privyUserId);
      lastRuntimeAuthKeyRef.current = `authenticated:${privyUserId}`;
      setHasServerReadableToken(true);
      setHasAuthRejection(false);
      setSessionRefreshSettled(true);
      hasAttemptedUnauthorizedRefreshRef.current = false;
      setAuthSessionEpoch((current) => current + 1);
    },
    [clearAuthTransitionQueryCache],
  );

  const handleLoginTriggered = useCallback(
    (requestId: number, error?: unknown) => {
      const pending = loginRequestResolversRef.current.get(requestId);
      if (!pending) return;

      if (error) {
        pending.reject(error);
        setLoginRequest((current) =>
          current?.id === requestId ? null : current,
        );
      } else {
        pending.resolve();
        setLoginRequest((current) =>
          current?.id === requestId ? null : current,
        );
      }
      loginRequestResolversRef.current.delete(requestId);
    },
    [],
  );

  const handleLoginAuthenticated = useCallback(
    (requestId: number, result: AuthLoginSettledResult) => {
      completeLoginRequest(requestId, result.privyUserId);
    },
    [completeLoginRequest],
  );

  const handleLoginFailed = useCallback((requestId: number, error: unknown) => {
    const pending = loginRequestResolversRef.current.get(requestId);
    if (pending) {
      pending.reject(error);
      loginRequestResolversRef.current.delete(requestId);
    }
    setLoginRequest((current) => (current?.id === requestId ? null : current));
    setPrivyLoginRuntime(null);
  }, []);

  const mountPrivyRuntimeHost = useCallback(() => {
    return loadPrivyRuntimeHost().then((Component) => {
      setPrivyRuntimeHost(() => Component);
      return Component;
    });
  }, []);

  const mountPrivyLoginRuntime = useCallback(() => {
    return Promise.all([mountPrivyRuntimeHost(), loadPrivyLoginRuntime()]).then(
      ([, Component]) => {
        setPrivyLoginRuntime(() => Component);
        return Component;
      },
    );
  }, [mountPrivyRuntimeHost]);

  const handleLogoutTriggered = useCallback(
    (requestId: number, error?: unknown) => {
      const pending = logoutRequestResolversRef.current.get(requestId);
      if (!pending) return;

      setLogoutRequest((current) =>
        current?.id === requestId ? null : current,
      );
      setPrivyLogoutRuntime(null);
      if (error) {
        pending.reject(error);
      } else {
        pending.resolve();
      }
      logoutRequestResolversRef.current.delete(requestId);
    },
    [],
  );

  const mountPrivyLogoutRuntime = useCallback(() => {
    return Promise.all([
      mountPrivyRuntimeHost(),
      loadPrivyLogoutRuntime(),
    ]).then(([, Component]) => {
      setPrivyLogoutRuntime(() => Component);
      return Component;
    });
  }, [mountPrivyRuntimeHost]);

  const requestLogin = useCallback(
    (request: Omit<AuthLoginRequest, 'id'>) => {
      if (isLocalLogoutPending) {
        const error = new Error('Sign out is still finishing.');
        return Promise.reject(error);
      }

      const requestId = nextLoginRequestIdRef.current + 1;
      nextLoginRequestIdRef.current = requestId;
      const nextRequest = { ...request, id: requestId };

      for (const pending of loginRequestResolversRef.current.values()) {
        pending.resolve();
      }
      loginRequestResolversRef.current.clear();
      completedLoginRequestIdsRef.current.delete(requestId);
      setHasAuthRejection(false);
      setLoginRequest(nextRequest);

      return new Promise<void>((resolve, reject) => {
        loginRequestResolversRef.current.set(requestId, { resolve, reject });

        const runtimeLoginCommandHandler = getPrivyLoginCommandHandler();
        if (runtimeLoginCommandHandler) {
          runtimeLoginCommandHandler({
            request: nextRequest,
            onTriggered: handleLoginTriggered,
            onAuthenticated: handleLoginAuthenticated,
            onFailed: handleLoginFailed,
          });
          return;
        }

        void mountPrivyLoginRuntime().catch((error) => {
          setLoginRequest((current) =>
            current?.id === requestId ? null : current,
          );
          loginRequestResolversRef.current.delete(requestId);
          request.callbacks?.onError?.(error as AuthLoginError);
          reject(error);
        });
      });
    },
    [
      handleLoginAuthenticated,
      handleLoginFailed,
      handleLoginTriggered,
      isLocalLogoutPending,
      mountPrivyLoginRuntime,
    ],
  );

  const requestLogout = useCallback(
    (request: Omit<AuthLogoutRequest, 'id'> = {}) => {
      const requestId = nextLogoutRequestIdRef.current + 1;
      nextLogoutRequestIdRef.current = requestId;
      const nextRequest = { ...request, id: requestId };

      for (const pending of logoutRequestResolversRef.current.values()) {
        pending.resolve();
      }
      logoutRequestResolversRef.current.clear();
      setLogoutRequest(nextRequest);

      return new Promise<void>((resolve, reject) => {
        logoutRequestResolversRef.current.set(requestId, { resolve, reject });

        const runtimeLogoutHandler = getPrivyRuntimeLogoutHandler();
        if (runtimeLogoutHandler) {
          void runtimeLogoutHandler({ callbacks: request.callbacks })
            .then(() => {
              handleLogoutTriggered(requestId);
            })
            .catch((error) => {
              handleLogoutTriggered(requestId, error);
            });
          return;
        }

        void mountPrivyLogoutRuntime().catch((error) => {
          setLogoutRequest((current) =>
            current?.id === requestId ? null : current,
          );
          setPrivyLogoutRuntime(null);
          logoutRequestResolversRef.current.delete(requestId);
          reject(error);
        });
      });
    },
    [handleLogoutTriggered, mountPrivyLogoutRuntime],
  );

  const handleSessionRefreshSettled = useCallback(
    (hasToken: boolean) => {
      setSessionRefreshSettled(true);
      setPrivySessionRuntime(null);
      if (hasToken) {
        clearAuthTransitionQueryCache();
        setHasServerReadableToken(true);
        setHasAuthRejection(false);
        setAuthSessionEpoch((current) => current + 1);
      }
    },
    [clearAuthTransitionQueryCache],
  );

  const requestSessionRefresh = useCallback(() => {
    if (hasMockPrivyRuntime) {
      setSessionRefreshSettled(true);
      return false;
    }

    setSessionRefreshSettled(false);
    hasRequestedSessionRuntimeRef.current = true;
    const runtimeSessionRefreshHandler = getPrivySessionRefreshCommandHandler();
    if (runtimeSessionRefreshHandler) {
      runtimeSessionRefreshHandler(handleSessionRefreshSettled);
      return true;
    }

    void Promise.all([mountPrivyRuntimeHost(), loadPrivySessionRuntime()])
      .then(([, Component]) => {
        setPrivySessionRuntime(() => Component);
      })
      .catch(() => {
        privyRuntimeHostPromise = null;
        privySessionRuntimePromise = null;
        setSessionRefreshSettled(true);
      });
    return true;
  }, [handleSessionRefreshSettled, hasMockPrivyRuntime, mountPrivyRuntimeHost]);

  useEffect(() => {
    return () => {
      for (const pending of loginRequestResolversRef.current.values()) {
        pending.resolve();
      }
      loginRequestResolversRef.current.clear();
      for (const pending of logoutRequestResolversRef.current.values()) {
        pending.resolve();
      }
      logoutRequestResolversRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (
      sessionRefreshSettled ||
      hasMockPrivyRuntime ||
      !initialCookieSnapshot.hasPrivySession ||
      initialHasServerReadableToken ||
      hasRequestedSessionRuntimeRef.current
    ) {
      return;
    }

    requestSessionRefresh();
  }, [
    initialCookieSnapshot.hasPrivySession,
    hasMockPrivyRuntime,
    initialHasServerReadableToken,
    requestSessionRefresh,
    sessionRefreshSettled,
  ]);

  const runtimeState = useMemo<PrivyRuntimeState | null>(() => {
    if (mockPrivy) {
      return {
        id: 'mock-privy',
        ready: mockPrivy.ready,
        authenticated: mockPrivy.authenticated,
        user: mockPrivy.user ?? null,
      };
    }

    const states = Object.values(privyRuntimeStates);
    return (
      states.find((state) => state.ready && state.authenticated) ??
      states.find((state) => state.ready) ??
      states[0] ??
      null
    );
  }, [mockPrivy, privyRuntimeStates]);

  const runtimeAuthenticated = Boolean(
    runtimeState?.ready && runtimeState.authenticated,
  );
  const runtimeSubject = runtimeAuthenticated
    ? getPrivyUserId(runtimeState?.user)
    : null;
  const subjectForAppAuthGuards = getAuthSubjectForAppGuards({
    completedLoginSubject,
    runtimeSubject,
  });

  useEffect(() => {
    if (!runtimeState?.ready) return;
    if (isLocalLogoutPending) return;

    const runtimeAuthKey = getRuntimeAuthKey({
      runtimeAuthenticated,
      runtimeSubject,
    });
    if (lastRuntimeAuthKeyRef.current !== runtimeAuthKey) {
      if (lastRuntimeAuthKeyRef.current !== null) {
        clearAuthTransitionQueryCache();
        setAuthSessionEpoch((current) => current + 1);
      }
      hasAttemptedUnauthorizedRefreshRef.current = false;
      lastRuntimeAuthKeyRef.current = runtimeAuthKey;
    }
    setHasServerReadableToken(
      runtimeAuthenticated || Boolean(readPrivyAccessTokenCookie()),
    );
    setHasAuthRejection(false);
  }, [
    clearAuthTransitionQueryCache,
    isLocalLogoutPending,
    runtimeAuthenticated,
    runtimeState?.ready,
    runtimeSubject,
  ]);

  const canPrefetchOrShouldFetch =
    !isLocalLogoutPending &&
    !hasAuthRejection &&
    (hasServerReadableToken || runtimeAuthenticated || isSkipAuthActive);
  const isPrefetch = false;
  // After any client auth boundary change, unscoped SSR data can belong to a
  // previous user. Require a matching runtime DID outside the hydration epoch.
  const allowUnscopedInitialSessionSnapshot =
    authSessionEpoch === 0 && !isLocalLogoutPending;

  const initialSessionSnapshot =
    canPrefetchOrShouldFetch &&
    initialAuthSessionSnapshot?.session &&
    isInitialSessionSnapshotForRuntimeSubject(
      initialAuthSessionSnapshot,
      subjectForAppAuthGuards,
      allowUnscopedInitialSessionSnapshot,
    )
      ? initialAuthSessionSnapshot
      : null;
  const initialUserData = initialSessionSnapshot?.session.user;
  const initialPermissionsData = initialSessionSnapshot?.session.permissions;
  const initialImpersonationData =
    initialSessionSnapshot?.session.impersonationStatus;
  const initialSessionSnapshotResolvedAtMs =
    initialSessionSnapshot?.resolvedAtMs;

  const userQuery = useQuery(
    handleAuthQueryKey(
      authSessionEpoch,
      isPrefetch,
      subjectForAppAuthGuards,
      withInitialQueryData(
        trpc.users.getUser.queryOptions(undefined, {
          enabled: canPrefetchOrShouldFetch,
          retry(failureCount, error) {
            if (failureCount > 2) return false;
            if (
              error instanceof TRPCClientError &&
              error.data?.code === 'UNAUTHORIZED'
            ) {
              return false;
            }
            return true;
          },
          trpc: {
            context: {
              skipBatch: true,
              [TRPC_INCLUDE_PRIVY_ID_TOKEN_CONTEXT_KEY]: true,
            },
          },
        }),
        initialUserData,
        initialSessionSnapshotResolvedAtMs,
      ),
    ),
  );
  const impersonation = useQuery(
    handleAuthQueryKey(
      authSessionEpoch,
      isPrefetch,
      subjectForAppAuthGuards,
      withInitialQueryData(
        trpc.users.getImpersonationStatus.queryOptions(undefined, {
          enabled: canPrefetchOrShouldFetch,
          retry(failureCount, error) {
            if (failureCount > 1) return false;
            if (
              error instanceof TRPCClientError &&
              error.data?.code === 'UNAUTHORIZED'
            ) {
              return false;
            }
            return failureCount < 3;
          },
          staleTime: 15_000,
          refetchInterval: (query) =>
            getImpersonationStatusRefetchInterval(query.state.data),
          trpc: {
            context: {
              skipBatch: true,
            },
          },
        }),
        initialImpersonationData,
        initialSessionSnapshotResolvedAtMs,
      ),
    ),
  );

  useEffect(() => {
    if (
      userQuery.error instanceof TRPCClientError &&
      userQuery.error.data?.code === 'UNAUTHORIZED'
    ) {
      clearAuthTransitionQueryCache();
      setCompletedLoginSubject(null);
      setHasServerReadableToken(false);
      setHasAuthRejection(true);
      setPrivyLoginRuntime(null);
      setAuthSessionEpoch((current) => current + 1);
      if (!hasAttemptedUnauthorizedRefreshRef.current) {
        hasAttemptedUnauthorizedRefreshRef.current = true;
        requestSessionRefresh();
      }
    }
  }, [clearAuthTransitionQueryCache, requestSessionRefresh, userQuery.error]);

  const { authReady, privyRuntimeReady } = getAuthReadiness({
    sessionRefreshSettled,
    hasRuntimeState: Boolean(runtimeState),
    runtimeReady: Boolean(runtimeState?.ready),
    hasServerReadableToken,
    hasLoginRequest: Boolean(loginRequest),
  });
  const ready = authReady;
  const definitelyNotAuthenticated =
    authReady &&
    !runtimeAuthenticated &&
    !hasServerReadableToken &&
    !isSkipAuthActive;
  const userData = canPrefetchOrShouldFetch ? userQuery.data : undefined;
  const userDataForCurrentSubject =
    runtimeAuthenticated && !runtimeSubject
      ? undefined
      : !isUserDataForRuntimeSubject(
            userData,
            impersonation.data,
            subjectForAppAuthGuards,
          )
        ? undefined
        : userData;
  // Under `?skip_auth=1` there is no runtime Privy user, so the contact email
  // can only come from the backend display profile. Surface the simulated
  // user's email when it is missing so email-gated surfaces (e.g. DNS
  // management) don't fire for the simulated account that is defined to have one.
  const unsafeDisplayProfile = useMemo(
    () =>
      withFallbackContactEmail(
        userDataForCurrentSubject?.displayProfile ?? null,
        isSkipAuthActive ? SKIP_AUTH_MOCK_USER.email : null,
      ),
    [userDataForCurrentSubject?.displayProfile, isSkipAuthActive],
  );

  useEffect(() => {
    if (!userQuery.isSuccess || !userDataForCurrentSubject?.privyUserId) return;

    hasAttemptedUnauthorizedRefreshRef.current = false;
  }, [userDataForCurrentSubject?.privyUserId, userQuery.isSuccess]);

  useEffect(() => {
    if (!PrivyLoginRuntime || !completedLoginSubject) return;
    if (userDataForCurrentSubject?.privyUserId === completedLoginSubject) {
      setPrivyLoginRuntime(null);
    }
  }, [
    PrivyLoginRuntime,
    completedLoginSubject,
    userDataForCurrentSubject?.privyUserId,
  ]);

  const authSubject =
    subjectForAppAuthGuards ?? userDataForCurrentSubject?.privyUserId ?? null;
  const isAuthenticated =
    !isLocalLogoutPending &&
    authReady &&
    (runtimeAuthenticated || hasServerReadableToken || isSkipAuthActive) &&
    Boolean(userDataForCurrentSubject?.privyUserId);
  const isDbUserLoading =
    !authReady || (canPrefetchOrShouldFetch && userQuery.isLoading);
  const isLoading = isLocalLogoutPending || isDbUserLoading;

  useEffect(() => {
    if (
      !isAuthenticated ||
      hasMockPrivyRuntime ||
      isLocalLogoutPending ||
      !hasServerReadableToken ||
      runtimeAuthenticated ||
      PrivyRuntimeHost
    ) {
      return;
    }

    void mountPrivyRuntimeHost().catch(() => {
      privyRuntimeHostPromise = null;
    });
  }, [
    PrivyRuntimeHost,
    hasMockPrivyRuntime,
    hasServerReadableToken,
    isAuthenticated,
    isLocalLogoutPending,
    mountPrivyRuntimeHost,
    runtimeAuthenticated,
  ]);

  const preloadLoginRuntime = useCallback(() => {
    if (
      hasMockPrivyRuntime ||
      !shouldPreloadLoginRuntimeOnIntent({
        isLoading,
        isAuthenticated,
        hasLoginRuntime: Boolean(PrivyLoginRuntime),
      })
    ) {
      return;
    }

    void loadPrivyLoginRuntime().catch(() => {
      // The click path reports failures to the user; intent preload can retry.
    });
  }, [hasMockPrivyRuntime, isAuthenticated, isLoading, PrivyLoginRuntime]);

  const impersonationTargetPrivyUser = impersonation.data?.impersonating
    ? normalizeDisplayUser(impersonation.data.targetPrivyUser)
    : null;
  const originalPrivyUser = normalizeDisplayUser(runtimeState?.user);
  const runtimePrivyUserForCurrentSubject =
    runtimeAuthenticated &&
    runtimeSubject &&
    userDataForCurrentSubject?.privyUserId === runtimeSubject
      ? originalPrivyUser
      : null;
  const privyUser =
    impersonationTargetPrivyUser ?? runtimePrivyUserForCurrentSubject;
  const rawPrivyUser = privyUser;
  const isActiveImpersonation = Boolean(impersonation.data?.impersonating);
  const isPrivyUserLoading =
    isAuthenticated &&
    !privyUser &&
    ((isActiveImpersonation &&
      impersonation.isFetching &&
      !impersonationTargetPrivyUser) ||
      (Boolean(runtimeState) &&
        (!runtimeState?.ready || Boolean(runtimeState.authenticated))));

  useConsentIdentify({
    ready: authReady,
    authenticated: isAuthenticated,
    userId: userDataForCurrentSubject?.id,
  });

  const value = useMemo<AuthContextValue>(() => {
    return {
      authReady,
      privyRuntimeReady,
      privyRuntimeAuthenticated: runtimeAuthenticated,
      ready,
      isAuthenticated,
      isImpersonating: Boolean(impersonation.data?.impersonating),
      isSkipAuthActive,
      isLoading,
      isDbUserLoading,
      isPrivyUserLoading,
      isImpersonationLoading: impersonation.isLoading,
      dbUser: isAuthenticated ? userDataForCurrentSubject : undefined,
      user: isAuthenticated ? userDataForCurrentSubject : undefined,
      unsafeDisplayProfile: isAuthenticated ? unsafeDisplayProfile : null,
      privyUser,
      rawPrivyUser,
      impersonation: {
        originalPrivyUser,
        targetPrivyUser: impersonationTargetPrivyUser,
        status: impersonation.data,
        refetchStatus: impersonation.refetch,
      },
      definitelyNotAuthenticated,
      canPrefetchOrShouldFetch,
      isPrefetch,
      authSessionEpoch,
      authSubject,
      initialPermissionsData: isAuthenticated
        ? initialPermissionsData
        : undefined,
      initialSessionSnapshotResolvedAtMs: isAuthenticated
        ? initialSessionSnapshotResolvedAtMs
        : undefined,
      setPrivyRuntimeState,
      clearPrivyRuntimeState,
      preloadLoginRuntime,
      requestLogin,
      requestLogout,
      beginLocalLogout,
      cancelLocalLogout,
      clearLocalAuthSession,
    };
  }, [
    authReady,
    authSessionEpoch,
    authSubject,
    beginLocalLogout,
    canPrefetchOrShouldFetch,
    cancelLocalLogout,
    clearLocalAuthSession,
    clearPrivyRuntimeState,
    definitelyNotAuthenticated,
    impersonation.data,
    impersonation.isLoading,
    impersonation.refetch,
    impersonationTargetPrivyUser,
    isAuthenticated,
    isDbUserLoading,
    isPrivyUserLoading,
    isSkipAuthActive,
    initialPermissionsData,
    initialSessionSnapshotResolvedAtMs,
    originalPrivyUser,
    preloadLoginRuntime,
    privyUser,
    privyRuntimeReady,
    rawPrivyUser,
    ready,
    requestLogin,
    requestLogout,
    runtimeAuthenticated,
    setPrivyRuntimeState,
    unsafeDisplayProfile,
    userDataForCurrentSubject,
    isLoading,
  ]);

  const hasPrivyRuntimeControls = Boolean(
    (PrivySessionRuntime && !sessionRefreshSettled) ||
      PrivyLoginRuntime ||
      PrivyLogoutRuntime,
  );
  const shouldRenderPrivyRuntimeHost = Boolean(
    !hasMockPrivyRuntime &&
      PrivyRuntimeHost &&
      (hasPrivyRuntimeControls ||
        (isAuthenticated && hasServerReadableToken && !isLocalLogoutPending)),
  );
  const privyRuntimeControls = (
    <>
      {PrivySessionRuntime && !sessionRefreshSettled ? (
        <PrivySessionRuntime onSettled={handleSessionRefreshSettled} />
      ) : null}
      {PrivyLoginRuntime ? (
        <PrivyLoginRuntime
          request={loginRequest}
          onTriggered={handleLoginTriggered}
          onAuthenticated={handleLoginAuthenticated}
          onFailed={handleLoginFailed}
        />
      ) : null}
      {PrivyLogoutRuntime ? (
        <PrivyLogoutRuntime
          request={logoutRequest}
          onTriggered={handleLogoutTriggered}
        />
      ) : null}
    </>
  );

  return (
    <AuthContext.Provider value={value}>
      {shouldRenderPrivyRuntimeHost && PrivyRuntimeHost ? (
        <PrivyRuntimeHost>
          {children}
          {privyRuntimeControls}
        </PrivyRuntimeHost>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function getPrivyUserId(user: unknown | null | undefined) {
  if (!user || typeof user !== 'object') return null;

  const id = (user as { id?: unknown }).id;
  return typeof id === 'string' && id ? id : null;
}

function normalizeDisplayUser(user: unknown | null | undefined) {
  if (!user || typeof user !== 'object') return null;
  const customMetadata = privyStorageToPrivyCustomMetadata.safeParse(
    (user as { customMetadata?: unknown }).customMetadata,
  );

  return {
    ...(user as Record<string, unknown>),
    customMetadata: customMetadata.success ? customMetadata.data : undefined,
  };
}

function getRuntimeAuthKey({
  runtimeAuthenticated,
  runtimeSubject,
}: {
  runtimeAuthenticated: boolean;
  runtimeSubject: string | null;
}) {
  return runtimeAuthenticated
    ? `authenticated:${runtimeSubject ?? 'unknown'}`
    : 'anonymous';
}

function extendTrpcQueryKey<Q extends AnyUseQueryOptions>(
  keys: unknown[],
  query: Q,
): Q {
  const originalKey = query.queryKey as unknown[] | undefined;
  if (!keys.length || !originalKey) {
    return query;
  }
  // tRPC v11.8+ interprets a queryKey of length >= 3 as a *prefixed* key
  // ([prefix, path, args]) and reads the procedure path from queryKey[1] (see
  // @trpc/tanstack-react-query readQueryKey/isPrefixedQueryKey). The previous
  // approach *appended* auth-scope segments, which pushed the key to length >= 3
  // and made tRPC read the `{input,type}` args object as the path —
  // "queryKeyData.path.join is not a function" — so getUser errored on the
  // post-login transition and auth never completed.
  //
  // Keep tRPC's unprefixed [path, args] shape (length 2) and fold the auth scope
  // INTO args instead: it only adds react-query cache-key distinctness (tRPC
  // ignores unknown args fields when building the request, reading only
  // `args.input`). Auth-state isolation is otherwise enforced by
  // clearAuthTransitionQueryCache() clearing the whole cache on transitions.
  const [path, args] = originalKey;
  const authScope = Object.assign({}, ...(keys as object[]));
  return {
    ...query,
    queryKey: [path, { ...(args as object | null), __authScope: authScope }],
  } as Q;
}

function handleAuthQueryKey<Q extends AnyUseQueryOptions>(
  authSessionEpoch: number,
  isPrefetch: boolean,
  authSubject: string | null,
  query: Q,
): Q {
  const keys: unknown[] = [{ authSessionEpoch }];
  if (authSubject) {
    keys.push({ authSubject });
  }
  if (isPrefetch) {
    keys.push({ mode: 'prefetch' });
  }
  return extendTrpcQueryKey<Q>(keys, query);
}

function withInitialQueryData<Q extends AnyUseQueryOptions, Data>(
  query: Q,
  initialData: Data | undefined,
  initialDataUpdatedAt: number | undefined,
): Q {
  if (initialData === undefined) return query;

  return {
    ...query,
    initialData,
    initialDataUpdatedAt,
  } as Q;
}

function isInitialSessionSnapshotForRuntimeSubject(
  snapshot: InitialAuthSessionSnapshot,
  runtimeSubject: string | null,
  allowUnscopedSnapshot: boolean,
) {
  const { impersonationStatus, user } = snapshot.session;
  return shouldUseInitialSessionSnapshotForAuthSubject({
    allowUnscopedSnapshot,
    runtimeSubject,
    snapshotActorPrivyUserId: impersonationStatus.actor?.privyUserId,
    snapshotImpersonating: impersonationStatus.impersonating,
    snapshotUserPrivyUserId: user.privyUserId,
  });
}

function isUserDataForRuntimeSubject(
  user: UserQueryData | undefined,
  impersonationStatus: ImpersonationStatus | null | undefined,
  runtimeSubject: string | null,
) {
  if (!user) return false;
  if (!runtimeSubject) return true;

  if (impersonationStatus?.impersonating) {
    return (
      impersonationStatus.actor?.privyUserId === runtimeSubject &&
      impersonationStatus.effectiveUser.privyUserId === user.privyUserId
    );
  }

  return user.privyUserId === runtimeSubject;
}

export function useMyPermissions() {
  const auth = useAuthContext();
  const trpc = useTRPC();

  return useQuery(
    withInitialQueryData(
      extendTrpcQueryKey(
        [
          { authSessionEpoch: auth.authSessionEpoch },
          { authSubject: auth.authSubject },
        ],
        trpc.users.getMyPermissions.queryOptions(void 0, {
          enabled: auth.isAuthenticated,
          retry(failureCount, error) {
            if (auth.definitelyNotAuthenticated || failureCount > 1) {
              return false;
            }
            if (
              error instanceof TRPCClientError &&
              error.data?.code === 'UNAUTHORIZED'
            ) {
              return false;
            }
            return failureCount < 3;
          },
          staleTime: 60_000,
          trpc: { context: { skipBatch: true } },
        }),
      ),
      auth.initialPermissionsData,
      auth.initialSessionSnapshotResolvedAtMs,
    ),
  );
}
