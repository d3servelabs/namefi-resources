/**
 * Lightweight, client-side read of a domain's best OpenSea listing, used by the
 * parking page's "Instant Buy" CTA.
 *
 * It calls OpenSea's public v2 API directly from the browser, authenticated with
 * a free "instant" API key (https://docs.opensea.io/reference/api-keys) that we
 * request at runtime and cache in `localStorage` — so there is NO backend hop
 * and NO static secret shipped to the client. The whole thing is best-effort:
 * any failure (no key, rate limit, CORS, not listed) resolves to `null`, and the
 * page simply shows no Instant Buy button.
 *
 * Steady state for a returning visitor is a single live request (the API key and
 * the collection slug are both cached); a first-ever visitor pays three.
 */

export type ParkChainName = 'ethereum' | 'base' | 'sepolia' | 'goerli' | string;

export interface BestListing {
  /** Human price for display, e.g. "2.5 ETH". */
  priceLabel: string;
  /** OpenSea item URL where the buyer completes the purchase. */
  itemUrl: string;
}

interface OpenSeaChainConfig {
  apiBaseUrl: string;
  /** v2 chain path segment, e.g. 'ethereum' | 'base' | 'sepolia'. */
  chainSlug: string;
}

const MAINNET_API = 'https://api.opensea.io';
const TESTNET_API = 'https://testnets-api.opensea.io';

function chainConfig(chain: ParkChainName): OpenSeaChainConfig | null {
  switch (chain) {
    case 'ethereum':
      return { apiBaseUrl: MAINNET_API, chainSlug: 'ethereum' };
    case 'base':
      return { apiBaseUrl: MAINNET_API, chainSlug: 'base' };
    case 'sepolia':
      return { apiBaseUrl: TESTNET_API, chainSlug: 'sepolia' };
    case 'goerli':
      return { apiBaseUrl: TESTNET_API, chainSlug: 'goerli' };
    default:
      return null;
  }
}

// #region instant API key (cached in localStorage, mirrors the main app)

const KEY_STORAGE_PREFIX = 'namefi-opensea-api-key:';
/** Refresh a key when it's within this much of its expiry. */
const KEY_REFRESH_GRACE_MS = 24 * 60 * 60 * 1000;

interface StoredKey {
  apiKey: string;
  /** Unix ms, parsed from the `expires_at` ISO timestamp in the response. */
  expiresAtMs: number;
}

function readStoredKey(apiBaseUrl: string): StoredKey | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(
      `${KEY_STORAGE_PREFIX}${apiBaseUrl}`,
    );
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

function writeStoredKey(apiBaseUrl: string, stored: StoredKey): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `${KEY_STORAGE_PREFIX}${apiBaseUrl}`,
      JSON.stringify(stored),
    );
  } catch {
    // Storage quota or disabled — the key just won't persist across reloads.
  }
}

async function getApiKey(apiBaseUrl: string): Promise<string | undefined> {
  const stored = readStoredKey(apiBaseUrl);
  if (stored && stored.expiresAtMs - KEY_REFRESH_GRACE_MS > Date.now()) {
    return stored.apiKey;
  }
  try {
    const response = await fetch(`${apiBaseUrl}/api/v2/auth/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-app-id': 'opensea-js' },
      body: '{}',
    });
    if (!response.ok) return stored?.apiKey;
    const json = (await response.json()) as {
      api_key?: string;
      expires_at?: string;
    };
    if (!json.api_key || !json.expires_at) return stored?.apiKey;
    const expiresAtMs = Date.parse(json.expires_at);
    if (!Number.isFinite(expiresAtMs)) return stored?.apiKey;
    writeStoredKey(apiBaseUrl, { apiKey: json.api_key, expiresAtMs });
    return json.api_key;
  } catch {
    // Rate limit on the key endpoint, offline, CORS, etc. Fall back to whatever
    // we already have cached (possibly stale but might still work) or undefined.
    return stored?.apiKey;
  }
}

// #endregion

// #region collection slug (the listings endpoints are slug-keyed)

/** In-memory `chainSlug:contract → slug | null` cache, deduped by promise. */
const slugCache = new Map<string, Promise<string | null>>();

function resolveCollectionSlug(
  cfg: OpenSeaChainConfig,
  contract: string,
  apiKey: string | undefined,
): Promise<string | null> {
  const cacheKey = `${cfg.chainSlug}:${contract.toLowerCase()}`;
  const cached = slugCache.get(cacheKey);
  if (cached) return cached;
  const pending = (async () => {
    try {
      // The contract endpoint is keyed by address (not token), so it does NOT
      // 404 on freshly-minted tokens the way per-token reads can.
      const response = await fetch(
        `${cfg.apiBaseUrl}/api/v2/chain/${cfg.chainSlug}/contract/${contract}`,
        { headers: apiKey ? { 'X-API-KEY': apiKey } : undefined },
      );
      if (!response.ok) return null;
      const json = (await response.json()) as { collection?: string };
      return json.collection ?? null;
    } catch {
      return null;
    }
  })();
  slugCache.set(cacheKey, pending);
  return pending;
}

// #endregion

/**
 * Format an integer token amount (in the currency's smallest unit) as a trimmed
 * decimal string with its symbol, e.g. (`"2500000000000000000"`, 18, `"ETH"`) →
 * `"2.5 ETH"`. Done with string math first so wei values beyond `2^53` don't
 * lose precision before we hand a small, safe number to `toLocaleString`.
 */
function formatPriceLabel(
  value: string,
  decimals: number,
  currency: string,
): string {
  let digits = value.replace('-', '');
  const negative = value.startsWith('-');
  if (decimals > 0) {
    digits = digits.padStart(decimals + 1, '0');
    const whole = digits.slice(0, digits.length - decimals);
    const fraction = digits.slice(digits.length - decimals).replace(/0+$/, '');
    digits = fraction ? `${whole}.${fraction}` : whole;
  }
  const asNumber = Number(digits);
  const display = Number.isFinite(asNumber)
    ? asNumber.toLocaleString('en-US', { maximumFractionDigits: 4 })
    : digits;
  return `${negative ? '-' : ''}${display} ${currency}`;
}

/**
 * Resolve the best active listing for a parked domain's NamefiNFT, or `null` if
 * it isn't listed (or anything goes wrong). Browser-only — returns `null` during
 * SSR so the server render never blocks on OpenSea.
 */
export async function fetchBestListing(input: {
  contract: string;
  tokenId: string;
  chain: ParkChainName;
  /** OpenSea item URL to buy at, already built by the caller. */
  itemUrl: string;
}): Promise<BestListing | null> {
  if (typeof window === 'undefined') return null;
  const cfg = chainConfig(input.chain);
  if (!cfg) return null;

  const apiKey = await getApiKey(cfg.apiBaseUrl);
  const slug = await resolveCollectionSlug(cfg, input.contract, apiKey);
  if (!slug) return null;

  try {
    const response = await fetch(
      `${cfg.apiBaseUrl}/api/v2/listings/collection/${slug}/nfts/${input.tokenId}/best`,
      { headers: apiKey ? { 'X-API-KEY': apiKey } : undefined },
    );
    if (!response.ok) return null;
    const json = (await response.json()) as {
      price?: {
        current?: { value?: string; decimals?: number; currency?: string };
      };
    };
    const current = json.price?.current;
    if (!current?.value || current.decimals == null) return null;
    return {
      priceLabel: formatPriceLabel(
        current.value,
        current.decimals,
        current.currency ?? 'ETH',
      ),
      itemUrl: input.itemUrl,
    };
  } catch {
    return null;
  }
}
