import { db, linkSharesTable } from '@namefi-astra/db';
import { and, eq, isNull } from 'drizzle-orm';
import { getPublicTweet } from '#lib/twitter/get-public-tweet';

export type LinkShareNeedingBackfill = {
  id: string;
  postUrl: string;
};

export const getLinkSharesMissingExternalIdentifier = async (
  limit = 100,
): Promise<LinkShareNeedingBackfill[]> => {
  const rows = await db
    .select({ id: linkSharesTable.id, postUrl: linkSharesTable.postUrl })
    .from(linkSharesTable)
    .where(
      and(
        isNull(linkSharesTable.externalIdentifier),
        eq(linkSharesTable.type, 'twitter'),
      ),
    )
    .orderBy(linkSharesTable.createdAt)
    .limit(limit);

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
  try {
    const tweet = await getPublicTweet(postUrl);
    const username = tweet.author.username?.trim();
    if (!username) {
      return { success: false, error: 'Missing author.username' };
    }
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
