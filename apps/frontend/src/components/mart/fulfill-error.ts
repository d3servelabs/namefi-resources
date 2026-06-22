/**
 * Pure error-classification for the `/mart` Buy Now flow. Extracted from the
 * hook so it can be unit-tested without pulling in React / wagmi / Privy.
 */

// Match *user-initiated* aborts only. A bare "denied" is too broad — it would
// mask real failures like "permission denied" / "execution reverted: ...
// denied" behind the soft generic copy. Require the wallet-rejection phrasing,
// plus an explicit connect-cancellation.
const WALLET_REJECTION_RE =
  /\buser (rejected|denied|cancell?ed)\b|rejected the request|denied transaction|connection (was )?cancell?ed/i;

// OpenSea gates its API behind a key; when the per-user instant key can't be
// issued (its endpoint caps issuance at 3/hour/IP) the calls fail with
// "Missing an API Key" / 429. That's transient and retryable, not a dead end.
const RATE_LIMITED_RE =
  /missing an api key|api key[^.]*required|\b429\b|too many requests|rate limit/i;

export interface BuyErrorMessages {
  /** Generic soft line (also used for an expected wallet rejection). */
  fallback: string;
  /** Shown when OpenSea is rate-limiting / no API key could be obtained. */
  rateLimited: string;
}

/**
 * Turn a thrown purchase error into a short, human message.
 *
 * - A wallet rejection is an expected user action → the soft generic line.
 * - An OpenSea key / rate-limit failure → a clear "try again shortly" message
 *   (not the cryptic "Missing an API Key").
 * - Anything else (RPC, chain, fulfillment) → surface the actual reason
 *   (trimmed) so it's reportable and debuggable, never masked behind "try
 *   again".
 */
export function toBuyErrorMessage(
  error: unknown,
  messages: BuyErrorMessages,
): string {
  const message = error instanceof Error ? error.message : String(error);
  if (WALLET_REJECTION_RE.test(message)) {
    return messages.fallback;
  }
  if (RATE_LIMITED_RE.test(message)) {
    return messages.rateLimited;
  }
  const trimmed = message.trim();
  if (!trimmed) return messages.fallback;
  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
}
