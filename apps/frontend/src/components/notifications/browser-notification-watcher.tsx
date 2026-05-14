'use client';

import { useBrowserNotificationWatcher } from './use-browser-notification-watcher';

/**
 * Headless mount-point. Lives once at the top of `Main` so the
 * OS-notification logic runs exactly once per page, regardless of how
 * many bells are on screen.
 */
export function BrowserNotificationWatcher() {
  useBrowserNotificationWatcher();
  return null;
}
