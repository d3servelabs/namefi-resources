import { TRPCError } from '@trpc/server';
import Bottleneck from 'bottleneck';
import { z } from 'zod';
import { getPublicTweet, type PublicTweet } from './get-public-tweet';

// A PublicTweet that has been validated by our verifier
export type VerifiedPublicTweet = PublicTweet & {
  readonly __brand: {
    readonly verifiedPublicTweet: true;
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

const resolveLimiter = new Bottleneck({ maxConcurrent: 5, minTime: 50 });
const resolveWithLimiter = (url: string) =>
  resolveLimiter.schedule(() => resolvePotentialShortUrl(url));

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
): Promise<VerifiedPublicTweet> {
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

  // Prepare hashtag expectations
  const expectedHashtagPrefixes = (requiredHashtags || [])
    .map((t) => t.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag.slice(1) : tag))
    .map((bare) => `https://twitter.com/hashtag/${bare.toLowerCase()}`);

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

  const rawLinks = Array.isArray(post.links) ? post.links : [];
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
    if (!linkMatched && resolved === sharedUrl) linkMatched = true;
    if (remainingHashtags.size > 0) {
      const lower = resolved.toLowerCase();
      for (const prefix of Array.from(remainingHashtags)) {
        if (lower.startsWith(prefix)) remainingHashtags.delete(prefix);
      }
    }
  };

  for (let i = 0; i < rawLinks.length; i += batchSize) {
    if (linkMatched && remainingHashtags.size === 0) break;
    const batch = rawLinks.slice(i, i + batchSize);
    const tasks = batch.map(async (l) => {
      if (linkMatched && remainingHashtags.size === 0) return;
      const resolved = await resolveWithLimiter(l);
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

  return post as VerifiedPublicTweet;
}
