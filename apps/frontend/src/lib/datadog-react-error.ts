'use client';

import { addReactError } from '@datadog/browser-rum-react';
import type { ErrorInfo } from 'react';

export const reportReactBoundaryError = (
  boundaryName: string,
  error: Error,
  info: ErrorInfo,
) => {
  try {
    addReactError(error, info);
  } catch {
    // Datadog SDK not initialized yet or unavailable.
  }
  console.error(`[${boundaryName}] ErrorBoundary caught an error`, error, info);
};
