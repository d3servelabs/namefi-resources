import {
  db,
  huntEdgesTable,
  freeClaimsTable,
  linkSharesTable,
} from '@namefi-astra/db';
import { sql, and, eq, notExists, or, isNotNull } from 'drizzle-orm';
import { createLogger } from '#lib/logger';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

export type CampaignKey = string;

export type CandidateSource = 'UPVOTE' | 'SHARE';

export type Candidate = {
  userId: string;
  source: CandidateSource;
  sourceId: string;
  domainName?: string;
  postUrl?: string;
  sharedUrl?: string;
};

const logger = createLogger({ name: 'candidate-collection' });

/**
 * Collect candidates from hunt upvotes for campaign
 */
export async function collectUpvoteCandidates(): Promise<Candidate[]> {
  try {
    logger.info('Starting collection of upvote candidates for campaign');

    // Query hunt_edges for UPVOTE actions on DOMAIN targets
    // Note: This assumes hunt_edges table structure - adjust column names as needed
    const upvoteQuery = sql`
      SELECT DISTINCT
        he.user_id,
        he.id as source_id,
        he.target_id as domain_name
      FROM hunt_edges he
      WHERE he.action = 'UPVOTE' 
        AND he.target_type = 'DOMAIN'
        AND he.target_id IS NOT NULL
    `;

    const upvoteResults = await db.execute(upvoteQuery);

    const candidates: Candidate[] = upvoteResults.rows.map((row: any) => ({
      userId: row.user_id,
      source: 'UPVOTE' as const,
      sourceId: row.source_id,
      domainName: row.domain_name,
    }));

    logger.info(
      { candidateCount: candidates.length },
      'Upvote candidates collection completed',
    );

    return candidates;
  } catch (error) {
    logger.error({ error }, 'Failed to collect upvote candidates');
    throw error;
  }
}

/**
 * Collect candidates from tweet shares for campaign
 */
export async function collectTweetShareCandidates(
  campaignKey: CampaignKey,
  parentDomain: NamefiNormalizedDomain,
): Promise<Candidate[]> {
  try {
    logger.info(
      { campaignKey },
      'Starting collection of tweet share candidates for campaign',
    );

    // Note: This assumes link_shares table structure - adjust column names as needed
    const shareQuery = sql`
      SELECT DISTINCT
        ls.user_id,
        ls.id as source_id,
        ls.shared_url,
        ls.post_url
      FROM link_shares ls
      WHERE ls.verified = true
        AND ls.group_or_campaign_key = ${campaignKey}
        AND (
          ls.shared_url ILIKE '%.${parentDomain}%' OR
          ls.post_url ILIKE '%${parentDomain}%'
        )
    `;

    const shareResults = await db.execute(shareQuery);

    const candidates: Candidate[] = shareResults.rows.map((row: any) => ({
      userId: row.user_id,
      source: 'SHARE' as const,
      sourceId: row.source_id,
      sharedUrl: row.shared_url,
      postUrl: row.post_url,
    }));

    logger.info(
      { candidateCount: candidates.length },
      'Tweet share candidates collection completed',
    );

    return candidates;
  } catch (error) {
    logger.error({ error }, 'Failed to collect tweet share candidates');
    throw error;
  }
}

/**
 * Get new upvote candidates, excluding users who already received UPVOTE claims
 */
export async function getAllNewUpvoteCandidates(
  campaignKey: CampaignKey,
  parentDomain: NamefiNormalizedDomain,
  votingTargetDomain?: NamefiNormalizedDomain,
): Promise<Candidate[]> {
  try {
    logger.info(
      { campaignKey, parentDomain },
      'Getting new upvote candidates for campaign',
    );

    const upvoteQuery = db
      .selectDistinctOn([huntEdgesTable.sourceId], {
        userId: huntEdgesTable.sourceId,
        sourceId: huntEdgesTable.id,
        domainName: huntEdgesTable.targetId,
      })
      .from(huntEdgesTable)
      .where(
        and(
          eq(huntEdgesTable.action, 'UPVOTE'),
          eq(huntEdgesTable.targetType, 'DOMAIN'),
          votingTargetDomain
            ? eq(huntEdgesTable.targetId, votingTargetDomain)
            : undefined,
          eq(huntEdgesTable.sourceType, 'USER'),
          notExists(
            db
              .select()
              .from(freeClaimsTable)
              .where(
                and(
                  eq(
                    freeClaimsTable.userId,
                    sql`${huntEdgesTable.sourceId}::uuid`,
                  ),
                  eq(freeClaimsTable.groupOrCampaignKey, campaignKey),
                  eq(freeClaimsTable.parentDomain, parentDomain),
                  eq(sql`free_claims.metadata->>'source'`, 'UPVOTE'),
                ),
              ),
          ),
        ),
      );

    const upvoteResults = await upvoteQuery.execute();

    const candidates: Candidate[] = upvoteResults.map((row) => ({
      userId: row.userId,
      source: 'UPVOTE' as const,
      sourceId: row.sourceId,
      domainName: row.domainName,
    }));

    logger.info(
      { campaignKey, candidateCount: candidates.length },
      'New upvote candidates collection completed',
    );

    return candidates;
  } catch (error) {
    logger.error(
      { error, campaignKey },
      'Failed to collect new upvote candidates',
    );
    throw error;
  }
}

/**
 * Get new tweet share candidates, excluding users who already received SHARE claims
 */
export async function getAllNewTweetShareCandidates(
  campaignKey: CampaignKey,
  parentDomain: NamefiNormalizedDomain,
  sharingTargetDomain?: NamefiNormalizedDomain,
): Promise<Candidate[]> {
  try {
    logger.info(
      { campaignKey, parentDomain },
      'Getting new tweet share candidates for campaign',
    );

    const shareQuery = db
      .selectDistinctOn([linkSharesTable.userId], {
        userId: linkSharesTable.userId,
        sourceId: linkSharesTable.id,
        sharedUrl: linkSharesTable.sharedUrl,
        postUrl: linkSharesTable.postUrl,
      })
      .from(linkSharesTable)
      .where(
        and(
          isNotNull(linkSharesTable.userId),
          eq(linkSharesTable.verified, true),
          eq(linkSharesTable.campaignKey, campaignKey),
          sharingTargetDomain
            ? eq(linkSharesTable.normalizedDomainName, sharingTargetDomain)
            : undefined,
          notExists(
            db
              .select()
              .from(freeClaimsTable)
              .where(
                or(
                  and(
                    eq(freeClaimsTable.userId, linkSharesTable.userId),
                    eq(freeClaimsTable.groupOrCampaignKey, campaignKey),
                    eq(freeClaimsTable.parentDomain, parentDomain),
                    eq(sql`free_claims.metadata->>'source'`, 'SHARE'),
                  ),
                  eq(
                    sql`free_claims.metadata->>'sourceId'`,
                    linkSharesTable.id,
                  ),
                ),
              ),
          ),
        ),
      );

    const shareResults = await shareQuery.execute();

    const candidates: Candidate[] = shareResults.map((row) => ({
      userId: row.userId as string,
      source: 'SHARE' as const,
      sourceId: row.sourceId,
      sharedUrl: row.sharedUrl,
      postUrl: row.postUrl,
    }));

    logger.info(
      { campaignKey, candidateCount: candidates.length },
      'New tweet share candidates collection completed',
    );

    return candidates;
  } catch (error) {
    logger.error(
      { error, campaignKey },
      'Failed to collect new tweet share candidates',
    );
    throw error;
  }
}
