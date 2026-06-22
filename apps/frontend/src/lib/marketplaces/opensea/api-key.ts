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
  fallbackKey?: string,
): Promise<string | undefined> {
  const stored = readStored(apiBaseUrl);
  if (stored && stored.expiresAtMs - REFRESH_GRACE_MS > Date.now()) {
    return stored.apiKey;
  }
  const response = await requestInstantApiKeyWithRetry(apiBaseUrl);
  if (response?.api_key) {
    // Cache only when the expiry parses; either way the freshly-issued key is
    // usable now, so return it rather than discarding a good key over a bad
    // (or missing) `expires_at`.
    const expiresAtMs = response.expires_at
      ? Date.parse(response.expires_at)
      : Number.NaN;
    if (Number.isFinite(expiresAtMs)) {
      writeStored(apiBaseUrl, { apiKey: response.api_key, expiresAtMs });
    }
    return response.api_key;
  }
  // Issuance failed. Prefer the caller's configured fallback (dev) key over the
  // cached key — otherwise a *stale* cached key (truthy) would silently mask the
  // env fallback. Only fall through to the cached key when it's still valid
  // (just near-expiry); a fully-expired key is dropped since it would 401.
  if (fallbackKey) return fallbackKey;
  if (stored && stored.expiresAtMs > Date.now()) return stored.apiKey;
  return undefined;
}

const MAX_INSTANT_KEY_ATTEMPTS = 2;

/**
 * Request an instant key, retrying once on a *transient* failure. The endpoint
 * caps issuance at 3 keys/hour/IP, so retrying a 429 just burns more against
 * that cap — we bail immediately on rate-limit and let the caller fall back to
 * a cached or env key. Only network/5xx-style blips get a second attempt.
 */
async function requestInstantApiKeyWithRetry(
  apiBaseUrl: string,
): Promise<Awaited<ReturnType<typeof OpenSeaSDK.requestInstantApiKey>> | null> {
  for (let attempt = 1; attempt <= MAX_INSTANT_KEY_ATTEMPTS; attempt++) {
    try {
      return await OpenSeaSDK.requestInstantApiKey(apiBaseUrl);
    } catch (error) {
      if (attempt >= MAX_INSTANT_KEY_ATTEMPTS || isRateLimited(error)) {
        return null;
      }
      await sleep(400 * attempt);
    }
  }
  return null;
}

function isRateLimited(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /\b429\b|too many requests|rate limit/i.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
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
