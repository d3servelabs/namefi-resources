import { config } from '@/lib/env';

export const SKIP_AUTH_STORAGE_KEY = 'namefi-skip-auth';
export const SKIP_AUTH_CHANGE_EVENT = 'skip-auth-change';

export function isSkipAuthAllowedEnvironment(type = config.TYPE): boolean {
  return type === 'local' || type === 'development' || type === 'preview';
}

export function getSkipAuthFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SKIP_AUTH_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSkipAuthInStorage(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      window.localStorage.setItem(SKIP_AUTH_STORAGE_KEY, '1');
    } else {
      window.localStorage.removeItem(SKIP_AUTH_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent(SKIP_AUTH_CHANGE_EVENT));
  } catch {
    // Ignore storage errors.
  }
}

export function isSkipAuthActiveInBrowser(type = config.TYPE): boolean {
  return isSkipAuthAllowedEnvironment(type) && getSkipAuthFromStorage();
}
