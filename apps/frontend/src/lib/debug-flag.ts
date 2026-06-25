/**
 * Client-only debug-flag gate shared by the wallet-deeplink and SIWE diagnostics.
 *
 * A flag is "on" if ANY of these is true:
 *   - `window[globalKey] === true` (set programmatically, e.g. by the CDP harness)
 *   - the URL carries `?<name>=1`
 *   - `localStorage[<name>] === '1'`
 *
 * `localStorage` access is wrapped in try/catch because Safari private mode,
 * sandboxed iframes, and storage-blocked contexts throw on access — a debug gate
 * must never surface an unrelated error to the caller.
 */
export function isClientDebugFlagEnabled(
  name: string,
  globalKey: string,
): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if ((window as unknown as Record<string, unknown>)[globalKey] === true) {
      return true;
    }
    if (new URLSearchParams(window.location.search).get(name) === '1') {
      return true;
    }
    return window.localStorage?.getItem(name) === '1';
  } catch {
    return false;
  }
}
