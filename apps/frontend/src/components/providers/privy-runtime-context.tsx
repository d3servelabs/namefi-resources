'use client';

import type { LoginModalOptions, PrivyEvents } from '@privy-io/react-auth';
import { createContext, useContext } from 'react';
import type { AuthLogoutCallbacks } from './privy-logout-context';

export const PrivyRuntimeContext = createContext(false);

export function useHasPrivyRuntime() {
  return useContext(PrivyRuntimeContext);
}

export type PrivyRuntimeLoginRequest = {
  id: number;
  options?: LoginModalOptions;
  callbacks?: PrivyEvents['login'];
};

export type PrivyRuntimeLoginSettledResult = {
  privyUserId: string;
};

export type PrivyRuntimeLoginCommand = {
  request: PrivyRuntimeLoginRequest;
  onTriggered: (requestId: number, error?: unknown) => void;
  onAuthenticated: (
    requestId: number,
    result: PrivyRuntimeLoginSettledResult,
  ) => void;
  onFailed: (requestId: number, error: unknown) => void;
};

type PrivyRuntimeLoginCommandHandler = (
  command: PrivyRuntimeLoginCommand,
) => void;
type PrivySessionRefreshCommandHandler = (
  onSettled: (hasToken: boolean) => void,
) => void;
type PrivyRuntimeLogoutCommandHandler = (request?: {
  callbacks?: AuthLogoutCallbacks;
}) => Promise<void>;

let nextCommandHandlerId = 0;
const loginCommandHandlers = new Map<number, PrivyRuntimeLoginCommandHandler>();
const sessionRefreshCommandHandlers = new Map<
  number,
  PrivySessionRefreshCommandHandler
>();
const logoutCommandHandlers = new Map<
  number,
  PrivyRuntimeLogoutCommandHandler
>();

function getLatestHandler<T>(handlers: Map<number, T>) {
  let latest: T | null = null;
  for (const handler of handlers.values()) {
    latest = handler;
  }
  return latest;
}

function registerRuntimeHandler<T>(handlers: Map<number, T>, handler: T) {
  const id = nextCommandHandlerId + 1;
  nextCommandHandlerId = id;
  handlers.set(id, handler);

  return () => {
    handlers.delete(id);
  };
}

export function registerPrivyLoginCommandHandler(
  handler: PrivyRuntimeLoginCommandHandler,
) {
  return registerRuntimeHandler(loginCommandHandlers, handler);
}

export function getPrivyLoginCommandHandler() {
  return getLatestHandler(loginCommandHandlers);
}

export function registerPrivySessionRefreshCommandHandler(
  handler: PrivySessionRefreshCommandHandler,
) {
  return registerRuntimeHandler(sessionRefreshCommandHandlers, handler);
}

export function getPrivySessionRefreshCommandHandler() {
  return getLatestHandler(sessionRefreshCommandHandlers);
}

export function registerPrivyRuntimeLogoutHandler(
  handler: PrivyRuntimeLogoutCommandHandler,
) {
  return registerRuntimeHandler(logoutCommandHandlers, handler);
}

export function getPrivyRuntimeLogoutHandler() {
  return getLatestHandler(logoutCommandHandlers);
}
