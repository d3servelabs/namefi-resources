import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getPublicTweet, type PublicTweet } from './get-public-tweet';
import { logger as rootLogger } from '#lib/logger';

const logger = rootLogger.child({ context: 'validateTweet' });

// A PublicTweet that has been validated by our verifier
export type ValidatedPublicTweet = PublicTweet & {
  readonly __brand: {
    readonly validatedPublicTweet: true;
  };
};

function isValidTweetStatusUrl(input: string): boolean {
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();
    if (!(host.endsWith('twitter.com') || host.endsWith('x.com'))) return false;

    // Expect path like "/{username}/status/{id}" (allow optional trailing slash)
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length !== 3) return false;
    const [username, keyword, id] = segments;
    if (!username) return false;
    if (keyword.toLowerCase() !== 'status') return false;
    if (!/^\d{5,30}$/.test(id)) return false;
    return true;
  } catch {
    return false;
  }
}

async function resolvePotentialShortUrl(input: string): Promise<string> {
  try {
    const u = new URL(input);
    if (u.hostname.toLowerCase() !== 't.co') return input;

    try {
      const headRes = await fetch(input, {
        method: 'HEAD',
        redirect: 'follow',
      });
      if (headRes.ok) {
        return headRes.url || input;
      }
    } catch {}

    const getRes = await fetch(input, { method: 'GET', redirect: 'follow' });
    if (getRes.ok) return getRes.url || input;
    return input;
  } catch {
    return input;
  }
}

function normalizeUrlForComparison(input: string): string {
  try {
    const u = new URL(input);
    // Normalize host case and strip default ports
    u.hostname = u.hostname.toLowerCase();
    if (
      (u.protocol === 'https:' && u.port === '443') ||
      (u.protocol === 'http:' && u.port === '80')
    ) {
      u.port = '';
    }
    // Ensure stable query parameter ordering
    if (u.search) {
      const entries = Array.from(u.searchParams.entries()).sort(
        ([ak, av], [bk, bv]) => ak.localeCompare(bk) || av.localeCompare(bv),
      );
      const sp = new URLSearchParams();
      for (const [k, v] of entries) sp.append(k, v);
      u.search = sp.toString();
    }
    return u.toString();
  } catch {
    return input.trim();
  }
}

const validateTweetArgsSchema = z.object({
  postUrl: z.string().url('Invalid post URL'),
  sharedUrl: z.string().url('Invalid shared URL'),
  expectedUsername: z
    .string()
    .regex(/^@?[A-Za-z0-9_]{1,15}$/)
    .optional(),
  requiredHashtags: z
    .array(z.string().regex(/^#[\p{L}0-9_]+$/u, 'Hashtag must start with #'))
    .optional(),
});

export type ValidateTweetArgs = z.infer<typeof validateTweetArgsSchema>;

export async function validateTweet(
  args: ValidateTweetArgs,
): Promise<ValidatedPublicTweet> {
  const parsed = validateTweetArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid input.' });
  }
  const { postUrl, sharedUrl, expectedUsername, requiredHashtags } =
    parsed.data;

  // Basic X/Twitter status URL validation
  if (!isValidTweetStatusUrl(postUrl)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid X URL format. Please provide a valid post URL.',
    });
  }
  let post: PublicTweet;
  try {
    post = await getPublicTweet(postUrl);
  } catch {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Unable to verify post.',
    });
  }

  // Prepare hashtag expectations (support twitter.com and x.com)
  const expectedHashtagPrefixes = (requiredHashtags || [])
    .map((t) => t.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag.slice(1) : tag))
    .flatMap((bare) => {
      const lower = bare.toLowerCase();
      return [
        `https://twitter.com/hashtag/${lower}`,
        `https://x.com/hashtag/${lower}`,
      ];
    });

  // Optional author validation
  if (expectedUsername) {
    const expected = expectedUsername.replace(/^@/, '').toLowerCase();
    const actual = post.author.username.replace(/^@/, '').toLowerCase();
    if (!actual || actual !== expected) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Tweet must be posted by @${expected}.`,
      });
    }
  }

  const normalizedSharedUrl = normalizeUrlForComparison(sharedUrl);
  const rawLinks = Array.isArray(post.links) ? post.links : [];
  logger.info(
    {
      postUrl,
      sharedUrl,
      normalizedSharedUrl,
      rawLinkCount: rawLinks.length,
      rawLinks,
    },
    'Tweet raw links extracted',
  );
  if (rawLinks.length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Tweet must include the provided link.',
    });
  }

  let linkMatched = false;
  const remainingHashtags = new Set(expectedHashtagPrefixes);
  const batchSize = 5;

  const checkResolved = (resolved: string) => {
    const normalized = normalizeUrlForComparison(resolved);
    if (!linkMatched && normalized === normalizedSharedUrl) linkMatched = true;
  };

  const checkHashtag = (urlStr: string) => {
    try {
      const u = new URL(urlStr);
      const host = u.hostname.toLowerCase();
      if (!(host.endsWith('twitter.com') || host.endsWith('x.com')))
        return false;
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length < 2 || parts[0] !== 'hashtag') return false;
      const tag = parts[1]?.toLowerCase();
      if (!tag) return false;
      const baseCandidates = [
        `https://twitter.com/hashtag/${tag}`,
        `https://x.com/hashtag/${tag}`,
      ];
      let matched = false;
      for (const base of baseCandidates) {
        if (remainingHashtags.has(base)) {
          remainingHashtags.delete(base);
          matched = true;
        }
      }
      if (matched)
        logger.debug({ url: urlStr, tag }, 'Matched hashtag without resolving');
      return matched;
    } catch {
      return false;
    }
  };

  for (let i = 0; i < rawLinks.length; i += batchSize) {
    if (linkMatched && remainingHashtags.size === 0) break;
    const batch = rawLinks.slice(i, i + batchSize);
    const tasks = batch.map(async (l) => {
      if (linkMatched && remainingHashtags.size === 0) return;
      // Hashtag links are matched directly; no network resolution
      if (checkHashtag(l)) return;
      // Only resolve t.co short links; otherwise use as-is
      try {
        const u = new URL(l);
        if (u.hostname.toLowerCase() !== 't.co') {
          checkResolved(l);
          return;
        }
      } catch {}

      const resolved = await resolvePotentialShortUrl(l);
      logger.debug({ original: l, resolved }, 'Resolved tweet link');
      checkResolved(resolved);
    });
    await Promise.allSettled(tasks);
  }

  if (!linkMatched) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Tweet must include the provided link.',
    });
  }
  if (remainingHashtags.size > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Tweet must include required hashtag(s).',
    });
  }

  return post as ValidatedPublicTweet;
}
