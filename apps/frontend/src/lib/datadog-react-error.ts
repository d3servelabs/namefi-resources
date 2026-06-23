'use client';

import type { ErrorInfo } from 'react';
import { logDatadogError } from '@/lib/datadog/logs';

const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  return new Error('Non-Error throwable received');
};

export const reportReactBoundaryError = (
  boundaryName: string,
  error: Error,
  info: ErrorInfo,
) => {
  const userId =
    (globalThis as any)?.userId ?? (globalThis as any)?.privyUserId;
  // Fire-and-forget: Datadog is loaded lazily so it never sits on the eager
  // bundle (this helper is imported by the always-mounted sidebar).
  void logDatadogError(
    `[${boundaryName}${info.digest ? `-${info.digest}` : ''}][${new Date()}] React ErrorBoundary caught an error, for User(${userId}).`,
    {
      source: 'react.error-boundary',
      boundaryName,
      componentStack: info.componentStack,
    },
    toError(error),
  );
  console.error(`[${boundaryName}] ErrorBoundary caught an error`, error, info);
};

export const reportAppRouterError = (
  boundaryName: string,
  error: Error & { digest?: string },
  context: Record<string, unknown> = {},
) => {
  const userId =
    (globalThis as any)?.userId ?? (globalThis as any)?.privyUserId;
  void logDatadogError(
    `[${boundaryName}${error.digest ? `-${error.digest}` : ''}][${new Date()}] App Router error boundary caught an error, for User(${userId}).`,
    {
      source: 'next.app-router.error-boundary',
      boundaryName,
      digest: error.digest,
      ...context,
    },
    toError(error),
  );
};
