import { db, linkSharesTable } from '@namefi-astra/db';
import { and, eq } from 'drizzle-orm';
import { createLogger } from '#lib/logger';
import { validateTweet } from '#lib/twitter/validate-tweet';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

const log = createLogger({ module: 'LinkSharesValidationActivities' });

export interface NormalizedDbLinkShare {
  id: string;
  normalizedDomainName: NamefiNormalizedDomain;
  postUrl: string;
  sharedUrl: string;
  createdAt: Date;
}

export const getTwitterLinkSharesNeedingValidation = async (filters?: {
  campaignKey?: string;
  normalizedDomainName?: NamefiNormalizedDomain;
}): Promise<NormalizedDbLinkShare[]> => {
  const conditions = [eq(linkSharesTable.type, 'twitter')];
  if (filters?.campaignKey) {
    conditions.push(eq(linkSharesTable.campaignKey, filters.campaignKey));
  }
  if (filters?.normalizedDomainName) {
    conditions.push(
      eq(linkSharesTable.normalizedDomainName, filters.normalizedDomainName),
    );
  }

  const rows = await db
    .select({
      id: linkSharesTable.id,
      normalizedDomainName: linkSharesTable.normalizedDomainName,
      postUrl: linkSharesTable.postUrl,
      sharedUrl: linkSharesTable.sharedUrl,
      createdAt: linkSharesTable.createdAt,
    })
    .from(linkSharesTable)
    .where(and(...conditions))
    .orderBy(linkSharesTable.createdAt, linkSharesTable.id);

  return rows.map((r) => ({
    id: r.id,
    normalizedDomainName: r.normalizedDomainName,
    postUrl: r.postUrl,
    sharedUrl: r.sharedUrl,
    createdAt: r.createdAt,
  }));
};

export interface TwitterLinkShareToValidate extends NormalizedDbLinkShare {
  requiredHashtags?: string[];
}

export const validateAndUpdateTwitterLinkShare = async (
  args: TwitterLinkShareToValidate,
) => {
  const { id, normalizedDomainName, postUrl, sharedUrl, requiredHashtags } =
    args;
  try {
    await validateTweet({
      postUrl,
      sharedUrl,
      requiredHashtags,
    });

    await db
      .update(linkSharesTable)
      .set({
        verified: true,
        verifiedAt: new Date(),
      })
      .where(eq(linkSharesTable.id, id));

    log.info({ id, normalizedDomainName }, 'Link share verified');
    return { id, ok: true as const };
  } catch (error) {
    log.warn(
      {
        id,
        normalizedDomainName,
        error: error instanceof Error ? error.message : String(error),
      },
      'Link share validation failed',
    );
    await db
      .update(linkSharesTable)
      .set({ verified: false, verifiedAt: new Date() })
      .where(eq(linkSharesTable.id, id));
    return { id, ok: false as const };
  }
};
