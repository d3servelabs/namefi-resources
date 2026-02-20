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
    datadogLogs.logger.error(
      'React ErrorBoundary caught an error',
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
    datadogLogs.logger.error(
      'App Router error boundary caught an error',
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
