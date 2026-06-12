import type { ExecutionContext } from './types';
import { AsyncLocalStorage } from 'node:async_hooks';
/**
 * Execution context system for tracking execution origin and context
 */
const _executionContextStore = new AsyncLocalStorage<ExecutionContext>();
/**
 * Gets the current execution context
 */
export function getExecutionContext(): ExecutionContext | undefined {
  return _executionContextStore.getStore();
}

export function extendCurrentExecutionContext(context: ExecutionContext) {
  const currentContext = _executionContextStore.getStore();
  const newContext = {
    //TODO: mergeRight
    ...(currentContext ?? {}),
    ...context,
  };
  _executionContextStore.enterWith(newContext as ExecutionContext);
}

/**
 * Sets the execution context for the current async context
 */
export function setExecutionContext(context: ExecutionContext) {
  const currentContext = _executionContextStore.getStore();
  const newContext = {
    ...context,
    trace: {
      depth: (currentContext?.trace?.depth ?? 0) + 1,
      parentContext: currentContext
        ? JSON.stringify(currentContext)
        : undefined,
    },
  };
  _executionContextStore.enterWith(newContext as ExecutionContext);
}

/**
 * Creates a context provider that wraps a function with execution context
 */
export function withExecutionContext<T extends any[], R>(
  context: ExecutionContext,
  fn: (...args: T) => R,
): (...args: T) => R {
  return (...args: T) => {
    return _executionContextStore.run(context, () => fn(...args));
  };
}

/**
 * Helper functions for managing execution context
 */

// Context creators for different execution types
export function createUserContext({
  userId,
  sessionId,
  requestId,
  privyUserId,
}: {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  privyUserId?: string;
}): ExecutionContext {
  return {
    type: 'user',
    user: {
      userId,
      sessionId,
      requestId,
      privyUserId,
    },
  };
}

export function createTemporalContext(
  workflowId?: string,
  runId?: string,
  taskQueue?: string,
  activityName?: string,
): ExecutionContext {
  return {
    type: 'temporal-activity',
    temporal: {
      workflowId,
      runId,
      taskQueue,
      activityName,
    },
  };
}

export function createSystemContext(): ExecutionContext {
  return {
    type: 'system',
  };
}

// Context wrappers for common patterns
export function withUserContext<T extends any[], R>({
  userId,
  sessionId,
  requestId,
  privyUserId,
}: {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  privyUserId?: string;
}): (fn: (...args: T) => R) => (...args: T) => R {
  return (fn: (...args: T) => R) => {
    const context = createUserContext({
      userId,
      sessionId,
      requestId,
      privyUserId,
    });
    return withExecutionContext(context, fn);
  };
}

export function withTemporalContext<T extends any[], R>(
  workflowId?: string,
  runId?: string,
  taskQueue?: string,
  activityName?: string,
): (fn: (...args: T) => R) => (...args: T) => R {
  return (fn: (...args: T) => R) => {
    const context = createTemporalContext(
      workflowId,
      runId,
      taskQueue,
      activityName,
    );
    return withExecutionContext(context, fn);
  };
}

export function withSystemContext<T extends any[], R>(): (
  fn: (...args: T) => Promise<R>,
) => (...args: T) => Promise<R> {
  return (fn: (...args: T) => Promise<R>) => {
    const context = createSystemContext();
    return withExecutionContext(context, fn);
  };
}

// Utility functions
export function isTemporalExecution(): boolean {
  const context = getExecutionContext();
  return context?.type === 'temporal-activity';
}

export function isUserExecution(): boolean {
  const context = getExecutionContext();
  return context?.type === 'user';
}

export function getCurrentUserId(): string | undefined {
  const context = getExecutionContext();
  return context?.user?.userId;
}

export function getCurrentWorkflowId(): string | undefined {
  const context = getExecutionContext();
  return context?.temporal?.workflowId;
}

// Context propagation helpers
export function inheritExecutionContext(): ExecutionContext | undefined {
  return getExecutionContext();
}

export function mergeExecutionContext(
  base: ExecutionContext,
  override: Partial<ExecutionContext>,
): ExecutionContext {
  return {
    ...base,
    ...override,
    temporal: override.temporal
      ? { ...base.temporal, ...override.temporal }
      : base.temporal,
    user: override.user ? { ...base.user, ...override.user } : base.user,
    trace: override.trace ? { ...base.trace, ...override.trace } : base.trace,
  };
}
