import {
  db,
  domainAiAnalysisTable,
  namefiNftWithAiAnalysisView,
} from '@namefi-astra/db';

import {
  fetchAppraisalReport,
  fetchExplanation,
  NAMEFI_GPT_VERSION,
} from '../../../lib/ai/ai-domain-analysis';
import { createLogger } from '#lib/logger';
import { eq, or, isNull, inArray, not, and } from 'drizzle-orm';
import type { DomainAiAnalysisInsert } from '@namefi-astra/db/types';
import { TEST_CHAINS, type NamefiNormalizedDomain } from '@namefi-astra/utils';

const logger = createLogger({ name: 'ai-analysis-activities' });

/**
 * Get all domains that need AI processing
 */
export async function getAllDomainsNeedingProcessingForNamefiGpt(
  limit?: number,
  regenerateAll?: boolean,
) {
  logger.info(
    { limit, regenerateAll },
    'Getting all domains for AI processing',
  );

  let query = db
    .select({
      tokenId: namefiNftWithAiAnalysisView.tokenId,
      normalizedDomainName: namefiNftWithAiAnalysisView.normalizedDomainName,
      chainId: namefiNftWithAiAnalysisView.chainId,
    })
    .from(namefiNftWithAiAnalysisView)
    .$dynamic();

  // If not regenerating all, only get domains missing AI content
  if (!regenerateAll) {
    query = query.where(
      and(
        not(
          inArray(
            namefiNftWithAiAnalysisView.chainId,
            TEST_CHAINS.map((chain) => chain.id).filter(
              (id) => Number.isSafeInteger(id) && id < 2147483647,
            ), //todo change to bigint
          ),
        ),
        or(
          isNull(namefiNftWithAiAnalysisView.explain),
          isNull(namefiNftWithAiAnalysisView.appraisal),
        ),
      ),
    );
  }

  if (limit) {
    query = query.limit(limit);
  }

  const domains = await query;
  logger.info(
    { count: domains.length, regenerateAll },
    'Retrieved domains for processing',
  );
  return domains.map((domain) => ({
    ...domain,
    tokenId: domain.tokenId.toString(),
  }));
}

/**
 * Process AI analysis for a single domain with atomic transaction
 */
export async function processSingleDomainForNamefiGpt(
  tokenId: string,
  normalizedDomainName: NamefiNormalizedDomain,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate AI content (outside transaction)
    const [explanation, appraisal] = await Promise.all([
      fetchExplanation(normalizedDomainName),
      fetchAppraisalReport(normalizedDomainName),
    ]);

    // Atomic database update
    await db.transaction(async (tx) => {
      const aiData: DomainAiAnalysisInsert = {
        tokenId: tokenId.toString(),
        explain: explanation || undefined,
        appraisal: appraisal || undefined,
        namefiGptVersion: NAMEFI_GPT_VERSION,
        dirty: true,
        normalizedDomainName,
      };

      await tx
        .insert(domainAiAnalysisTable)
        .values(aiData)
        .onConflictDoUpdate({
          target: domainAiAnalysisTable.tokenId,
          set: {
            explain: aiData.explain,
            appraisal: aiData.appraisal,
            namefiGptVersion: aiData.namefiGptVersion,
            dirty: true,
          },
        });
    });

    return { success: true };
  } catch (error) {
    logger.error(
      { error, tokenId, normalizedDomainName },
      'Failed to process domain',
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get domains that are dirty (need marketplace updates)
 */
export async function getDirtyDomains(limit?: number) {
  logger.info({ limit }, 'Getting dirty domains for marketplace updates');

  let query = db
    .select({
      tokenId: namefiNftWithAiAnalysisView.tokenId,
      normalizedDomainName: namefiNftWithAiAnalysisView.normalizedDomainName,
      chainId: namefiNftWithAiAnalysisView.chainId,
    })
    .from(namefiNftWithAiAnalysisView)
    .where(eq(namefiNftWithAiAnalysisView.dirty, true))
    .$dynamic();

  if (limit) {
    query = query.limit(limit);
  }

  const domains = await query;
  logger.info({ count: domains.length }, 'Retrieved dirty domains');
  return domains.map((domain) => ({
    ...domain,
    tokenId: domain.tokenId.toString(),
  }));
}
