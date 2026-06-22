'use client';

import type { NotificationRelatedResource } from '@namefi-astra/common/shared-schemas';
import { useSyncExternalStore } from 'react';

/**
 * Browser Notifications API integration.
 *
 * Spec: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API
 *
 * We use the API additively on top of the in-app bell: when a new
 * notification arrives while the page is open, we ALSO fire an OS
 * banner so the user sees it even when the tab is in the background.
 *
 * Permission is requested directly from a user gesture — clicking the
 * notification bell, or the in-modal "Enable" CTA — so the native browser
 * prompt always sits behind a clear opt-in interaction.
 */

export type BrowserNotificationCapability =
  | 'unsupported'
  | 'default'
  | 'granted'
  | 'denied';

// ---------------------------------------------------------------------------
// Capability + permission
// ---------------------------------------------------------------------------

export function getBrowserNotificationCapability(): BrowserNotificationCapability {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  return window.Notification.permission;
}

/**
 * Request browser notification permission from an explicit user gesture
 * (the notification bell click or the in-modal "Enable" CTA). Safe to call
 * on every click — it only triggers the native dialog while permission is
 * still `default`, and resolves immediately once granted/denied.
 * Returns the resolved capability so callers can update their UI.
 */
export async function requestBrowserNotificationPermissionForce(): Promise<BrowserNotificationCapability> {
  const current = getBrowserNotificationCapability();
  if (
    current === 'unsupported' ||
    current === 'granted' ||
    current === 'denied'
  )
    return current;
  try {
    const result = await window.Notification.requestPermission();
    notifyCapabilityListeners();
    return result;
  } catch {
    return getBrowserNotificationCapability();
  }
}

// ---------------------------------------------------------------------------
// Tiny capability store — `useSyncExternalStore` so the modal CTA can
// react to permission changes without a page reload.
// ---------------------------------------------------------------------------

const capabilityListeners = new Set<() => void>();

function notifyCapabilityListeners(): void {
  for (const listener of capabilityListeners) listener();
}

function subscribeCapability(listener: () => void): () => void {
  capabilityListeners.add(listener);
  // Per the Page Visibility spec, `visibilitychange` fires on
  // `document` — not `window`. Listening on `window` silently never
  // receives the event.
  const onVisibility = () => listener();
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
  }
  return () => {
    capabilityListeners.delete(listener);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
}

function getCapabilityServerSnapshot(): BrowserNotificationCapability {
  return 'unsupported';
}

export function useBrowserNotificationCapability(): BrowserNotificationCapability {
  return useSyncExternalStore(
    subscribeCapability,
    getBrowserNotificationCapability,
    getCapabilityServerSnapshot,
  );
}

// ---------------------------------------------------------------------------
// Surface helper
// ---------------------------------------------------------------------------

const surfacedIds = new Set<string>();

/** Reset surfaced-id tracking. Only used in tests. */
export function __resetSurfacedIdsForTesting(): void {
  surfacedIds.clear();
}

export const NAMEFI_NOTIF_OPEN_EVENT = 'namefi-notif-open' as const;

export type NamefiNotifOpenEventDetail = {
  filter: NotificationRelatedResource | null;
  href: string | null;
};

export type SurfaceBrowserNotificationInput = {
  id: string;
  title: string;
  body: string;
  filter?: NotificationRelatedResource | null;
  href?: string | null;
};

const MAX_BODY_LENGTH = 140;
const INLINE_MD_REGEX =
  /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[([^\]]+)\]\([^)]+\)/g;

/** Strip the inline-markdown grammar we support so OS banners are readable. */
export function stripMarkdownToPlain(
  input: string,
  maxLen = MAX_BODY_LENGTH,
): string {
  const stripped = input.replace(INLINE_MD_REGEX, (_, b, i, c, linkText) => {
    return b ?? i ?? c ?? linkText ?? '';
  });
  const collapsed = stripped.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= maxLen) return collapsed;
  return `${collapsed.slice(0, maxLen - 1)}…`;
}

export function hasSurfaced(id: string): boolean {
  return surfacedIds.has(id);
}

/**
 * Fire a single OS-level notification. Returns `true` if a banner was
 * created. Idempotent against same-id calls within a page session
 * (the `tag` field also gives us a second line of defense).
 */
export function surfaceBrowserNotification(
  input: SurfaceBrowserNotificationInput,
): boolean {
  if (getBrowserNotificationCapability() !== 'granted') return false;
  if (surfacedIds.has(input.id)) return false;

  let notification: Notification;
  try {
    notification = new window.Notification(input.title, {
      body: stripMarkdownToPlain(input.body),
      tag: input.id,
      icon: '/favicon.ico',
      silent: false,
      requireInteraction: true,
      lang: 'en',
    });
  } catch {
    // Construction can throw e.g. when the document is no longer
    // attached. Treat as a soft failure — don't mark the id as
    // surfaced, so the next watcher tick can retry.
    return false;
  }
  surfacedIds.add(input.id);

  notification.onclick = () => {
    try {
      window.focus();
    } catch {
      /* noop */
    }
    notification.close();
    const detail: NamefiNotifOpenEventDetail = {
      filter: input.filter ?? null,
      href: input.href ?? null,
    };
    window.dispatchEvent(new CustomEvent(NAMEFI_NOTIF_OPEN_EVENT, { detail }));
  };

  return true;
}
