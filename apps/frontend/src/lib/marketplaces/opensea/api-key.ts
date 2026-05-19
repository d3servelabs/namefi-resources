import { OpenSeaSDK } from '@opensea/sdk/viem';

/**
 * OpenSea offers a free "instant" API key for client-side use (30-day expiry,
 * https://docs.opensea.io/reference/api-keys). We auto-request one on first use and
 * cache it in `localStorage` keyed by API base URL (mainnet + testnet have separate
 * keys), refreshing only when the cached key is past its `expires_at` window.
 *
 * The key is best-effort — if the request fails (rate limit, offline, etc.) the
 * adapter still works with `undefined` (just rate-limited).
 */

const STORAGE_KEY_PREFIX = 'namefi-opensea-api-key:';

/** Refresh a key when it's within this much of its expiry. */
const REFRESH_GRACE_MS = 24 * 60 * 60 * 1000; // 1 day

interface StoredKey {
  apiKey: string;
  /** Unix ms; from `expires_at` ISO timestamp in the API response. */
  expiresAtMs: number;
}

export async function getOrRequestApiKey(
  apiBaseUrl: string,
): Promise<string | undefined> {
  const stored = readStored(apiBaseUrl);
  if (stored && stored.expiresAtMs - REFRESH_GRACE_MS > Date.now()) {
    return stored.apiKey;
  }
  try {
    const response = await OpenSeaSDK.requestInstantApiKey(apiBaseUrl);
    if (!response?.api_key || !response?.expires_at) return stored?.apiKey;
    const expiresAtMs = Date.parse(response.expires_at);
    if (!Number.isFinite(expiresAtMs)) return stored?.apiKey;
    writeStored(apiBaseUrl, {
      apiKey: response.api_key,
      expiresAtMs,
    });
    return response.api_key;
  } catch {
    // 429 rate limit on the request endpoint, offline, etc. Fall back to whatever
    // we already have cached (possibly expired but might still work) or undefined.
    return stored?.apiKey;
  }
}

function storageKeyFor(apiBaseUrl: string): string {
  return `${STORAGE_KEY_PREFIX}${apiBaseUrl}`;
}

function readStored(apiBaseUrl: string): StoredKey | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKeyFor(apiBaseUrl));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredKey>;
    if (
      typeof parsed.apiKey === 'string' &&
      typeof parsed.expiresAtMs === 'number'
    ) {
      return { apiKey: parsed.apiKey, expiresAtMs: parsed.expiresAtMs };
    }
    return null;
  } catch {
    return null;
  }
}

function writeStored(apiBaseUrl: string, stored: StoredKey): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      storageKeyFor(apiBaseUrl),
      JSON.stringify(stored),
    );
  } catch {
    // Storage quota or disabled — swallow; key just won't persist across reloads.
  }
}
