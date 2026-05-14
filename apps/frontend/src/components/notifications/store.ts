'use client';

import { useSyncExternalStore } from 'react';

import type {
  NotificationsModalFilter,
  NotificationsModalState,
} from './types';

/**
 * Module-level singleton for notifications-modal open/filter state.
 *
 * Mirrors the `useSyncExternalStore` pattern from `use-skip-auth.ts`. We
 * deliberately avoid a React Context provider here — adding new providers
 * to the app shell is expensive in this codebase (see CLAUDE.md
 * performance guardrails). Every bell instance and the single modal
 * subscribe to this store directly.
 */

let state: NotificationsModalState = { isOpen: false, filter: null };
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): NotificationsModalState {
  return state;
}

function getServerSnapshot(): NotificationsModalState {
  return { isOpen: false, filter: null };
}

export function openNotificationsModal(
  filter: NotificationsModalFilter = null,
): void {
  state = { isOpen: true, filter };
  emit();
}

export function closeNotificationsModal(): void {
  if (!state.isOpen) return;
  state = { isOpen: false, filter: state.filter };
  emit();
}

export function setNotificationsModalOpen(isOpen: boolean): void {
  if (state.isOpen === isOpen) return;
  state = { isOpen, filter: isOpen ? state.filter : state.filter };
  emit();
}

export function useNotificationsModalState(): NotificationsModalState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
