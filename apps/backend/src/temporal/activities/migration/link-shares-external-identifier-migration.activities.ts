import { db, linkSharesTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { getPublicTweet } from '#lib/twitter/get-public-tweet';

export type LinkShareNeedingBackfill = {
  id: string;
  postUrl: string;
};

export const getAllTwitterLinkShares = async (): Promise<
  LinkShareNeedingBackfill[]
> => {
  const rows = await db
    .select({ id: linkSharesTable.id, postUrl: linkSharesTable.postUrl })
    .from(linkSharesTable)
    .where(eq(linkSharesTable.type, 'twitter'))
    .orderBy(linkSharesTable.createdAt);

  return rows.map((r) => ({ id: r.id, postUrl: r.postUrl }));
};

export const resolveExternalIdentifierFromTweet = async (
  postUrl: string,
): Promise<{
  success: boolean;
  externalIdentifier?: string;
  canonicalUrl?: string;
  error?: string;
}> => {
  const parseUsernameFromStatusUrl = (input: string): string | undefined => {
    try {
      const u = new URL(input);
      const host = u.hostname.toLowerCase();
      if (!(host.endsWith('twitter.com') || host.endsWith('x.com')))
        return undefined;
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length !== 3) return undefined;
      const [maybeUser, keyword, id] = parts;
      if (
        !maybeUser ||
        keyword.toLowerCase() !== 'status' ||
        !/^\d{5,30}$/.test(id)
      )
        return undefined;
      return maybeUser.startsWith('@') ? maybeUser : `@${maybeUser}`;
    } catch {
      return undefined;
    }
  };

  try {
    const fromUrl = parseUsernameFromStatusUrl(postUrl);
    if (fromUrl) {
      return { success: true, externalIdentifier: fromUrl };
    }

    const tweet = await getPublicTweet(postUrl);
    const username = tweet.author.username?.trim();
    if (!username) return { success: false, error: 'Missing author.username' };
    return {
      success: true,
      externalIdentifier: username,
      canonicalUrl: tweet.canonicalUrl,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
};

export const updateLinkShareExternalIdentifier = async (
  id: string,
  externalIdentifier: string,
) => {
  const [updated] = await db
    .update(linkSharesTable)
    .set({ externalIdentifier, type: 'twitter' })
    .where(eq(linkSharesTable.id, id))
    .returning({ id: linkSharesTable.id });
  return { success: !!updated, id: updated?.id };
};
