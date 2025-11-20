import { eq, sql } from 'drizzle-orm';
import { pgView, QueryBuilder } from 'drizzle-orm/pg-core';
import { domainAiAnalysisTable } from '../../schema';
import { db } from '../../client';
import { namefiNftCte, namefiNftView } from './namefi-nft';

const qb = new QueryBuilder();

/**
 * AI View - combines namefi_nft_view with namefi_ai.domain_ai_analysis
 * This view provides a unified interface for accessing both NFT and AI analysis data
 */
export const namefiNftWithAiAnalysisCte = qb
  .$with('namefi_nft_with_ai_analysis_cte')
  .as((qb) => {
    return qb
      .with(namefiNftCte)
      .select({
        // NFT data from namefi_nft_view
        tokenId: namefiNftView.tokenId,
        normalizedDomainName: namefiNftView.normalizedDomainName,
        expirationTimeInSeconds: namefiNftView.expirationTimeInSeconds,
        expirationTime: namefiNftView.expirationTime,
        isLocked: namefiNftView.isLocked,
        ownerAddress: namefiNftView.ownerAddress,
        chainId: namefiNftView.chainId,
        lastUpdatedBlock: namefiNftView.lastUpdatedBlock,
        lastUpdatedTimestamp: namefiNftView.lastUpdatedTimestamp,
        // AI analysis data from namefi_ai.ai_collection (LEFT JOIN to include NFTs without AI data)
        explain: domainAiAnalysisTable.explain,
        appraisal: domainAiAnalysisTable.appraisal,
        namefiGptVersion: domainAiAnalysisTable.namefiGptVersion,
        dirty: domainAiAnalysisTable.dirty,
        aiAnalysisCreatedAt: sql<Date>`${domainAiAnalysisTable.createdAt}`.as(
          'ai_analysis_created_at',
        ),
        aiAnalysisUpdatedAt: sql<Date>`${domainAiAnalysisTable.updatedAt}`.as(
          'ai_analysis_updated_at',
        ),
      })
      .from(namefiNftView)
      .leftJoin(
        domainAiAnalysisTable,
        eq(namefiNftView.tokenId, domainAiAnalysisTable.tokenId),
      );
  });

/**
 * [REPLACED WITH CTE] (deprecated view)
 * This is a workaround because drizzle does not handle column disambiguation correctly with CTEs.
 * We need to create a view to avoid column name conflicts.
 * @deprecated This view is deprecated and will be removed in the future.
 * @see namefiNftWithAiAnalysisCte for the new CTE.
 * you still need to include the CTE in the query like this:
 * ```typescript
 * const result = await db
 *   .with(namefiNftWithAiAnalysisCte)
 *   .select()
 *   .from(namefiNftWithAiAnalysisView)
 *   .limit(1);
 * ```
 */
export const __Internal_namefiNftWithAiAnalysisView = pgView(
  'namefi_nft_with_ai_analysis_cte',
).as((qb) =>
  qb
    .select({
      // NFT data from namefi_nft_view
      tokenId: namefiNftView.tokenId,
      normalizedDomainName: namefiNftView.normalizedDomainName,
      expirationTimeInSeconds: namefiNftView.expirationTimeInSeconds,
      expirationTime: namefiNftView.expirationTime,
      isLocked: namefiNftView.isLocked,
      ownerAddress: namefiNftView.ownerAddress,
      chainId: namefiNftView.chainId,
      lastUpdatedBlock: namefiNftView.lastUpdatedBlock,
      lastUpdatedTimestamp: namefiNftView.lastUpdatedTimestamp,
      // AI analysis data from namefi_ai.ai_collection (LEFT JOIN to include NFTs without AI data)
      explain: domainAiAnalysisTable.explain,
      appraisal: domainAiAnalysisTable.appraisal,
      namefiGptVersion: domainAiAnalysisTable.namefiGptVersion,
      dirty: domainAiAnalysisTable.dirty,
      aiAnalysisCreatedAt: sql<Date>`${domainAiAnalysisTable.createdAt}`.as(
        'ai_analysis_created_at',
      ),
      aiAnalysisUpdatedAt: sql<Date>`${domainAiAnalysisTable.updatedAt}`.as(
        'ai_analysis_updated_at',
      ),
    })
    .from(namefiNftView)
    .leftJoin(
      domainAiAnalysisTable,
      eq(namefiNftView.tokenId, domainAiAnalysisTable.tokenId),
    ),
);

async function _selectFromNamefiNftWithAiAnalysisView() {
  const res = await db
    .with(namefiNftWithAiAnalysisCte)
    .select()
    .from(namefiNftWithAiAnalysisCte)
    .limit(1);
  return res[0];
}

export type NamefiNftWithAiAnalysisSelect = Awaited<
  ReturnType<typeof _selectFromNamefiNftWithAiAnalysisView>
>;
