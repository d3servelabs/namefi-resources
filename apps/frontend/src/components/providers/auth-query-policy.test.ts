import { describe, expect, it } from 'vitest';
import {
  IMPERSONATION_STATUS_REFETCH_INTERVAL_MS,
  getAuthReadiness,
  getAuthSubjectForAppGuards,
  getImpersonationStatusRefetchInterval,
  getLoginAuthenticatedPrivyUserId,
  shouldPreloadLoginRuntimeOnIntent,
  shouldTriggerPrivyLoginRequest,
  shouldUseInitialSessionSnapshotForAuthSubject,
} from './auth-query-policy';

describe('getImpersonationStatusRefetchInterval', () => {
  it('does not poll before impersonation status is known', () => {
    expect(getImpersonationStatusRefetchInterval(undefined)).toBe(false);
    expect(getImpersonationStatusRefetchInterval(null)).toBe(false);
  });

  it('does not keep polling normal authenticated sessions', () => {
    expect(
      getImpersonationStatusRefetchInterval({ impersonating: false }),
    ).toBe(false);
  });

  it('keeps polling while impersonation is active', () => {
    expect(getImpersonationStatusRefetchInterval({ impersonating: true })).toBe(
      IMPERSONATION_STATUS_REFETCH_INTERVAL_MS,
    );
  });
});

describe('getAuthReadiness', () => {
  const baseline = {
    sessionRefreshSettled: true,
    hasRuntimeState: false,
    runtimeReady: false,
    hasServerReadableToken: false,
    hasLoginRequest: false,
  };

  it('treats anonymous auth as ready when there is no session refresh or runtime probe', () => {
    expect(getAuthReadiness(baseline)).toMatchObject({
      authReady: true,
      privyRuntimeReady: false,
      isSessionRefreshLoading: false,
      isRuntimeAuthProbeLoading: false,
    });
  });

  it('blocks app auth while a privy-session recovery is unresolved', () => {
    expect(
      getAuthReadiness({
        ...baseline,
        sessionRefreshSettled: false,
      }),
    ).toMatchObject({
      authReady: false,
      isSessionRefreshLoading: true,
    });
  });

  it('does not wait for Privy runtime when a server-readable token already exists', () => {
    expect(
      getAuthReadiness({
        ...baseline,
        hasRuntimeState: true,
        runtimeReady: false,
        hasServerReadableToken: true,
      }),
    ).toMatchObject({
      authReady: true,
      privyRuntimeReady: false,
      isRuntimeAuthProbeLoading: false,
    });
  });

  it('keeps runtime-only auth fallback from flashing signed out while Privy is probing', () => {
    expect(
      getAuthReadiness({
        ...baseline,
        hasRuntimeState: true,
        runtimeReady: false,
      }),
    ).toMatchObject({
      authReady: false,
      privyRuntimeReady: false,
      isRuntimeAuthProbeLoading: true,
    });
  });

  it('does not turn a user-triggered login runtime load into a global auth loader', () => {
    expect(
      getAuthReadiness({
        ...baseline,
        hasRuntimeState: true,
        runtimeReady: false,
        hasLoginRequest: true,
      }),
    ).toMatchObject({
      authReady: true,
      privyRuntimeReady: false,
      isRuntimeAuthProbeLoading: false,
    });
  });

  it('reports Privy runtime readiness separately from app auth readiness', () => {
    expect(
      getAuthReadiness({
        ...baseline,
        hasRuntimeState: true,
        runtimeReady: true,
      }),
    ).toMatchObject({
      authReady: true,
      privyRuntimeReady: true,
    });
  });
});

describe('shouldPreloadLoginRuntimeOnIntent', () => {
  it('preloads only for signed-out, settled auth UI that has not loaded the runtime', () => {
    expect(
      shouldPreloadLoginRuntimeOnIntent({
        isLoading: false,
        isAuthenticated: false,
        hasLoginRuntime: false,
      }),
    ).toBe(true);
  });

  it('does not preload while auth is unsettled, signed in, or already loaded', () => {
    expect(
      shouldPreloadLoginRuntimeOnIntent({
        isLoading: true,
        isAuthenticated: false,
        hasLoginRuntime: false,
      }),
    ).toBe(false);

    expect(
      shouldPreloadLoginRuntimeOnIntent({
        isLoading: false,
        isAuthenticated: true,
        hasLoginRuntime: false,
      }),
    ).toBe(false);

    expect(
      shouldPreloadLoginRuntimeOnIntent({
        isLoading: false,
        isAuthenticated: false,
        hasLoginRuntime: true,
      }),
    ).toBe(false);
  });
});

