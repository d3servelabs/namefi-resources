'use client';

import { useEffect, type RefObject } from 'react';

const STORAGE_KEY = 'namefi-notifications-renders-v1';
const RENDER_THRESHOLD = 10;
const COOLDOWN_MS = 1500;
const PRUNE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type RenderEntry = {
  renderCount: number;
  /** ms timestamp of most recent increment; used for cooldown + pruning */
  lastSeenAt: number;
};

type RenderStore = Record<string, RenderEntry>;

function safeReadStore(): RenderStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as RenderStore)
      : {};
  } catch {
    return {};
  }
}

function safeWriteStore(store: RenderStore): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Quota / disabled storage — silently give up; auto-mark just won't fire.
  }
}

function pruneStore(store: RenderStore): RenderStore {
  const cutoff = Date.now() - PRUNE_MAX_AGE_MS;
  const out: RenderStore = {};
  for (const [id, entry] of Object.entries(store)) {
    if (entry.lastSeenAt >= cutoff) out[id] = entry;
  }
  return out;
}

let didPrune = false;
function ensurePrunedOnce(): void {
  if (didPrune || typeof window === 'undefined') return;
  didPrune = true;
  const pruned = pruneStore(safeReadStore());
  safeWriteStore(pruned);
}

function recordRender(notificationId: string): number {
  const store = safeReadStore();
  const existing = store[notificationId];
  const now = Date.now();
  if (existing && now - existing.lastSeenAt < COOLDOWN_MS) {
    // Same intersect event firing rapidly — debounce.
    return existing.renderCount;
  }
  const next: RenderEntry = {
    renderCount: (existing?.renderCount ?? 0) + 1,
    lastSeenAt: now,
  };
  store[notificationId] = next;
  safeWriteStore(store);
  return next.renderCount;
}

function clearRecord(notificationId: string): void {
  const store = safeReadStore();
  if (!(notificationId in store)) return;
  delete store[notificationId];
  safeWriteStore(store);
}

export type UseNotificationRenderTrackingOptions = {
  /** Notification id under the bell. */
  notificationId: string;
  /**
   * If the row is already seen we don't track or fire the auto-mark — there
   * is nothing useful to do.
   */
  isSeen: boolean;
  /** Ref to the visible row element. */
  elementRef: RefObject<HTMLElement | null>;
  /** Called when render count reaches the threshold. Caller handles the mutation. */
  onThresholdReached: () => void;
};

/**
 * Tracks how many times an `<li>` enters the viewport and, once the row has
 * been on-screen `RENDER_THRESHOLD` times across sessions (stored in
 * localStorage), invokes `onThresholdReached` exactly once. Designed so the
 * caller can then fire a `markAsSeen({ autoMarked: true })` mutation.
 *
 * SSR-safe and quota-safe — every storage path is guarded.
 */
export function useNotificationRenderTracking({
  notificationId,
  isSeen,
  elementRef,
  onThresholdReached,
}: UseNotificationRenderTrackingOptions): void {
  useEffect(() => {
    ensurePrunedOnce();
  }, []);

  useEffect(() => {
    if (isSeen) return;
    const target = elementRef.current;
    if (!target) return;
    if (
      typeof window === 'undefined' ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    let fired = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const count = recordRender(notificationId);
          if (!fired && count >= RENDER_THRESHOLD) {
            fired = true;
            onThresholdReached();
            clearRecord(notificationId);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [notificationId, isSeen, elementRef, onThresholdReached]);
}
