'use client';

import { datadogLogs } from '@datadog/browser-logs';
import type { ErrorInfo } from 'react';

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
  try {
    const userId =
      (globalThis as any)?.userId ?? (globalThis as any)?.privyUserId;
    datadogLogs.logger.error(
      `[${boundaryName}${info.digest ? `-${info.digest}` : ''}][${new Date()}] React ErrorBoundary caught an error, for User(${userId}).`,
      {
        source: 'react.error-boundary',
        boundaryName,
        componentStack: info.componentStack,
      },
      toError(error),
    );
  } catch {
    // Datadog SDK not initialized yet or unavailable.
  }
  console.error(`[${boundaryName}] ErrorBoundary caught an error`, error, info);
};

export const reportAppRouterError = (
  boundaryName: string,
  error: Error & { digest?: string },
  context: Record<string, unknown> = {},
) => {
  try {
    const userId =
      (globalThis as any)?.userId ?? (globalThis as any)?.privyUserId;
    datadogLogs.logger.error(
      `[${boundaryName}${error.digest ? `-${error.digest}` : ''}][${new Date()}] App Router error boundary caught an error, for User(${userId}).`,
      {
        source: 'next.app-router.error-boundary',
        boundaryName,
        digest: error.digest,
        ...context,
      },
      toError(error),
    );
  } catch {
    // Datadog SDK not initialized yet or unavailable.
  }
};