describe('shouldTriggerPrivyLoginRequest', () => {
  it('waits for Privy readiness before triggering a pending login request', () => {
    expect(
      shouldTriggerPrivyLoginRequest({
        ready: false,
        requestId: 1,
        lastHandledRequestId: 0,
      }),
    ).toBe(false);

    expect(
      shouldTriggerPrivyLoginRequest({
        ready: true,
        requestId: 1,
        lastHandledRequestId: 0,
      }),
    ).toBe(true);
  });

  it('does not trigger invalid or already-handled login requests', () => {
    expect(
      shouldTriggerPrivyLoginRequest({
        ready: true,
        requestId: 0,
        lastHandledRequestId: 0,
      }),
    ).toBe(false);

    expect(
      shouldTriggerPrivyLoginRequest({
        ready: true,
        requestId: 2,
        lastHandledRequestId: 2,
      }),
    ).toBe(false);
  });
});

describe('getLoginAuthenticatedPrivyUserId', () => {
  it('uses the runtime Privy user id when available', () => {
    expect(
      getLoginAuthenticatedPrivyUserId({
        runtimePrivyUserId: 'did:privy:runtime-user',
        tokenPrivyUserId: null,
      }),
    ).toBe('did:privy:runtime-user');
  });

  it('uses the token Privy user id when runtime user is not available', () => {
    expect(
      getLoginAuthenticatedPrivyUserId({
        runtimePrivyUserId: null,
        tokenPrivyUserId: 'did:privy:token-user',
      }),
    ).toBe('did:privy:token-user');
  });

  it('accepts matching runtime and token user ids', () => {
    expect(
      getLoginAuthenticatedPrivyUserId({
        runtimePrivyUserId: 'did:privy:current-user',
        tokenPrivyUserId: 'did:privy:current-user',
      }),
    ).toBe('did:privy:current-user');
  });

  it('rejects mismatched runtime and token user ids', () => {
    expect(
      getLoginAuthenticatedPrivyUserId({
        runtimePrivyUserId: 'did:privy:runtime-user',
        tokenPrivyUserId: 'did:privy:token-user',
      }),
    ).toBeNull();
  });

  it('does not invent a user id when neither source has one', () => {
    expect(
      getLoginAuthenticatedPrivyUserId({
        runtimePrivyUserId: null,
        tokenPrivyUserId: null,
      }),
    ).toBeNull();
  });
});

describe('getAuthSubjectForAppGuards', () => {
  it('prefers the live runtime subject when available', () => {
    expect(
      getAuthSubjectForAppGuards({
        runtimeSubject: 'did:privy:runtime-user',
        completedLoginSubject: 'did:privy:completed-login-user',
      }),
    ).toBe('did:privy:runtime-user');
  });

  it('uses the completed login subject while the lazy runtime hands off', () => {
    expect(
      getAuthSubjectForAppGuards({
        runtimeSubject: null,
        completedLoginSubject: 'did:privy:completed-login-user',
      }),
    ).toBe('did:privy:completed-login-user');
  });
});

describe('shouldUseInitialSessionSnapshotForAuthSubject', () => {
  it('allows an unscoped initial snapshot only during the initial hydration epoch', () => {
    expect(
      shouldUseInitialSessionSnapshotForAuthSubject({
        allowUnscopedSnapshot: true,
        runtimeSubject: null,
        snapshotActorPrivyUserId: null,
        snapshotImpersonating: false,
        snapshotUserPrivyUserId: 'did:privy:initial-user',
      }),
    ).toBe(true);

    expect(
      shouldUseInitialSessionSnapshotForAuthSubject({
        allowUnscopedSnapshot: false,
        runtimeSubject: null,
        snapshotActorPrivyUserId: null,
        snapshotImpersonating: false,
        snapshotUserPrivyUserId: 'did:privy:initial-user',
      }),
    ).toBe(false);
  });

  it('requires a matching runtime subject once Privy has reported a user DID', () => {
    expect(
      shouldUseInitialSessionSnapshotForAuthSubject({
        allowUnscopedSnapshot: false,
        runtimeSubject: 'did:privy:current-user',
        snapshotActorPrivyUserId: null,
        snapshotImpersonating: false,
        snapshotUserPrivyUserId: 'did:privy:current-user',
      }),
    ).toBe(true);

    expect(
      shouldUseInitialSessionSnapshotForAuthSubject({
        allowUnscopedSnapshot: true,
        runtimeSubject: 'did:privy:current-user',
        snapshotActorPrivyUserId: null,
        snapshotImpersonating: false,
        snapshotUserPrivyUserId: 'did:privy:old-user',
      }),
    ).toBe(false);
  });

  it('matches impersonated snapshots against the actor Privy subject', () => {
    expect(
      shouldUseInitialSessionSnapshotForAuthSubject({
        allowUnscopedSnapshot: false,
        runtimeSubject: 'did:privy:admin',
        snapshotActorPrivyUserId: 'did:privy:admin',
        snapshotImpersonating: true,
        snapshotUserPrivyUserId: 'did:privy:target-user',
      }),
    ).toBe(true);

    expect(
      shouldUseInitialSessionSnapshotForAuthSubject({
        allowUnscopedSnapshot: false,
        runtimeSubject: 'did:privy:target-user',
        snapshotActorPrivyUserId: 'did:privy:admin',
        snapshotImpersonating: true,
        snapshotUserPrivyUserId: 'did:privy:target-user',
      }),
    ).toBe(false);
  });
});
