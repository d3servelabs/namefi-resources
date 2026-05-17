'use client';

/**
 * @deprecated Superseded by `LeaderCoordinator`
 * (`components/notifications/leader/leader-coordinator.tsx`), which
 * elects exactly one tab to poll + play sound + surface OS banners.
 *
 * Kept as a no-op so any lingering imports stay buildable; remove once
 * call sites are gone.
 */
export function useBrowserNotificationWatcher(): void {
  // intentional no-op — see `LeaderCoordinator`
}
