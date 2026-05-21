/**
 * Rarible's API rate-limits aggressively on the free tier, and `@rarible/sdk`
 * bursts several calls per order operation — enough to trip the limit (HTTP
 * 429). A short exponential backoff usually clears the per-window limit.
 *
 * Note: a 429 means the key IS recognized — an unauthenticated request gets a
 * 403 ("Api Key is required"). So this is throttling, not an auth failure.
 */

/** HTTP error carrying its status code, so 429s are detectable for retry. */
export class RaribleHttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'RaribleHttpError';
    this.status = status;
  }
}

/** Backoff schedule for reads — kept short so the panel degrades quickly. */
export const READ_RETRY_DELAYS_MS: readonly number[] = [1000, 2500];
/** Backoff schedule for writes — longer; a marketplace write is already slow. */
export const WRITE_RETRY_DELAYS_MS: readonly number[] = [2000, 4000, 8000];

/** Matches a standalone "429" anywhere in an error string. */
const HTTP_429_PATTERN = /\b429\b/;

export function isRaribleRateLimitError(error: unknown): boolean {
  if (!error) return false;
  if ((error as { status?: unknown }).status === 429) return true;
  const message = (
    error instanceof Error ? error.message : String(error)
  ).toLowerCase();
  return (
    HTTP_429_PATTERN.test(message) ||
    message.includes('too many requests') ||
    message.includes('rate limit')
  );
}

/**
 * Run `fn`, retrying with exponential backoff while Rarible responds 429.
 * Non-rate-limit errors are rethrown immediately.
 */
export async function withRaribleRetry<T>(
  fn: () => Promise<T>,
  delaysMs: readonly number[] = WRITE_RETRY_DELAYS_MS,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= delaysMs.length; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRaribleRateLimitError(error) || attempt === delaysMs.length) {
        throw error;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, delaysMs[attempt]);
      });
    }
  }
  throw lastError;
}
