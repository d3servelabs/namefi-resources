export const IMPERSONATION_STATUS_REFETCH_INTERVAL_MS = 30_000;

export type ImpersonationPollingStatus =
  | { impersonating: boolean }
  | null
  | undefined;

export type AuthReadinessPolicy = {
  sessionRefreshSettled: boolean;
  hasRuntimeState: boolean;
  runtimeReady: boolean;
  hasServerReadableToken: boolean;
  hasLoginRequest: boolean;
};

export type AuthReadiness = {
  authReady: boolean;
  privyRuntimeReady: boolean;
  isSessionRefreshLoading: boolean;
  isRuntimeAuthProbeLoading: boolean;
};

export type AuthLoginRuntimePreloadPolicy = {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasLoginRuntime: boolean;
};

export type AuthLoginRuntimeTriggerPolicy = {
  ready: boolean;
  requestId: number;
  lastHandledRequestId: number;
};

export type LoginAuthenticatedUserPolicy = {
  runtimePrivyUserId: string | null;
  tokenPrivyUserId: string | null;
};

export type AuthSubjectPolicy = {
  runtimeSubject: string | null;
  completedLoginSubject: string | null;
};

export type InitialSessionSnapshotSubjectPolicy = {
  allowUnscopedSnapshot: boolean;
  runtimeSubject: string | null;
  snapshotUserPrivyUserId: string | null | undefined;
  snapshotImpersonating: boolean;
  snapshotActorPrivyUserId: string | null | undefined;
};

export function getImpersonationStatusRefetchInterval(
  status: ImpersonationPollingStatus,
) {
  return status?.impersonating
    ? IMPERSONATION_STATUS_REFETCH_INTERVAL_MS
    : false;
}

export function getAuthReadiness({
  sessionRefreshSettled,
  hasRuntimeState,
  runtimeReady,
  hasServerReadableToken,
  hasLoginRequest,
}: AuthReadinessPolicy): AuthReadiness {
  const isSessionRefreshLoading = !sessionRefreshSettled;
  const isRuntimeAuthProbeLoading =
    hasRuntimeState &&
    !runtimeReady &&
    !hasServerReadableToken &&
    !hasLoginRequest;

  return {
    authReady: !isSessionRefreshLoading && !isRuntimeAuthProbeLoading,
    privyRuntimeReady: runtimeReady,
    isSessionRefreshLoading,
    isRuntimeAuthProbeLoading,
  };
}

export function shouldPreloadLoginRuntimeOnIntent({
  isLoading,
  isAuthenticated,
  hasLoginRuntime,
}: AuthLoginRuntimePreloadPolicy) {
  return !isLoading && !isAuthenticated && !hasLoginRuntime;
}

export function shouldTriggerPrivyLoginRequest({
  ready,
  requestId,
  lastHandledRequestId,
}: AuthLoginRuntimeTriggerPolicy) {
  return ready && requestId > 0 && lastHandledRequestId !== requestId;
}

export function getLoginAuthenticatedPrivyUserId({
  runtimePrivyUserId,
  tokenPrivyUserId,
}: LoginAuthenticatedUserPolicy) {
  if (runtimePrivyUserId && tokenPrivyUserId) {
    return runtimePrivyUserId === tokenPrivyUserId ? runtimePrivyUserId : null;
  }

  return runtimePrivyUserId ?? tokenPrivyUserId;
}

export function getAuthSubjectForAppGuards({
  completedLoginSubject,
  runtimeSubject,
}: AuthSubjectPolicy) {
  return runtimeSubject ?? completedLoginSubject;
}

export function shouldUseInitialSessionSnapshotForAuthSubject({
  allowUnscopedSnapshot,
  runtimeSubject,
  snapshotActorPrivyUserId,
  snapshotImpersonating,
  snapshotUserPrivyUserId,
}: InitialSessionSnapshotSubjectPolicy) {
  if (!runtimeSubject) return allowUnscopedSnapshot;

  if (snapshotImpersonating) {
    return snapshotActorPrivyUserId === runtimeSubject;
  }

  return snapshotUserPrivyUserId === runtimeSubject;
}
