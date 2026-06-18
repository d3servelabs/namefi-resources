import type OpenAi from 'openai';
import { lazyAsync } from '@namefi-astra/utils/lazy';
import { secrets } from '#lib/env';

/**
 * DeepSeek exposes an OpenAI-compatible API, so we reuse the already-installed
 * `openai` SDK and only swap the base URL + key — no extra provider dependency.
 * See https://api-docs.deepseek.com (the OpenAI SDK works against this base).
 */
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

/** DeepSeek's reasoning model (R1): chain-of-thought, then the final answer. */
export const DEEPSEEK_REASONER_MODEL = 'deepseek-reasoner';
export const DEEPSEEK_V4_FLASH_MODEL = 'deepseek-v4-flash';

/**
 * Lazy async singleton client: built once on first use and reused; concurrent
 * first callers share the in-flight build, and a rejected build is never cached
 * (the next caller retries). Only invoked once {@link getDeepSeekClient} has
 * confirmed a key is configured. The dynamic `import('openai')` mirrors
 * `ai-domain-analysis.ts` (the top-level value import of `openai` is avoided on
 * purpose in this codebase).
 */
const getDeepSeekClientInstance = lazyAsync(async () => {
  const { default: OpenAiConstructor } = await import('openai');
  return new OpenAiConstructor({
    apiKey: secrets.DEEPSEEK_API_KEY,
    baseURL: DEEPSEEK_BASE_URL,
    // Decision summaries are best-effort; don't let a stalled request hang the
    // admin UI behind long SDK-level retries.
    maxRetries: 1,
  });
});

/**
 * Returns the DeepSeek client, or `null` when `DEEPSEEK_API_KEY` is not
 * configured so callers can degrade gracefully instead of throwing.
 */
export async function getDeepSeekClient(): Promise<OpenAi | null> {
  if (!secrets.DEEPSEEK_API_KEY) {
    return null;
  }
  return getDeepSeekClientInstance();
}
