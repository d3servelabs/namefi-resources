/**
 * Issuer for the Caddy DNS-JWT park gate.
 *
 * For each authorized host we publish a signed JWT in DNS (as a TXT record
 * at `<NAMEFI_PARK_GATE_LABEL>.<host>`). The Caddy plugin fetches that TXT,
 * verifies the ES256 signature with the matching public key, and uses the
 * `host` / `routes` claims to authorize the request before proxying it
 * upstream. See `caddy/namefi-park-gate/caddy-dns-jwt-gate-prd.md`.
 *
 * Signing is asymmetric (ES256): the backend holds the EC P-256 private key
 * and signs; Caddy holds only the public key. A compromised Caddy node
 * therefore cannot mint tokens for any host (PRD §6).
 *
 * Tokens are cached in Redis so we sign at most once per host per cache
 * window rather than on every DNS query. `exp = iat + TOKEN_TTL` (24h) while
 * the cache/rotation window is shorter (12h), so the oldest token a resolver
 * can ever serve stays comfortably within `exp` — propagation lag never
 * drops legitimate traffic (PRD §4.3).
 */

import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { SignJWT, importPKCS8 } from 'jose';
import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { getRedisClient } from '#lib/redis';

const logger = createLogger({ context: 'park-gate-issuer' });

const SIGNING_ALGORITHM = 'ES256';
export const PARK_GATE_JWT_ISSUER = 'namefi-park-gate';

export interface ParkGateClaims {
  /** Hostname this token authorizes; must equal the request `Host`. */
  host: string;
  /** Route patterns allowed for this host. */
  routes: string[];
}

/**
 * Whether the park gate is configured. When the signing key is absent the
 * gate is disabled: no tokens are issued and the DNS link serves nothing.
 */
export function isParkGateEnabled(): boolean {
  return Boolean(secrets.NAMEFI_PARK_GATE_SIGNING_PRIVATE_KEY);
}

/**
 * A single DNS TXT character-string is capped at 255 bytes (RFC 1035 §3.3.14),
 * but one TXT RR may carry several. A compact ES256 gate JWT runs ~280 bytes,
 * so render it as space-separated quoted <=255-byte character-strings — the
 * standard presentation form, identical to how the existing ENS/forwarding TXT
 * records are quoted. The downstream wire encoder emits them as one
 * multi-string TXT RR, and Go's `net.LookupTXT` (Caddy side) concatenates them
 * back into the original token. A <=255-byte value yields a single `"value"`,
 * matching the prior behavior. Gate JWTs are ASCII (base64url + `.`), so byte
 * length equals string length here.
 */
export const TXT_CHARACTER_STRING_MAX_BYTES = 255;

export function formatGateTxtRdata(value: string): string {
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += TXT_CHARACTER_STRING_MAX_BYTES) {
    chunks.push(value.slice(i, i + TXT_CHARACTER_STRING_MAX_BYTES));
  }
  if (chunks.length === 0) {
    chunks.push('');
  }
  return chunks.map((chunk) => `"${chunk}"`).join(' ');
}

type SigningKey = Awaited<ReturnType<typeof importPKCS8>>;

let signingKeyPromise: Promise<SigningKey> | undefined;

function getSigningKey(): Promise<SigningKey> {
  const pem = secrets.NAMEFI_PARK_GATE_SIGNING_PRIVATE_KEY;
  if (!pem) {
    throw new Error('Park gate signing key is not configured');
  }
  // Import once and memoize — importing a key on every sign is wasteful.
  if (!signingKeyPromise) {
    signingKeyPromise = importPKCS8(pem, SIGNING_ALGORITHM);
  }
  return signingKeyPromise;
}

function cacheKey(host: string): string {
  return `park-gate:jwt:${config.NAMEFI_PARK_GATE_LABEL}:${host}`;
}

async function signGateToken(host: string): Promise<string> {
  const key = await getSigningKey();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + config.NAMEFI_PARK_GATE_TOKEN_TTL_SECONDS;

  const header: { alg: string; typ: string; kid?: string } = {
    alg: SIGNING_ALGORITHM,
    typ: 'JWT',
  };
  if (config.NAMEFI_PARK_GATE_KEY_ID) {
    header.kid = config.NAMEFI_PARK_GATE_KEY_ID;
  }

  return new SignJWT({
    host,
    routes: config.NAMEFI_PARK_GATE_ROUTES,
  } satisfies ParkGateClaims)
    .setProtectedHeader(header)
    .setIssuer(PARK_GATE_JWT_ISSUER)
    .setSubject(host)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(key);
}

/**
 * Return a signed gate JWT for `host`, reusing the Redis-cached token when
 * one is still fresh. Redis failures are non-fatal: we fall back to signing
 * a fresh token so DNS resolution never depends on cache availability.
 *
 * Returns `null` when the gate is disabled (no signing key configured).
 */
export async function getOrIssueGateToken(
  host: NamefiNormalizedDomain | string,
): Promise<string | null> {
  if (!isParkGateEnabled()) {
    return null;
  }

  const key = cacheKey(host);

  try {
    const redis = await getRedisClient();
    const cached = await redis.get(key);
    if (cached) {
      return cached;
    }
  } catch (error) {
    logger.warn({ error, host }, 'Failed to read gate token from cache');
  }

  const token = await signGateToken(host);

  try {
    const redis = await getRedisClient();
    await redis.set(key, token, {
      EX: config.NAMEFI_PARK_GATE_CACHE_TTL_SECONDS,
    });
  } catch (error) {
    logger.warn({ error, host }, 'Failed to write gate token to cache');
  }

  return token;
}

/**
 * Drop the cached token for `host` so the next request re-signs. Useful when
 * a domain is unparked or the signing key is rotated. Non-fatal on failure.
 */
export async function invalidateGateToken(
  host: NamefiNormalizedDomain | string,
): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.del(cacheKey(host));
  } catch (error) {
    logger.warn({ error, host }, 'Failed to invalidate cached gate token');
  }
}
