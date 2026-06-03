'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

/**
 * Tracks which announcements the user has dismissed, persisted to
 * localStorage so it survives reloads and works for anonymous visitors.
 *
 * Each entry is keyed by `${id}:${updatedAtISO}` so that editing an
 * announcement (which bumps its `updatedAt`) re-shows it to users who had
 * dismissed the previous version. Mirrors the cross-tab sync approach used by
 * `use-skip-auth`.
 */

const STORAGE_KEY = 'namefi-dismissed-announcements';
const CHANGE_EVENT = 'namefi-dismissed-announcements-change';

function dismissalKey(id: string, updatedAt: Date): string {
  return `${id}:${updatedAt.toISOString()}`;
}

function readRaw(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function parse(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === 'string')
      : [];
  } catch {
    return [];
  }
}

function writeKeys(keys: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // Ignore storage errors (e.g. private mode / quota).
  }
}

function subscribe(callback: () => void): () => void {
  const handleChange = () => callback();
  window.addEventListener(CHANGE_EVENT, handleChange);
  window.addEventListener('storage', handleChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handleChange);
    window.removeEventListener('storage', handleChange);
  };
}

function getServerSnapshot(): string {
  return '';
}

export function useDismissedAnnouncements() {
  // Returning the raw string keeps the snapshot referentially stable.
  const raw = useSyncExternalStore(subscribe, readRaw, getServerSnapshot);
  const dismissedKeys = useMemo(() => new Set(parse(raw)), [raw]);

  const isDismissed = useCallback(
    (id: string, updatedAt: Date) =>
      dismissedKeys.has(dismissalKey(id, updatedAt)),
    [dismissedKeys],
  );

  const dismiss = useCallback((id: string, updatedAt: Date) => {
    const next = new Set(parse(readRaw()));
    next.add(dismissalKey(id, updatedAt));
    writeKeys(Array.from(next));
  }, []);

  return { isDismissed, dismiss };
}
